import { TRUCHAS_ENDPOINTS, LECHUGAS_ENDPOINTS } from "../config/api"

export interface TruchaData {
  id?: number
  longitudCm: number
  temperaturaC: number
  conductividadUsCm: number
  pH: number
  tiempoSegundos: number
  timestamp: string
}

export interface LechugaData {
  id?: number
  alturaCm: number
  areaFoliarCm2: number
  temperaturaC: number
  humedadPorcentaje: number
  pH: number
  tiempoSegundos: number
  timestamp: string
}

// Configuración para usar datos simulados o reales
const USE_MOCK_DATA = false // ✅ CAMBIADO A FALSE PARA USAR DATOS REALES

// Función genérica para hacer fetch con manejo de errores mejorado
const fetchWithErrorHandling = async (url: string) => {
  try {
    console.log(`🔄 Fetching: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log(`📡 Response status: ${response.status} for ${url}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Data received from ${url}:`, data)
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

// Función para extraer valor de diferentes formatos de respuesta
const extractValue = (response: any, fallback = 0): number => {
  // Si es un número directo
  if (typeof response === "number") return response

  // Si tiene propiedad 'value'
  if (response && typeof response.value === "number") return response.value

  // Si tiene propiedad 'data'
  if (response && typeof response.data === "number") return response.data

  // Si es un array, tomar el primer elemento
  if (Array.isArray(response) && response.length > 0) {
    return extractValue(response[0], fallback)
  }

  // Si es un objeto con propiedades específicas
  if (response && typeof response === "object") {
    // Para truchas
    if (response.longitudCm !== undefined) return response.longitudCm
    if (response.temperaturaC !== undefined) return response.temperaturaC
    if (response.conductividadUsCm !== undefined) return response.conductividadUsCm
    if (response.pH !== undefined) return response.pH

    // Para lechugas
    if (response.alturaCm !== undefined) return response.alturaCm
    if (response.areaFoliarCm2 !== undefined) return response.areaFoliarCm2
    if (response.humedadPorcentaje !== undefined) return response.humedadPorcentaje
  }

  console.warn(`⚠️ Could not extract value from response:`, response)
  return fallback
}

// Servicios para Truchas
export const truchasService = {
  getLatest: async (): Promise<TruchaData> => {
    return await fetchWithErrorHandling(TRUCHAS_ENDPOINTS.latest)
  },

  getLatestValues: async () => {
    try {
      const [longitudRes, temperaturaRes, conductividadRes, phRes] = await Promise.all([
        fetchWithErrorHandling(TRUCHAS_ENDPOINTS.longitud),
        fetchWithErrorHandling(TRUCHAS_ENDPOINTS.temperatura),
        fetchWithErrorHandling(TRUCHAS_ENDPOINTS.conductividad),
        fetchWithErrorHandling(TRUCHAS_ENDPOINTS.ph),
      ])

      const result = {
        longitud: extractValue(longitudRes, 0),
        temperatura: extractValue(temperaturaRes, 0),
        conductividad: extractValue(conductividadRes, 0),
        ph: extractValue(phRes, 7),
      }

      console.log("🐟 Truchas processed data:", result)
      return result
    } catch (error) {
      console.error("❌ Error in truchasService.getLatestValues:", error)
      throw error
    }
  },
}

// Servicios para Lechugas
export const lechugasService = {
  getLatest: async (): Promise<LechugaData> => {
    return await fetchWithErrorHandling(LECHUGAS_ENDPOINTS.latest)
  },

  getLatestValues: async () => {
    try {
      const [alturaRes, areaFoliarRes, temperaturaRes, humedadRes, phRes] = await Promise.all([
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.altura),
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.areaFoliar),
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.temperatura),
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.humedad),
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.ph),
      ])

      const result = {
        altura: extractValue(alturaRes, 0),
        areaFoliar: extractValue(areaFoliarRes, 0),
        temperatura: extractValue(temperaturaRes, 0),
        humedad: extractValue(humedadRes, 0),
        ph: extractValue(phRes, 7),
      }

      console.log("🥬 Lechugas processed data:", result)
      return result
    } catch (error) {
      console.error("❌ Error in lechugasService.getLatestValues:", error)
      throw error
    }
  },
}
