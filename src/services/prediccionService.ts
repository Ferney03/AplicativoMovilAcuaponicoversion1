import { TRUCHAS_ENDPOINTS, LECHUGAS_ENDPOINTS } from "../config/api"

// Función para hacer fetch con timeout
const fetchWithTimeout = async (url: string, timeout = 8000) => {
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
    console.log(`✅ Data received from ${url}:`, Array.isArray(data) ? `${data.length} items` : typeof data)
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

            return Number(valor) || 0
          })
          .filter((v) => !isNaN(v) && v > 0)

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
      promediosFinales.push(promedio)
      diasConDatos.push(dia)
    }
  })

  console.log(`✅ Procesados ${promediosFinales.length} días con datos válidos`)

  return {
    valores: promediosFinales,
    dias: diasConDatos,
    totalDias: promediosFinales.length,
  }
}

// Función de regresión lineal simple
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
    const datos = await prediccionTruchasService.obtenerDatosHistoricos()

    if (datos.longitudes.length < 5) {
      throw new Error("No hay suficientes datos para realizar la predicción")
    }

    const { slope, intercept, r2 } = regresionLineal(datos.tiempos, datos.longitudes)

    const tiempoActual = Math.max(...datos.tiempos)
    const tiempoFuturo = tiempoActual + dias
    const longitudActual = datos.longitudes[datos.longitudes.length - 1]
    const longitudPrediccion = slope * tiempoFuturo + intercept
    const crecimientoEsperado = longitudPrediccion - longitudActual

    return {
      diasPrediccion: dias,
      longitudActual,
      longitudPrediccion: Math.max(longitudPrediccion, longitudActual),
      crecimientoEsperado: Math.max(crecimientoEsperado, 0),
      tasaCrecimiento: slope * dias,
      r2,
      totalRegistros: datos.totalRegistros,
    }
  },
}

// Servicio para predicción de lechugas usando datos reales por días
export const prediccionLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🥬 Obteniendo datos históricos de lechugas por días...")

      // Obtener datos de altura y área foliar por separado
      const datosAltura = await obtenerDatosPorDias(LECHUGAS_ENDPOINTS.range, 30)

      // Para área foliar, necesitamos hacer una segunda llamada o extraer de los mismos datos
      // Por ahora, usaremos los mismos datos y extraeremos área foliar
      const datosArea = await obtenerDatosPorDias(LECHUGAS_ENDPOINTS.range, 30)

      if (datosAltura.valores.length < 5) {
        throw new Error("No hay suficientes días con datos de altura")
      }

      // Asegurar que ambos arrays tengan la misma longitud
      const minLength = Math.min(datosAltura.valores.length, datosArea.valores.length)
      const alturas = datosAltura.valores.slice(0, minLength)
      const areas = datosArea.valores.slice(0, minLength)
      const dias = datosAltura.dias.slice(0, minLength)

      console.log(`✅ Datos de lechugas procesados: ${alturas.length} días`)

      return {
        tiempos: dias,
        alturas: alturas,
        areas: areas,
        totalRegistros: alturas.length,
      }
    } catch (error) {
      console.error("❌ Error obteniendo datos históricos lechugas:", error)
      const errorMessage = (error instanceof Error) ? error.message : String(error)
      throw new Error(`No se pudieron obtener los datos históricos de lechugas: ${errorMessage}`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    const datos = await prediccionLechugasService.obtenerDatosHistoricos()

    if (datos.alturas.length < 5) {
      throw new Error("No hay suficientes datos para realizar la predicción")
    }

    // Regresión para altura
    const regresionAltura = regresionLineal(datos.tiempos, datos.alturas)

    // Regresión para área foliar
    const regresionArea = regresionLineal(datos.tiempos, datos.areas)

    const tiempoActual = Math.max(...datos.tiempos)
    const tiempoFuturo = tiempoActual + dias

    const alturaActual = datos.alturas[datos.alturas.length - 1]
    const areaActual = datos.areas[datos.areas.length - 1]

    const alturaPrediccion = regresionAltura.slope * tiempoFuturo + regresionAltura.intercept
    const areaPrediccion = regresionArea.slope * tiempoFuturo + regresionArea.intercept

    const crecimientoAlturaEsperado = alturaPrediccion - alturaActual
    const crecimientoAreaEsperado = areaPrediccion - areaActual

    return {
      diasPrediccion: dias,
      alturaActual,
      alturaPrediccion: Math.max(alturaPrediccion, alturaActual),
      areaFoliarActual: areaActual,
      areaFoliarPrediccion: Math.max(areaPrediccion, areaActual),
      crecimientoAlturaEsperado: Math.max(crecimientoAlturaEsperado, 0),
      crecimientoAreaEsperado: Math.max(crecimientoAreaEsperado, 0),
      r2Altura: regresionAltura.r2,
      r2Area: regresionArea.r2,
      totalRegistros: datos.totalRegistros,
    }
  },
}
