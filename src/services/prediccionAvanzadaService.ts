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

// Función de regresión lineal mejorada
export const regresionLineal = (x: number[], y: number[]) => {
  if (x.length !== y.length || x.length < 2) {
    throw new Error("Datos insuficientes para regresión")
  }

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const denominator = n * sumXX - sumX * sumX
  if (Math.abs(denominator) < 1e-10) {
    throw new Error("No se puede calcular la regresión (datos linealmente dependientes)")
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  // Calcular R²
  const yMean = sumY / n
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0)
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0

  return { slope, intercept, r2 }
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
      const parametrosPrueba = parametrosActuales.map((p) => {
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

// Modelo de crecimiento exponencial para lechugas (altura)
const modeloExponencialAltura = (tiempo: number, coeficientes: number[], datos: any) => {
  const [H_infinito, t0, beta0, beta1, beta2, beta3] = coeficientes

  const temp = datos.temperatura || datos.temperaturaC || 22.0
  const hum = datos.humedad || datos.humedadPorcentaje || 65.0
  const ph = datos.ph || datos.pH || 6.5

  // Calcular tasa de crecimiento k normalizada para lechugas
  const k =
    Math.abs(beta0) +
    Math.abs(beta1) * Math.max(0, (temp - 15) / 15.0) + // Temperatura óptima 15-30°C
    Math.abs(beta2) * Math.max(0, (hum - 40) / 40.0) + // Humedad óptima 40-80%
    Math.abs(beta3) * Math.max(0, (ph - 5.5) / 2.5) // pH óptimo 5.5-8.0

  const kAjustado = Math.max(0.005, Math.min(0.25, k))
  const exponente = -kAjustado * (tiempo - t0)

  if (exponente > 50) return H_infinito * 0.999
  if (exponente < -50) return 0.2

  const resultado = H_infinito * (1 - Math.exp(exponente))
  return Math.max(0.2, Math.min(H_infinito, resultado))
}

// Modelo de crecimiento exponencial para área foliar
const modeloExponencialArea = (tiempo: number, coeficientes: number[], datos: any) => {
  const [A_infinito, t0, beta0, beta1, beta2, beta3] = coeficientes

  const temp = datos.temperatura || datos.temperaturaC || 22.0
  const hum = datos.humedad || datos.humedadPorcentaje || 65.0
  const ph = datos.ph || datos.pH || 6.5

  // Área foliar crece más rápido que altura inicialmente
  const k =
    Math.abs(beta0) * 1.3 +
    Math.abs(beta1) * Math.max(0, (temp - 15) / 15.0) +
    Math.abs(beta2) * Math.max(0, (hum - 40) / 40.0) +
    Math.abs(beta3) * Math.max(0, (ph - 5.5) / 2.5)

  const kAjustado = Math.max(0.008, Math.min(0.35, k))
  const exponente = -kAjustado * (tiempo - t0)

  if (exponente > 50) return A_infinito * 0.999
  if (exponente < -50) return 0.5

  const resultado = A_infinito * (1 - Math.exp(exponente))
  return Math.max(0.5, Math.min(A_infinito, resultado))
}

// Servicio mejorado para predicción de truchas usando endpoint diario
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
      const errorMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos: ${errorMsg}`)
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
    const tiempos = datosHistoricos.map((d: { tiempo: number }) => d.tiempo)
    const longitudes = datosHistoricos.map((d: { valorObservado: number }) => d.valorObservado)

    // Realizar regresión lineal
    const regresionLinealResult = regresionLineal(tiempos, longitudes)

    // Estimar L∞ basado en datos de referencia y observados
    const longitudMaximaObservada = Math.max(...longitudes)
    const longitudMaximaReferencia = Math.max(...DATOS_REFERENCIA_TRUCHAS.map((d) => d.longitud))
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

// Servicio mejorado para predicción de lechugas usando endpoint diario
export const prediccionAvanzadaLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🥬 Obteniendo datos históricos diarios de lechugas...")
      const response = await fetchWithTimeout(LECHUGAS_ENDPOINTS.diarioUltimo)

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
          tiempo: registro.tiempoDias || registro.dia || 0,
          alturaObservada: Number(registro.alturaCm) || 0,
          areaObservada: Number(registro.areaFoliarCm2) || 0,
          temperatura: Number(registro.temperaturaC) || 22.0,
          humedad: Number(registro.humedadPorcentaje) || 65.0,
          ph: Number(registro.pH) || 6.5,
          timestamp: registro.timestamp,
          dia: registro.dia,
        }))
        .filter((d: { alturaObservada: number; areaObservada: number }) => d.alturaObservada > 0 && d.areaObservada > 0 && d.alturaObservada < 50 && d.areaObservada < 500) // Filtrar valores razonables
        .sort((a: { tiempo: number }, b: { tiempo: number }) => a.tiempo - b.tiempo) // Ordenar por tiempo

      console.log(`✅ Procesados ${datosParaModelo.length} días con datos válidos de lechugas`)
      console.log(
        `📊 Rango de alturas: ${Math.min(...datosParaModelo.map((d: { alturaObservada: number }) => d.alturaObservada)).toFixed(2)} - ${Math.max(...datosParaModelo.map((d: { alturaObservada: number }) => d.alturaObservada)).toFixed(2)} cm`,
      )
      console.log(
        `📊 Rango de áreas: ${Math.min(...datosParaModelo.map((d: { areaObservada: number }) => d.areaObservada)).toFixed(2)} - ${Math.max(...datosParaModelo.map((d: { areaObservada: number }) => d.areaObservada)).toFixed(2)} cm²`,
      )

      return {
        datos: datosParaModelo,
        metadata: response.metadata,
      }
    } catch (error) {
      console.error("❌ Error obteniendo datos históricos lechugas:", error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos: ${errorMsg}`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    const { datos: datosHistoricos, metadata } = await prediccionAvanzadaLechugasService.obtenerDatosHistoricos()

    if (datosHistoricos.length < 10) {
      throw new Error(
        `No hay suficientes datos para realizar la predicción (${datosHistoricos.length} días, mínimo 10)`,
      )
    }

    // Preparar datos para regresión lineal
    const tiempos = datosHistoricos.map((d: { tiempo: number }) => d.tiempo)
    const alturas = datosHistoricos.map((d: { alturaObservada: number }) => d.alturaObservada)
    const areas = datosHistoricos.map((d: { areaObservada: number }) => d.areaObservada)

    // Realizar regresión lineal para altura y área
    const regresionAlturaLineal = regresionLineal(tiempos, alturas)
    const regresionAreaLineal = regresionLineal(tiempos, areas)

    // Estimar valores máximos teóricos más realistas
    const alturaMaxima = Math.max(...alturas)
    const areaMaxima = Math.max(...areas)

    // Valores máximos basados en lechugas típicas
    const H_infinito = Math.max(alturaMaxima * 1.5, 30) // Lechugas pueden llegar a 30-35 cm
    const A_infinito = Math.max(areaMaxima * 1.6, 250) // Área foliar puede ser considerable

    // Optimizar modelo exponencial para altura
    const parametrosAlturaIniciales = [H_infinito, -2, 0.06, 0.004, 0.002, 0.012]
    const datosAltura = datosHistoricos.map((d: any) => ({ ...d, valorObservado: d.alturaObservada }))
    const resultadoAlturaExp = optimizarVonBertalanffy(datosAltura, modeloExponencialAltura, parametrosAlturaIniciales)

    // Optimizar modelo exponencial para área foliar
    const parametrosAreaIniciales = [A_infinito, -2, 0.08, 0.006, 0.003, 0.015]
    const datosArea = datosHistoricos.map((d: any) => ({ ...d, valorObservado: d.areaObservada }))
    const resultadoAreaExp = optimizarVonBertalanffy(datosArea, modeloExponencialArea, parametrosAreaIniciales)

    // Realizar predicciones
    const datosActuales = datosHistoricos[datosHistoricos.length - 1]
    const tiempoActual = datosActuales.tiempo
    const tiempoFuturo = tiempoActual + dias

    const alturaActual = datosActuales.alturaObservada
    const areaActual = datosActuales.areaObservada

    // Predicciones con regresión lineal
    const alturaPrediccionLineal = regresionAlturaLineal.slope * tiempoFuturo + regresionAlturaLineal.intercept
    const areaPrediccionLineal = regresionAreaLineal.slope * tiempoFuturo + regresionAreaLineal.intercept
    const crecimientoAlturaLineal = Math.max(0, alturaPrediccionLineal - alturaActual)
    const crecimientoAreaLineal = Math.max(0, areaPrediccionLineal - areaActual)

    // Predicciones con modelos exponenciales
    const alturaPrediccionExp = modeloExponencialAltura(tiempoFuturo, resultadoAlturaExp.coeficientes, datosActuales)
    const areaPrediccionExp = modeloExponencialArea(tiempoFuturo, resultadoAreaExp.coeficientes, datosActuales)
    const crecimientoAlturaExp = Math.max(0, alturaPrediccionExp - alturaActual)
    const crecimientoAreaExp = Math.max(0, areaPrediccionExp - areaActual)

    return {
      diasPrediccion: dias,
      alturaActual,
      areaFoliarActual: areaActual,

      // Resultados regresión lineal
      alturaPrediccionLineal: Math.max(alturaPrediccionLineal, alturaActual),
      areaFoliarPrediccionLineal: Math.max(areaPrediccionLineal, areaActual),
      crecimientoAlturaLineal,
      crecimientoAreaLineal,
      r2AlturaLineal: regresionAlturaLineal.r2,
      r2AreaLineal: regresionAreaLineal.r2,
      pendienteAlturaLineal: regresionAlturaLineal.slope,
      pendienteAreaLineal: regresionAreaLineal.slope,

      // Resultados modelos exponenciales
      alturaPrediccionExp: Math.max(alturaPrediccionExp, alturaActual),
      areaFoliarPrediccionExp: Math.max(areaPrediccionExp, areaActual),
      crecimientoAlturaExp,
      crecimientoAreaExp,
      H_infinito: resultadoAlturaExp.coeficientes[0],
      A_infinito: resultadoAreaExp.coeficientes[0],
      coeficientesAlturaExp: resultadoAlturaExp.coeficientes,
      coeficientesAreaExp: resultadoAreaExp.coeficientes,
      r2AlturaExp: resultadoAlturaExp.r2,
      r2AreaExp: resultadoAreaExp.r2,
      errorAlturaExp: resultadoAlturaExp.error,
      errorAreaExp: resultadoAreaExp.error,

      // Información general
      totalRegistros: datosHistoricos.length,
      edadEstimadaDias: tiempoActual,
      variablesAmbientales: {
        temperatura: datosActuales.temperatura,
        humedad: datosActuales.humedad,
        ph: datosActuales.ph,
      },
      metadata: metadata,
    }
  },
}
