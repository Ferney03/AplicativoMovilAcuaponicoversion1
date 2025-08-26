import { AUTH_API_BASE_URL } from "../config/authApi"

interface SolicitarRecuperacionRequest {
  email: string
}

interface VerificarCodigoRequest {
  email: string
  codigo: string
}

interface CambiarContrasenaRequest {
  token: string
  nuevaContrasena: string
}

const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
  try {
    console.log(`🔄 Recovery API Fetching: ${url}`)

    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    }

    const response = await fetch(url, fetchOptions)
    console.log(`📡 Recovery API Response status: ${response.status}`)

    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
        console.error(`❌ Recovery API Error: ${errorText}`)
      } catch (e) {
        console.error(`❌ Could not read error response`)
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ""}`)
    }

    const data = await response.json()
    console.log(`✅ Recovery API Data received`)
    return data
  } catch (error: any) {
    console.error(`❌ Recovery API Error:`, error)
    throw error
  }
}

export const recuperacionService = {
  solicitarRecuperacion: async (correo: string): Promise<{ success: boolean; message: string; codigo?: string }> => {
    try {
      console.log(`🔐 Solicitando recuperación para: ${correo}`)

      const response = await fetchWithErrorHandling(`${AUTH_API_BASE_URL}/api/recuperacion/solicitar`, {
        method: "POST",
        body: JSON.stringify({ Correo: correo }),
      })

      if (response.success) {
        return {
          success: true,
          message: response.message || "Código enviado exitosamente",
          codigo: response.codigo,
        }
      } else {
        return {
          success: false,
          message: response.message || "Error al solicitar recuperación",
        }
      }
    } catch (error: any) {
      console.error("❌ Error en solicitud de recuperación:", error)
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      }
    }
  },

  verificarCodigo: async (
    correo: string,
    codigo: string,
  ): Promise<{ success: boolean; message: string; usuarioId?: string; token?: string }> => {
    try {
      console.log(`🔐 Verificando código para: ${correo}`)

      const response = await fetchWithErrorHandling(`${AUTH_API_BASE_URL}/api/recuperacion/verificar`, {
        method: "POST",
        body: JSON.stringify({ Correo: correo, Codigo: codigo }),
      })

      if (response.success) {
        return {
          success: true,
          message: response.message || "Código verificado correctamente",
          usuarioId: response.usuarioId,
          token: response.token,
        }
      } else {
        return {
          success: false,
          message: response.message || "Código incorrecto o expirado",
        }
      }
    } catch (error: any) {
      console.error("❌ Error en verificación de código:", error)
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      }
    }
  },

  cambiarContrasena: async (token: string, nuevaContrasena: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`🔐 Cambiando contraseña con token: ${token}`)

      const response = await fetchWithErrorHandling(`${AUTH_API_BASE_URL}/api/recuperacion/cambiar-contrasena`, {
        method: "POST",
        body: JSON.stringify({
          Token: token,
          NuevaContrasena: nuevaContrasena, // Send plain password, backend will encrypt it
        }),
      })

      if (response.success) {
        return {
          success: true,
          message: response.message || "Contraseña cambiada exitosamente",
        }
      } else {
        return {
          success: false,
          message: response.message || "Error al cambiar contraseña",
        }
      }
    } catch (error: any) {
      console.error("❌ Error al cambiar contraseña:", error)
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      }
    }
  },

  obtenerCodigoDesarrollo: async (correo: string): Promise<string | null> => {
    console.log("🔧 Código de desarrollo disponible en logs de la API")
    return null
  },
}
