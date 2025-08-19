import { TRUCHAS_ENDPOINTS, LECHUGAS_ENDPOINTS } from "../config/api"

// Datos de referencia para calibración del modelo de truchas
const DATOS_REFERENCIA_TRUCHAS = [
  { meses: 0, longitud: 2.5 },
  { meses: 1, longitud: 5.0 },
  { meses: 2, longitud: 8.0 },
  { meses: 3, longitud: 12.0 },
  { meses: 4, longitud: 20.0 },
  { meses: 5, longitud: 32.5 }, // Promedio de 30-35
  { meses: 6, longitud: 40.0 }, // Promedio de 38-42
  { meses: 7, longitud: 46.5 }, // Promedio de 45-48
  { meses: 8, longitud: 52.5 }, // Promedio de 50-55
]

// Función para hacer fetch con timeout mejorado
const fetchWithTimeout = async (url: string, timeout = 15000) => {
  try {
    console.log(`🔄 Fetching: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Data received from ${url}:`, data.metadata ? `${data.datos?.length || 0} días` : typeof data)
    return data
  } catch (error) {
    if (typeof error === "object" && error !== null && "name" in error && (error as any).name === "AbortError") {
      console.error(`⏰ Timeout fetching ${url}`)
      throw new Error("Timeout: La solicitud tardó demasiado")
    }
    console.error(`❌ Error fetching ${url}:`, error)
    throw error
  }
}

// Función para validar y limpiar números de forma ULTRA ROBUSTA
const validarNumero = (valor: any, defaultValue = 0): number => {
  // Si es null, undefined, string vacía, etc.
  if (valor === null || valor === undefined || valor === "" || valor === "null" || valor === "undefined") {
    return defaultValue
  }

  // Convertir a número
  const num = Number(valor)

  // Verificar si es un número válido y finito
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue
  }

  return num
}

// Función para obtener datos por rango de días y calcular promedios diarios
const obtenerDatosPorDias = async (endpoint: string, diasAtras = 30) => {
  const promediosPorDia: { [dia: number]: number[] } = {}
  const segundosPorDia = 86400 // 24 horas * 60 minutos * 60 segundos

  console.log(`📅 Obteniendo datos de los últimos ${diasAtras} días...`)

  // Obtener datos día por día
  for (let dia = 0; dia < diasAtras; dia++) {
    const startSeconds = dia * segundosPorDia
    const endSeconds = (dia + 1) * segundosPorDia
    const url = `${endpoint}?startSeconds=${startSeconds}&endSeconds=${endSeconds}`

    try {
      const datosDelDia = await fetchWithTimeout(url, 5000)

      if (Array.isArray(datosDelDia) && datosDelDia.length > 0) {
        // Extraer valores numéricos del día
        const valores = datosDelDia
          .map((item: any) => {
            // Intentar extraer el valor según el tipo de dato
            let valor = 0

            if (typeof item === "number") {
              valor = item
            } else if (item && typeof item === "object") {
              // Para truchas
              valor =
                item.longitudCm ||
                item.temperaturaC ||
                item.conductividadUsCm ||
                item.pH ||
                // Para lechugas
                item.alturaCm ||
                item.areaFoliarCm2 ||
                item.humedadPorcentaje ||
                // Fallback genérico
                item.value ||
                0
            }

            return validarNumero(valor, 0)
          })
          .filter((v) => v > 0)

        if (valores.length > 0) {
          promediosPorDia[dia] = valores
          console.log(`📊 Día ${dia}: ${valores.length} registros`)
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error obteniendo datos del día ${dia}:`, error instanceof Error ? error.message : String(error))
      // Continuar con el siguiente día
    }
  }

  // Calcular promedios diarios
  const promediosFinales: number[] = []
  const diasConDatos: number[] = []

  Object.keys(promediosPorDia).forEach((diaStr) => {
    const dia = Number.parseInt(diaStr)
    const valores = promediosPorDia[dia]

    if (valores && valores.length > 0) {
      const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length
      const promedioValido = validarNumero(promedio, 0)
      if (promedioValido > 0) {
        promediosFinales.push(promedioValido)
        diasConDatos.push(dia)
      }
    }
  })

  console.log(`✅ Procesados ${promediosFinales.length} días con datos válidos`)

  return {
    valores: promediosFinales,
    dias: diasConDatos,
    totalDias: promediosFinales.length,
  }
}

// Función de regresión lineal simple con validación ULTRA ROBUSTA
export const regresionLineal = (x: number[], y: number[]) => {
  if (!Array.isArray(x) || !Array.isArray(y)) {
    throw new Error("Los datos deben ser arrays")
  }

  if (x.length !== y.length || x.length < 2) {
    throw new Error("Datos insuficientes para regresión")
  }

  // Validar que todos los valores sean números válidos
  const xValidos = x.map((val) => validarNumero(val, 0)).filter((val) => val !== 0)
  const yValidos = y.map((val) => validarNumero(val, 0)).filter((val) => val !== 0)

  if (xValidos.length < 2 || yValidos.length < 2) {
    throw new Error("No hay suficientes datos válidos para regresión")
  }

  // Usar la longitud mínima para evitar problemas
  const minLength = Math.min(xValidos.length, yValidos.length)
  const xFinal = xValidos.slice(0, minLength)
  const yFinal = yValidos.slice(0, minLength)

  const n = xFinal.length
  const sumX = xFinal.reduce((a, b) => validarNumero(a, 0) + validarNumero(b, 0), 0)
  const sumY = yFinal.reduce((a, b) => validarNumero(a, 0) + validarNumero(b, 0), 0)
  const sumXY = xFinal.reduce(
    (sum, xi, i) => validarNumero(sum, 0) + validarNumero(xi, 0) * validarNumero(yFinal[i], 0),
    0,
  )
  const sumXX = xFinal.reduce((sum, xi) => validarNumero(sum, 0) + validarNumero(xi, 0) * validarNumero(xi, 0), 0)

  const denominator = n * sumXX - sumX * sumX
  if (Math.abs(denominator) < 1e-10) {
    throw new Error("No se puede calcular la regresión (datos linealmente dependientes)")
  }

  const slope = validarNumero((n * sumXY - sumX * sumY) / denominator, 0)
  const intercept = validarNumero((sumY - slope * sumX) / n, 0)

  // Calcular R² con validación ULTRA robusta
  const yMean = sumY / n
  let ssRes = 0
  let ssTot = 0

  for (let i = 0; i < n; i++) {
    const predicted = validarNumero(slope * xFinal[i] + intercept, 0)
    const actual = validarNumero(yFinal[i], 0)

    ssRes += Math.pow(actual - predicted, 2)
    ssTot += Math.pow(actual - yMean, 2)
  }

  const r2 = validarNumero(ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0, 0)

  console.log(`📊 Regresión calculada: slope=${slope}, intercept=${intercept}, r2=${r2}`)

  return {
    slope: validarNumero(slope, 0),
    intercept: validarNumero(intercept, 0),
    r2: validarNumero(r2, 0),
  }
}

// Algoritmo de optimización mejorado para von Bertalanffy
const optimizarVonBertalanffy = (
  datosObservados: any[],
  modeloFuncion: Function,
  parametrosIniciales: number[],
  datosReferencia?: any[],
) => {
  let mejoresParametros = [...parametrosIniciales]
  let menorError = Number.POSITIVE_INFINITY

  // Múltiples intentos de optimización
  const intentos = 5
  const iteracionesPorIntento = 150

  for (let intento = 0; intento < intentos; intento++) {
    console.log(`🔧 Intento de optimización ${intento + 1}/${intentos}`)

    let parametrosActuales =
      intento === 0 ? [...parametrosIniciales] : parametrosIniciales.map((p) => p * (0.3 + Math.random() * 1.4))

    for (let iter = 0; iter < iteracionesPorIntento; iter++) {
      const factorAjuste = 0.08 * (1 - iter / iteracionesPorIntento) // Reducir ajuste con el tiempo
      const parametrosPrueba = parametrosActuales.map((p, i) => {
        const ajuste = (Math.random() - 0.5) * factorAjuste * Math.abs(p || 0.1)
        return p + ajuste
      })

      // Asegurar que los parámetros estén en rangos razonables
      parametrosPrueba[0] = Math.max(parametrosPrueba[0], 15) // L∞, H∞, A∞ mínimo
      parametrosPrueba[1] = Math.max(parametrosPrueba[1], -15) // t₀ puede ser negativo pero no muy extremo
      parametrosPrueba[1] = Math.min(parametrosPrueba[1], 15) // t₀ no muy positivo tampoco

      try {
        let errorTotal = 0
        let conteoValido = 0

        // Error con datos observados
        for (const dato of datosObservados) {
          const valorPredicho = modeloFuncion(dato.tiempo, parametrosPrueba, dato)
          const valorReal = dato.valorObservado

          if (!isNaN(valorPredicho) && !isNaN(valorReal) && valorPredicho > 0 && valorReal > 0) {
            const error = Math.pow(valorReal - valorPredicho, 2)
            errorTotal += error
            conteoValido++
          }
        }

        // Si hay datos de referencia, incluir su error (para truchas)
        if (datosReferencia && datosReferencia.length > 0) {
          for (const ref of datosReferencia) {
            const tiempoRef = ref.meses * 30 // Convertir meses a días aproximados
            const valorPredicho = modeloFuncion(tiempoRef, parametrosPrueba, {
              temperatura: 15.0,
              conductividad: 550,
              ph: 7.5,
              oxigeno: 8.0,
              humedad: 65,
            })

            if (!isNaN(valorPredicho) && valorPredicho > 0) {
              const error = Math.pow(ref.longitud - valorPredicho, 2)
              errorTotal += error * 3 // Dar más peso a los datos de referencia
              conteoValido++
            }
          }
        }

        if (conteoValido > 0) {
          const errorPromedio = errorTotal / conteoValido

          if (errorPromedio < menorError) {
            menorError = errorPromedio
            mejoresParametros = [...parametrosPrueba]
            parametrosActuales = [...parametrosPrueba]
          }
        }
      } catch (error) {
        // Continuar con la siguiente iteración si hay error
        continue
      }
    }
  }

  // Calcular R² aproximado
  let sumaCuadradosTotal = 0
  let sumaCuadradosResiduos = 0
  let conteoR2 = 0
  let sumaValores = 0

  for (const dato of datosObservados) {
    if (dato.valorObservado > 0) {
      sumaValores += dato.valorObservado
      conteoR2++
    }
  }

  const mediaObservada = conteoR2 > 0 ? sumaValores / conteoR2 : 0

  for (const dato of datosObservados) {
    if (dato.valorObservado > 0) {
      const valorPredicho = modeloFuncion(dato.tiempo, mejoresParametros, dato)
      if (!isNaN(valorPredicho) && valorPredicho > 0) {
        sumaCuadradosTotal += Math.pow(dato.valorObservado - mediaObservada, 2)
        sumaCuadradosResiduos += Math.pow(dato.valorObservado - valorPredicho, 2)
      }
    }
  }

  const r2 = sumaCuadradosTotal > 0 ? Math.max(0, Math.min(1, 1 - sumaCuadradosResiduos / sumaCuadradosTotal)) : 0

  console.log(`✅ Optimización completada. R²: ${(r2 * 100).toFixed(1)}%, Error: ${menorError.toFixed(4)}`)

  return {
    coeficientes: mejoresParametros,
    error: menorError,
    r2: r2,
  }
}

// Modelo de von Bertalanffy mejorado para truchas
const modeloVonBertalanffyTruchas = (tiempo: number, coeficientes: number[], datos: any) => {
  const [L_infinito, t0, beta0, beta1, beta2, beta3, beta4] = coeficientes

  // Extraer variables ambientales con valores por defecto más realistas
  const temp = datos.temperatura || datos.temperaturaC || 15.0
  const o2 = datos.oxigeno || 8.0 // mg/L típico para truchas
  const cond = datos.conductividad || datos.conductividadUsCm || 550
  const ph = datos.ph || datos.pH || 7.5

  // Calcular tasa de crecimiento k con normalización mejorada
  const k =
    Math.abs(beta0) +
    Math.abs(beta1) * Math.max(0, (temp - 10) / 10.0) + // Temperatura óptima 10-20°C
    Math.abs(beta2) * Math.max(0, o2 / 10.0) + // Oxígeno óptimo > 6 mg/L
    Math.abs(beta3) * Math.max(0, (cond - 200) / 500.0) + // Conductividad 200-700
    Math.abs(beta4) * Math.max(0, (ph - 6.5) / 2.0) // pH óptimo 6.5-8.5

  // Asegurar que k esté en un rango razonable para truchas
  const kAjustado = Math.max(0.002, Math.min(0.15, k))

  const exponente = -kAjustado * (tiempo - t0)

  // Evitar overflow/underflow
  if (exponente > 50) return L_infinito * 0.999
  if (exponente < -50) return 0.5

  const resultado = L_infinito * (1 - Math.exp(exponente))
  return Math.max(0.5, Math.min(L_infinito, resultado))
}

// Modelo de crecimiento exponencial para lechugas (altura) - ULTRA ROBUSTO
const modeloExponencialAltura = (tiempo: number, coeficientes: number[], datos: any) => {
  const [H_infinito, t0, beta0, beta1, beta2, beta3] = coeficientes.map((c) => validarNumero(c, 0))

  const temp = validarNumero(datos.temperatura || datos.temperaturaC, 22.0)
  const hum = validarNumero(datos.humedad || datos.humedadPorcentaje, 65.0)
  const ph = validarNumero(datos.ph || datos.pH, 6.5)

  // Calcular tasa de crecimiento k normalizada para lechugas
  const k =
    Math.abs(beta0) +
    Math.abs(beta1) * Math.max(0, (temp - 15) / 15.0) + // Temperatura óptima 15-30°C
    Math.abs(beta2) * Math.max(0, (hum - 40) / 40.0) + // Humedad óptima 40-80%
    Math.abs(beta3) * Math.max(0, (ph - 5.5) / 2.5) // pH óptimo 5.5-8.0

  const kAjustado = validarNumero(Math.max(0.005, Math.min(0.25, k)), 0.05)
  const exponente = validarNumero(-kAjustado * (tiempo - t0), 0)

  if (exponente > 50) return validarNumero(H_infinito * 0.999, H_infinito)
  if (exponente < -50) return 0.2

  const resultado = validarNumero(H_infinito * (1 - Math.exp(exponente)), 0.2)
  return Math.max(0.2, Math.min(validarNumero(H_infinito, 50), resultado))
}

// Modelo de crecimiento exponencial para área foliar - ULTRA ROBUSTO
const modeloExponencialArea = (tiempo: number, coeficientes: number[], datos: any) => {
  const [A_infinito, t0, beta0, beta1, beta2, beta3] = coeficientes.map((c) => validarNumero(c, 0))

  const temp = validarNumero(datos.temperatura || datos.temperaturaC, 22.0)
  const hum = validarNumero(datos.humedad || datos.humedadPorcentaje, 65.0)
  const ph = validarNumero(datos.ph || datos.pH, 6.5)

  // Área foliar crece más rápido que altura inicialmente
  const k =
    Math.abs(beta0) * 1.3 +
    Math.abs(beta1) * Math.max(0, (temp - 15) / 15.0) +
    Math.abs(beta2) * Math.max(0, (hum - 40) / 40.0) +
    Math.abs(beta3) * Math.max(0, (ph - 5.5) / 2.5)

  const kAjustado = validarNumero(Math.max(0.008, Math.min(0.35, k)), 0.08)
  const exponente = validarNumero(-kAjustado * (tiempo - t0), 0)

  if (exponente > 50) return validarNumero(A_infinito * 0.999, A_infinito)
  if (exponente < -50) return 0.5

  const resultado = validarNumero(A_infinito * (1 - Math.exp(exponente)), 0.5)
  return Math.max(0.5, Math.min(validarNumero(A_infinito, 500), resultado))
}

// Servicio para predicción de truchas usando datos reales por días
export const prediccionTruchasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🐟 Obteniendo datos históricos de truchas por días...")

      const datosLongitud = await obtenerDatosPorDias(TRUCHAS_ENDPOINTS.range, 30)

      if (datosLongitud.valores.length < 5) {
        throw new Error("No hay suficientes días con datos de longitud")
      }

      console.log(`✅ Datos de truchas procesados: ${datosLongitud.valores.length} días`)

      return {
        tiempos: datosLongitud.dias,
        longitudes: datosLongitud.valores,
        totalRegistros: datosLongitud.totalDias,
      }
    } catch (error) {
      console.error("❌ Error obteniendo datos históricos truchas:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos de truchas: ${errorMessage}`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    // Validar entrada
    const diasValidos = validarNumero(dias, 1)
    if (diasValidos <= 0 || diasValidos > 1000) {
      throw new Error("El número de días debe estar entre 1 y 1000")
    }

    const datos = await prediccionTruchasService.obtenerDatosHistoricos()

    if (datos.longitudes.length < 5) {
      throw new Error("No hay suficientes datos para realizar la predicción")
    }

    const { slope, intercept, r2 } = regresionLineal(datos.tiempos, datos.longitudes)

    const tiempoActual = Math.max(...datos.tiempos)
    const tiempoFuturo = tiempoActual + diasValidos
    const longitudActual = datos.longitudes[datos.longitudes.length - 1]

    let longitudPrediccion = validarNumero(slope * tiempoFuturo + intercept, longitudActual)

    // Aplicar límites conservadores para predicciones grandes
    if (diasValidos > 100) {
      const factorMax = 1 + diasValidos * 0.001 // Factor conservador
      longitudPrediccion = Math.min(longitudPrediccion, longitudActual * factorMax)
    }

    const crecimientoEsperado = validarNumero(longitudPrediccion - longitudActual, 0)

    return {
      diasPrediccion: diasValidos,
      longitudActual: validarNumero(longitudActual, 0),
      longitudPrediccion: Math.max(validarNumero(longitudPrediccion, longitudActual), longitudActual),
      crecimientoEsperado: Math.max(crecimientoEsperado, 0),
      tasaCrecimiento: validarNumero(slope * diasValidos, 0),
      r2: validarNumero(r2, 0),
      totalRegistros: datos.totalRegistros,
    }
  },
}

// Servicio para predicción de lechugas usando TODOS los datos históricos - COMPLETAMENTE ARREGLADO
export const prediccionLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🥬 LECHUGAS: Obteniendo TODOS los datos históricos...")

      // Usar el endpoint diario que devuelve TODOS los datos
      const response = await fetchWithTimeout(LECHUGAS_ENDPOINTS.diarioUltimo)

      console.log("🥬 LECHUGAS: Respuesta recibida:", response)

      if (!response || typeof response !== "object") {
        throw new Error("Respuesta inválida del servidor")
      }

      // Verificar si tiene la estructura esperada
      let datosHistoricos = []

      if (response.datos && Array.isArray(response.datos)) {
        datosHistoricos = response.datos
      } else if (Array.isArray(response)) {
        datosHistoricos = response
      } else {
        throw new Error("Formato de respuesta inválido - no se encontraron datos")
      }

      if (datosHistoricos.length < 5) {
        throw new Error(`Se necesitan al menos 5 días de datos (${datosHistoricos.length} disponibles)`)
      }

      console.log(`🥬 LECHUGAS: Total de registros recibidos: ${datosHistoricos.length}`)

      // Procesar TODOS los datos históricos con validación ULTRA robusta
      const datosParaModelo = datosHistoricos
        .map((registro: any, index: number) => {
          console.log(`🥬 LECHUGAS: Procesando registro ${index}:`, registro)

          const datosProcesados = {
            dia: validarNumero(registro.dia || registro.day || index, index),
            altura: validarNumero(registro.alturaCm || registro.altura || registro.height, 0),
            areaFoliar: validarNumero(registro.areaFoliarCm2 || registro.areaFoliar || registro.area, 0),
            temperatura: validarNumero(registro.temperaturaC || registro.temperatura || registro.temp, 22.0),
            humedad: validarNumero(registro.humedadPorcentaje || registro.humedad || registro.humidity, 65.0),
            ph: validarNumero(registro.pH || registro.ph, 6.5),
            timestamp: registro.timestamp || new Date().toISOString(),
          }

          console.log(`🥬 LECHUGAS: Datos procesados ${index}:`, datosProcesados)
          return datosProcesados
        })
        .filter((d: { altura: number; areaFoliar: number }) => {
          const esValido = d.altura > 0 && d.areaFoliar > 0 && d.altura < 200 && d.areaFoliar < 2000
          if (!esValido) {
            console.log(`🥬 LECHUGAS: Registro filtrado - altura: ${d.altura}, área: ${d.areaFoliar}`)
          }
          return esValido
        })
        .sort((a: { dia: number }, b: { dia: number }) => a.dia - b.dia) // Ordenar por día

      console.log(`🥬 LECHUGAS: Datos procesados y filtrados: ${datosParaModelo.length} días`)

      if (datosParaModelo.length === 0) {
        throw new Error("No se encontraron datos válidos después del filtrado")
      }

      // Extraer arrays para regresión con validación
      const tiempos = datosParaModelo.map((d: { dia: number }) => validarNumero(d.dia, 0))
      const alturas = datosParaModelo.map((d: { altura: number }) => validarNumero(d.altura, 0))
      const areas = datosParaModelo.map((d: { areaFoliar: number }) => validarNumero(d.areaFoliar, 0))

      // Obtener valores ACTUALES REALES (últimos datos)
      const ultimoDato = datosParaModelo[datosParaModelo.length - 1]
      const alturaActual = validarNumero(ultimoDato.altura, 0)
      const areaActual = validarNumero(ultimoDato.areaFoliar, 0)

      console.log(`🎯 LECHUGAS - DATOS ACTUALES CONFIRMADOS:`)
      console.log(`   - Altura actual REAL: ${alturaActual} cm`)
      console.log(`   - Área actual REAL: ${areaActual} cm²`)
      console.log(`   - Día actual: ${ultimoDato.dia}`)
      console.log(`   - Total registros procesados: ${datosParaModelo.length}`)

      return {
        tiempos: tiempos,
        alturas: alturas,
        areas: areas,
        totalRegistros: datosParaModelo.length,
        datosCompletos: datosParaModelo,
        // Valores actuales REALES
        alturaActual: alturaActual,
        areaActual: areaActual,
        diaActual: validarNumero(ultimoDato.dia, 0),
      }
    } catch (error) {
      console.error("❌ Error obteniendo datos históricos lechugas:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos de lechugas: ${errorMessage}`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    try {
      // Validar entrada con números ULTRA robustos
      const diasValidos = validarNumero(dias, 1)
      if (diasValidos <= 0 || diasValidos > 1000) {
        throw new Error("El número de días debe estar entre 1 y 1000")
      }

      console.log(`🎯 LECHUGAS: Iniciando predicción para ${diasValidos} días...`)

      const datos = await prediccionLechugasService.obtenerDatosHistoricos()

      if (datos.alturas.length < 5 || datos.areas.length < 5) {
        throw new Error("No hay suficientes datos para realizar la predicción")
      }

      console.log(
        `🥬 LECHUGAS: Regresión usando TODOS los ${datos.alturas.length} datos para predicción de ${diasValidos} días`,
      )
      console.log(
        `🎯 LECHUGAS: Valores actuales CONFIRMADOS: Altura=${datos.alturaActual}cm, Área=${datos.areaActual}cm²`,
      )

      // Regresión para altura con validación ULTRA robusta
      let regresionAltura
      try {
        regresionAltura = regresionLineal(datos.tiempos, datos.alturas)
        console.log(`🥬 LECHUGAS: Regresión altura exitosa:`, regresionAltura)
      } catch (error) {
        console.error("❌ LECHUGAS: Error en regresión altura:", error)
        throw new Error(`Error en regresión de altura: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Regresión para área foliar con validación ULTRA robusta
      let regresionArea
      try {
        regresionArea = regresionLineal(datos.tiempos, datos.areas)
        console.log(`🥬 LECHUGAS: Regresión área exitosa:`, regresionArea)
      } catch (error) {
        console.error("❌ LECHUGAS: Error en regresión área:", error)
        throw new Error(`Error en regresión de área: ${error instanceof Error ? error.message : String(error)}`)
      }

      const tiempoActual = validarNumero(datos.diaActual, 0)
      const tiempoFuturo = tiempoActual + diasValidos

      // Usar valores actuales REALES obtenidos directamente
      const alturaActual = validarNumero(datos.alturaActual, 0)
      const areaActual = validarNumero(datos.areaActual, 0)

      console.log(`🎯 LECHUGAS: Calculando predicciones desde tiempo ${tiempoActual} hasta ${tiempoFuturo}`)

      // Calcular predicciones con validación ULTRA robusta
      let alturaPrediccion = validarNumero(
        regresionAltura.slope * tiempoFuturo + regresionAltura.intercept,
        alturaActual,
      )
      let areaPrediccion = validarNumero(regresionArea.slope * tiempoFuturo + regresionArea.intercept, areaActual)

      console.log(`🥬 LECHUGAS: Predicciones calculadas - Altura: ${alturaPrediccion}, Área: ${areaPrediccion}`)

      // Aplicar límites conservadores para predicciones lejanas
      if (diasValidos > 100) {
        const factorAltura = Math.min(3.0, 1 + diasValidos * 0.002)
        const factorArea = Math.min(5.0, 1 + diasValidos * 0.003)

        alturaPrediccion = Math.min(alturaPrediccion, alturaActual * factorAltura)
        areaPrediccion = Math.min(areaPrediccion, areaActual * factorArea)

        console.log(
          `🥬 LECHUGAS: Límites aplicados para ${diasValidos} días - Altura: ${alturaPrediccion}, Área: ${areaPrediccion}`,
        )
      }

      // Asegurar que las predicciones no sean menores que los valores actuales
      alturaPrediccion = Math.max(alturaPrediccion, alturaActual)
      areaPrediccion = Math.max(areaPrediccion, areaActual)

      const crecimientoAlturaEsperado = validarNumero(alturaPrediccion - alturaActual, 0)
      const crecimientoAreaEsperado = validarNumero(areaPrediccion - areaActual, 0)

      console.log(`📊 LECHUGAS: RESULTADOS FINALES CALCULADOS:`)
      console.log(`   - Altura actual: ${alturaActual} cm`)
      console.log(`   - Altura predicha: ${alturaPrediccion} cm`)
      console.log(`   - Crecimiento altura: +${crecimientoAlturaEsperado} cm`)
      console.log(`   - Área actual: ${areaActual} cm²`)
      console.log(`   - Área predicha: ${areaPrediccion} cm²`)
      console.log(`   - Crecimiento área: +${crecimientoAreaEsperado} cm²`)

      const resultado = {
        diasPrediccion: diasValidos,
        alturaActual: validarNumero(alturaActual, 0),
        alturaPrediccion: validarNumero(alturaPrediccion, alturaActual),
        areaFoliarActual: validarNumero(areaActual, 0),
        areaFoliarPrediccion: validarNumero(areaPrediccion, areaActual),
        crecimientoAlturaEsperado: Math.max(crecimientoAlturaEsperado, 0),
        crecimientoAreaEsperado: Math.max(crecimientoAreaEsperado, 0),
        r2Altura: validarNumero(regresionAltura.r2, 0),
        r2Area: validarNumero(regresionArea.r2, 0),
        totalRegistros: datos.totalRegistros,
      }

      console.log(`✅ LECHUGAS: Resultado final validado:`, resultado)
      return resultado
    } catch (error) {
      console.error("❌ LECHUGAS: Error en realizarPrediccion:", error)
      throw new Error(`Error en predicción de lechugas: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
}

// Servicio mejorado para predicción AVANZADA de truchas usando endpoint diario
export const prediccionAvanzadaTruchasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🐟 Obteniendo datos históricos diarios de truchas...")
      const response = await fetchWithTimeout(TRUCHAS_ENDPOINTS.diarioUltimo)

      if (!response.datos || !Array.isArray(response.datos)) {
        throw new Error("Formato de respuesta inválido")
      }

      const datosHistoricos = response.datos

      if (datosHistoricos.length < 10) {
        throw new Error(`No hay suficientes días con datos (${datosHistoricos.length} días, mínimo 10)`)
      }

      // Procesar datos para el modelo
      const datosParaModelo = datosHistoricos
        .map((registro: any) => ({
          tiempo: registro.tiempoDias || registro.dia || 0, // Usar tiempoDias si está disponible
          valorObservado: Number(registro.longitudCm) || 0,
          temperatura: Number(registro.temperaturaC) || 15.0,
          conductividad: Number(registro.conductividadUsCm) || 550,
          ph: Number(registro.pH) || 7.5,
          oxigeno: 8.0, // Valor típico para truchas
          timestamp: registro.timestamp,
          dia: registro.dia,
        }))
        .filter((d: { valorObservado: number }) => d.valorObservado > 0 && d.valorObservado < 100) // Filtrar valores razonables
        .sort((a: { tiempo: number }, b: { tiempo: number }) => a.tiempo - b.tiempo) // Ordenar por tiempo

      console.log(`✅ Procesados ${datosParaModelo.length} días con datos válidos de truchas`)
      console.log(
        `📊 Rango de longitudes: ${Math.min(...datosParaModelo.map((d: { valorObservado: number }) => d.valorObservado)).toFixed(2)} - ${Math.max(...datosParaModelo.map((d: { valorObservado: number }) => d.valorObservado)).toFixed(2)} cm`,
      )

      return {
        datos: datosParaModelo,
        metadata: response.metadata,
      }
    } catch (error) {
      console.error("❌ Error obteniendo datos históricos truchas:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos de truchas: ${errorMessage}`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    const { datos: datosHistoricos, metadata } = await prediccionAvanzadaTruchasService.obtenerDatosHistoricos()

    if (datosHistoricos.length < 10) {
      throw new Error(
        `No hay suficientes datos para realizar la predicción (${datosHistoricos.length} días, mínimo 10)`,
      )
    }

    // Preparar datos para regresión lineal
    const tiempos = datosHistoricos.map((d: { tiempo: number; valorObservado: number }) => d.tiempo)
    const longitudes = datosHistoricos.map((d: { tiempo: number; valorObservado: number }) => d.valorObservado)

    // Realizar regresión lineal
    const regresionLinealResult = regresionLineal(tiempos, longitudes)

    // Estimar L∞ basado en datos de referencia y observados
    const longitudMaximaObservada = longitudes.length > 0 ? Math.max(...longitudes) : 0
    const longitudMaximaReferencia = DATOS_REFERENCIA_TRUCHAS.length > 0 ? Math.max(...DATOS_REFERENCIA_TRUCHAS.map((d) => d.longitud)) : 0
    const L_infinito = Math.max(longitudMaximaObservada * 1.4, longitudMaximaReferencia * 1.2, 65)

    // Parámetros iniciales mejorados para von Bertalanffy
    const parametrosIniciales = [
      L_infinito, // L∞
      -3, // t₀ (puede ser negativo)
      0.03, // β₀ (tasa base)
      0.006, // β₁ (efecto temperatura)
      0.002, // β₂ (efecto oxígeno)
      0.00008, // β₃ (efecto conductividad)
      0.008, // β₄ (efecto pH)
    ]

    console.log("🔧 Optimizando modelo de von Bertalanffy con datos de referencia...")
    const resultadoVonBertalanffy = optimizarVonBertalanffy(
      datosHistoricos,
      modeloVonBertalanffyTruchas,
      parametrosIniciales,
      DATOS_REFERENCIA_TRUCHAS,
    )

    // Realizar predicciones con ambos modelos
    const datosActuales = datosHistoricos[datosHistoricos.length - 1]
    const tiempoActual = datosActuales.tiempo
    const tiempoFuturo = tiempoActual + dias

    const longitudActual = datosActuales.valorObservado

    // Predicción con regresión lineal
    const longitudPrediccionLineal = regresionLinealResult.slope * tiempoFuturo + regresionLinealResult.intercept
    const crecimientoLineal = Math.max(0, longitudPrediccionLineal - longitudActual)

    // Predicción con von Bertalanffy
    const longitudPrediccionVB = modeloVonBertalanffyTruchas(
      tiempoFuturo,
      resultadoVonBertalanffy.coeficientes,
      datosActuales,
    )
    const crecimientoVB = Math.max(0, longitudPrediccionVB - longitudActual)

    // Calcular edad estimada en meses
    const edadEstimadaMeses = tiempoActual / 30

    return {
      diasPrediccion: dias,
      longitudActual,

      // Resultados regresión lineal
      longitudPrediccionLineal: Math.max(longitudPrediccionLineal, longitudActual),
      crecimientoEsperadoLineal: crecimientoLineal,
      r2Lineal: regresionLinealResult.r2,
      pendienteLineal: regresionLinealResult.slope,
      interceptoLineal: regresionLinealResult.intercept,

      // Resultados von Bertalanffy
      longitudPrediccionVB: Math.max(longitudPrediccionVB, longitudActual),
      crecimientoEsperadoVB: crecimientoVB,
      L_infinito: resultadoVonBertalanffy.coeficientes[0],
      coeficientesVB: resultadoVonBertalanffy.coeficientes,
      r2VB: resultadoVonBertalanffy.r2,
      errorVB: resultadoVonBertalanffy.error,

      // Información general
      totalRegistros: datosHistoricos.length,
      edadEstimadaMeses: edadEstimadaMeses,
      variablesAmbientales: {
        temperatura: datosActuales.temperatura,
        conductividad: datosActuales.conductividad,
        ph: datosActuales.ph,
        oxigeno: datosActuales.oxigeno,
      },
      datosReferencia: DATOS_REFERENCIA_TRUCHAS,
      metadata: metadata,
    }
  },
}

// Servicio mejorado para predicción AVANZADA de lechugas usando endpoint diario - COMPLETAMENTE ARREGLADO
export const prediccionAvanzadaLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🥬 AVANZADO: Obteniendo datos históricos diarios de lechugas...")
      const response = await fetchWithTimeout(LECHUGAS_ENDPOINTS.diarioUltimo)

      console.log("🥬 AVANZADO: Respuesta recibida:", response)

      if (!response || typeof response !== "object") {
        throw new Error("Respuesta inválida del servidor")
      }

      // Verificar si tiene la estructura esperada
      let datosHistoricos = []

      if (response.datos && Array.isArray(response.datos)) {
        datosHistoricos = response.datos
      } else if (Array.isArray(response)) {
        datosHistoricos = response
      } else {
        throw new Error("Formato de respuesta inválido - no se encontraron datos")
      }

      if (datosHistoricos.length < 10) {
        throw new Error(`No hay suficientes días con datos (${datosHistoricos.length} días, mínimo 10)`)
      }

      console.log(`🥬 AVANZADO: Total de registros recibidos: ${datosHistoricos.length}`)

      // Procesar datos para el modelo con validación ULTRA robusta
      const datosParaModelo = datosHistoricos
        .map((registro: any, index: number) => {
          console.log(`🥬 AVANZADO: Procesando registro ${index}:`, registro)

          const datosProcesados = {
            tiempo: validarNumero(registro.tiempoDias || registro.dia || index, index),
            alturaObservada: validarNumero(registro.alturaCm || registro.altura || registro.height, 0),
            areaObservada: validarNumero(registro.areaFoliarCm2 || registro.areaFoliar || registro.area, 0),
            temperatura: validarNumero(registro.temperaturaC || registro.temperatura || registro.temp, 22.0),
            humedad: validarNumero(registro.humedadPorcentaje || registro.humedad || registro.humidity, 65.0),
            ph: validarNumero(registro.pH || registro.ph, 6.5),
            timestamp: registro.timestamp || new Date().toISOString(),
            dia: validarNumero(registro.dia || index, index),
          }

          console.log(`🥬 AVANZADO: Datos procesados ${index}:`, datosProcesados)
          return datosProcesados
        })
        .filter((d: { alturaObservada: number; areaObservada: number }) => {
          const esValido =
            d.alturaObservada > 0 && d.areaObservada > 0 && d.alturaObservada < 50 && d.areaObservada < 500
          if (!esValido) {
            console.log(`🥬 AVANZADO: Registro filtrado - altura: ${d.alturaObservada}, área: ${d.areaObservada}`)
          }
          return esValido
        })
        .sort((a: { tiempo: number }, b: { tiempo: number }) => a.tiempo - b.tiempo) // Ordenar por tiempo

      console.log(`🥬 AVANZADO: Datos procesados y filtrados: ${datosParaModelo.length} días`)

      if (datosParaModelo.length === 0) {
        throw new Error("No se encontraron datos válidos después del filtrado")
      }

      console.log(
        `📊 AVANZADO: Rango de alturas: ${Math.min(...datosParaModelo.map((d: { alturaObservada: number }) => d.alturaObservada)).toFixed(2)} - ${Math.max(...datosParaModelo.map((d: { alturaObservada: number }) => d.alturaObservada)).toFixed(2)} cm`,
      )
      console.log(
        `📊 AVANZADO: Rango de áreas: ${Math.min(...datosParaModelo.map((d: { areaObservada: number }) => d.areaObservada)).toFixed(2)} - ${Math.max(...datosParaModelo.map((d: { areaObservada: number }) => d.areaObservada)).toFixed(2)} cm²`,
      )

      return {
        datos: datosParaModelo,
        metadata: response.metadata,
      }
    } catch (error) {
      console.error("❌ Error obteniendo datos históricos lechugas:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos de lechugas: ${errorMessage}`)
    }

  },

  realizarPrediccion: async (dias: number) => {
    try {
      // Validar entrada con números ULTRA robustos
      const diasValidos = validarNumero(dias, 1)
      if (diasValidos <= 0 || diasValidos > 1000) {
        throw new Error("El número de días debe estar entre 1 y 1000")
      }

      console.log(`🎯 AVANZADO: Iniciando predicción para ${diasValidos} días...`)

      const { datos: datosHistoricos, metadata } = await prediccionAvanzadaLechugasService.obtenerDatosHistoricos()

      if (datosHistoricos.length < 10) {
        throw new Error(
          `No hay suficientes datos para realizar la predicción (${datosHistoricos.length} días, mínimo 10)`,
        )
      }

      console.log(
        `🥬 AVANZADO: Usando TODOS los ${datosHistoricos.length} datos para predicción de ${diasValidos} días`,
      )

      // Preparar datos para regresión lineal con validación ULTRA robusta
      const tiempos = datosHistoricos.map((d: { tiempo: number }) => validarNumero(d.tiempo, 0))
      const alturas = datosHistoricos.map((d: { alturaObservada: number }) => validarNumero(d.alturaObservada, 0))
      const areas = datosHistoricos.map((d: { areaObservada: number }) => validarNumero(d.areaObservada, 0))

      // Realizar regresión lineal para altura y área con validación
      let regresionAlturaLineal, regresionAreaLineal

      try {
        regresionAlturaLineal = regresionLineal(tiempos, alturas)
        console.log(`🥬 AVANZADO: Regresión altura exitosa:`, regresionAlturaLineal)
      } catch (error) {
        console.error("❌ AVANZADO: Error en regresión altura:", error)
        throw new Error(`Error en regresión de altura: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        regresionAreaLineal = regresionLineal(tiempos, areas)
        console.log(`🥬 AVANZADO: Regresión área exitosa:`, regresionAreaLineal)
      } catch (error) {
        console.error("❌ AVANZADO: Error en regresión área:", error)
        throw new Error(`Error en regresión de área: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Estimar valores máximos teóricos más realistas
      const alturaMaxima = Math.max(...alturas)
      const areaMaxima = Math.max(...areas)

      // Valores máximos basados en lechugas típicas
      const H_infinito = validarNumero(Math.max(alturaMaxima * 1.5, 30), 30) // Lechugas pueden llegar a 30-35 cm
      const A_infinito = validarNumero(Math.max(areaMaxima * 1.6, 250), 250) // Área foliar puede ser considerable

      // Optimizar modelo exponencial para altura con validación
      const parametrosAlturaIniciales = [H_infinito, -2, 0.06, 0.004, 0.002, 0.012]
      const datosAltura = datosHistoricos.map((d: any) => ({ ...d, valorObservado: validarNumero(d.alturaObservada, 0) }))

      let resultadoAlturaExp
      try {
        resultadoAlturaExp = optimizarVonBertalanffy(datosAltura, modeloExponencialAltura, parametrosAlturaIniciales)
        console.log(`🥬 AVANZADO: Optimización altura exitosa:`, resultadoAlturaExp)
      } catch (error) {
        console.error("❌ AVANZADO: Error en optimización altura:", error)
        // Usar valores por defecto si falla la optimización
        resultadoAlturaExp = {
          coeficientes: parametrosAlturaIniciales,
          error: 999,
          r2: 0.5,
        }
      }

      // Optimizar modelo exponencial para área foliar con validación
      const parametrosAreaIniciales = [A_infinito, -2, 0.08, 0.006, 0.003, 0.015]
      const datosArea = datosHistoricos.map((d: any) => ({ ...d, valorObservado: validarNumero(d.areaObservada, 0) }))

      let resultadoAreaExp
      try {
        resultadoAreaExp = optimizarVonBertalanffy(datosArea, modeloExponencialArea, parametrosAreaIniciales)
        console.log(`🥬 AVANZADO: Optimización área exitosa:`, resultadoAreaExp)
      } catch (error) {
        console.error("❌ AVANZADO: Error en optimización área:", error)
        // Usar valores por defecto si falla la optimización
        resultadoAreaExp = {
          coeficientes: parametrosAreaIniciales,
          error: 999,
          r2: 0.5,
        }
      }

      // Realizar predicciones con datos actuales REALES
      const datosActuales = datosHistoricos[datosHistoricos.length - 1]
      const tiempoActual = validarNumero(datosActuales.tiempo, 0)
      const tiempoFuturo = tiempoActual + diasValidos

      const alturaActual = validarNumero(datosActuales.alturaObservada, 0)
      const areaActual = validarNumero(datosActuales.areaObservada, 0)

      console.log(`🎯 AVANZADO: Valores actuales CONFIRMADOS: Altura=${alturaActual}cm, Área=${areaActual}cm²`)

      // Predicciones con regresión lineal
      let alturaPrediccionLineal = validarNumero(
        regresionAlturaLineal.slope * tiempoFuturo + regresionAlturaLineal.intercept,
        alturaActual,
      )
      let areaPrediccionLineal = validarNumero(
        regresionAreaLineal.slope * tiempoFuturo + regresionAreaLineal.intercept,
        areaActual,
      )

      // Predicciones con modelos exponenciales
      let alturaPrediccionExp = validarNumero(
        modeloExponencialAltura(tiempoFuturo, resultadoAlturaExp.coeficientes, datosActuales),
        alturaActual,
      )
      let areaPrediccionExp = validarNumero(
        modeloExponencialArea(tiempoFuturo, resultadoAreaExp.coeficientes, datosActuales),
        areaActual,
      )

      // Aplicar límites conservadores para predicciones lejanas
      if (diasValidos > 100) {
        const factorAltura = Math.min(3.0, 1 + diasValidos * 0.002)
        const factorArea = Math.min(5.0, 1 + diasValidos * 0.003)

        alturaPrediccionLineal = Math.min(alturaPrediccionLineal, alturaActual * factorAltura)
        areaPrediccionLineal = Math.min(areaPrediccionLineal, areaActual * factorArea)
        alturaPrediccionExp = Math.min(alturaPrediccionExp, alturaActual * factorAltura)
        areaPrediccionExp = Math.min(areaPrediccionExp, areaActual * factorArea)
      }

      // Asegurar que las predicciones no sean menores que los valores actuales
      alturaPrediccionLineal = Math.max(alturaPrediccionLineal, alturaActual)
      areaPrediccionLineal = Math.max(areaPrediccionLineal, areaActual)
      alturaPrediccionExp = Math.max(alturaPrediccionExp, alturaActual)
      areaPrediccionExp = Math.max(areaPrediccionExp, areaActual)

      const crecimientoAlturaLineal = validarNumero(alturaPrediccionLineal - alturaActual, 0)
      const crecimientoAreaLineal = validarNumero(areaPrediccionLineal - areaActual, 0)
      const crecimientoAlturaExp = validarNumero(alturaPrediccionExp - alturaActual, 0)
      const crecimientoAreaExp = validarNumero(areaPrediccionExp - areaActual, 0)

      console.log(`📊 AVANZADO: RESULTADOS FINALES CALCULADOS:`)
      console.log(`   - Altura actual: ${alturaActual} cm`)
      console.log(`   - Altura predicha (lineal): ${alturaPrediccionLineal} cm`)
      console.log(`   - Altura predicha (exp): ${alturaPrediccionExp} cm`)
      console.log(`   - Área actual: ${areaActual} cm²`)
      console.log(`   - Área predicha (lineal): ${areaPrediccionLineal} cm²`)
      console.log(`   - Área predicha (exp): ${areaPrediccionExp} cm²`)

      const resultado = {
        diasPrediccion: diasValidos,
        alturaActual: validarNumero(alturaActual, 0),
        areaFoliarActual: validarNumero(areaActual, 0),

        // Resultados regresión lineal
        alturaPrediccionLineal: validarNumero(alturaPrediccionLineal, alturaActual),
        areaFoliarPrediccionLineal: validarNumero(areaPrediccionLineal, areaActual),
        crecimientoAlturaLineal: Math.max(crecimientoAlturaLineal, 0),
        crecimientoAreaLineal: Math.max(crecimientoAreaLineal, 0),
        r2AlturaLineal: validarNumero(regresionAlturaLineal.r2, 0),
        r2AreaLineal: validarNumero(regresionAreaLineal.r2, 0),
        pendienteAlturaLineal: validarNumero(regresionAlturaLineal.slope, 0),
        pendienteAreaLineal: validarNumero(regresionAreaLineal.slope, 0),

        // Resultados modelos exponenciales
        alturaPrediccionExp: validarNumero(alturaPrediccionExp, alturaActual),
        areaFoliarPrediccionExp: validarNumero(areaPrediccionExp, areaActual),
        crecimientoAlturaExp: Math.max(crecimientoAlturaExp, 0),
        crecimientoAreaExp: Math.max(crecimientoAreaExp, 0),
        H_infinito: validarNumero(resultadoAlturaExp.coeficientes[0], H_infinito),
        A_infinito: validarNumero(resultadoAreaExp.coeficientes[0], A_infinito),
        coeficientesAlturaExp: resultadoAlturaExp.coeficientes.map((c) => validarNumero(c, 0)),
        coeficientesAreaExp: resultadoAreaExp.coeficientes.map((c) => validarNumero(c, 0)),
        r2AlturaExp: validarNumero(resultadoAlturaExp.r2, 0),
        r2AreaExp: validarNumero(resultadoAreaExp.r2, 0),
        errorAlturaExp: validarNumero(resultadoAlturaExp.error, 999),
        errorAreaExp: validarNumero(resultadoAreaExp.error, 999),

        // Información general
        totalRegistros: datosHistoricos.length,
        edadEstimadaDias: tiempoActual,
        variablesAmbientales: {
          temperatura: validarNumero(datosActuales.temperatura, 22.0),
          humedad: validarNumero(datosActuales.humedad, 65.0),
          ph: validarNumero(datosActuales.ph, 6.5),
        },
        metadata: metadata,
      }

      console.log(`✅ AVANZADO: Resultado final validado:`, resultado)
      return resultado
    } catch (error) {
      console.error("❌ AVANZADO: Error en realizarPrediccion:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      throw new Error(`Error en predicción avanzada de lechugas: ${errorMessage}`)
    }
  },
}
