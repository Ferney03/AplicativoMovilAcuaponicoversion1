import Constants from "expo-constants"

// Configuración para usar datos simulados o reales
const USE_MOCK_DATA = false // ✅ CAMBIADO A FALSE PARA USAR DATOS REALES

// Configuración automática de API basada en la plataforma
const getApiBaseUrl = () => {
  // Usar Constants.executionEnvironment para detectar plataforma
  const isWeb = Constants.executionEnvironment === "storeClient" ? false : true

  if (isWeb && typeof window !== "undefined") {
    // En web browser, usar HTTP con puerto 55839
    return "http://localhost:55839"
  } else {
    // En móvil, usar HTTP con puerto 55839
    return "http://192.168.101.76:55839"
  }
}

export const API_BASE_URL = getApiBaseUrl()

console.log(`🔧 API Base URL configurada: ${API_BASE_URL}`)

// Función para probar conectividad
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log(`🔍 Testing connection to: ${API_BASE_URL}/api/truchas/latest`)
    const response = await fetch(`${API_BASE_URL}/api/truchas/latest`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
    console.log(`📡 Connection test result: ${response.ok} (Status: ${response.status})`)
    return response.ok
  } catch (error) {
    console.error("❌ Connection test failed:", error)
    return false
  }
}

// Endpoints para truchas
export const TRUCHAS_ENDPOINTS = {
  all: `${API_BASE_URL}/api/truchas`,
  latest: `${API_BASE_URL}/api/truchas/latest`,
  stats: `${API_BASE_URL}/api/truchas/stats`,
  longitud: `${API_BASE_URL}/api/truchas/longitud/latest`,
  temperatura: `${API_BASE_URL}/api/truchas/temperatura/latest`,
  conductividad: `${API_BASE_URL}/api/truchas/conductividad/latest`,
  ph: `${API_BASE_URL}/api/truchas/ph/latest`,
  // Endpoints de rango para datos históricos
  range: `${API_BASE_URL}/api/truchas/range`,
  // Nuevo endpoint para datos diarios
  diarioUltimo: `${API_BASE_URL}/api/graphics/truchas/diario-ultimo`,
}

// Endpoints para lechugas
export const LECHUGAS_ENDPOINTS = {
  all: `${API_BASE_URL}/api/lechugas`,
  latest: `${API_BASE_URL}/api/lechugas/latest`,
  stats: `${API_BASE_URL}/api/lechugas/stats`,
  altura: `${API_BASE_URL}/api/lechugas/altura/latest`,
  areaFoliar: `${API_BASE_URL}/api/lechugas/area-foliar/latest`,
  temperatura: `${API_BASE_URL}/api/lechugas/temperatura/latest`,
  humedad: `${API_BASE_URL}/api/lechugas/humedad/latest`,
  ph: `${API_BASE_URL}/api/lechugas/ph/latest`,
  // Endpoints de rango para datos históricos
  range: `${API_BASE_URL}/api/lechugas/range`,
  // Endpoint corregido para datos diarios de lechugas
  diarioUltimo: `${API_BASE_URL}/api/graphics/lechugas/diario-ultimo`,
}
