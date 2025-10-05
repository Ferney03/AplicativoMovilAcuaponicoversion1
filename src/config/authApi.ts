import Constants from "expo-constants"
import CryptoJS from "crypto-js"
import { Platform } from "react-native"

// Configuración de la API de autenticación
const getAuthApiBaseUrl = () => {
  // Usar Constants.executionEnvironment para detectar plataforma
  const isWeb = Constants.executionEnvironment === "storeClient" ? false : true

  if (isWeb && typeof window !== "undefined") {
    return "http://localhost:7150" // Puerto 7150 para HTTPS local en web
  } else {
    return "http://192.168.101.75:7150" // Puerto 7150 para HTTPS local en móvil
  }
}

export const AUTH_API_BASE_URL = getAuthApiBaseUrl()

console.log(`🔐 Auth API Base URL configurada: ${AUTH_API_BASE_URL}`)
console.log(`📱 Plataforma detectada: ${Platform.OS}`)

// Función para encriptar contraseña con SHA-512 usando crypto-js (compatible con SQL Server HASHBYTES)
export const encryptPassword = (password: string): string => {
  try {
    // Generar hash SHA-512 y convertir a hexadecimal mayúsculas (como SQL Server HASHBYTES)
    const hash = CryptoJS.SHA512(password).toString(CryptoJS.enc.Hex).toUpperCase()
    console.log(`🔐 Password encrypted: ${password} -> ${hash.substring(0, 20)}...`)
    return hash
  } catch (error) {
    console.error("Error encriptando contraseña:", error)
    throw new Error("Error al encriptar la contraseña")
  }
}

// Endpoints de autenticación
export const AUTH_ENDPOINTS = {
  usuarios: `${AUTH_API_BASE_URL}/api/Usuario`,
  upas: `${AUTH_API_BASE_URL}/api/Upa`,
  actividades: `${AUTH_API_BASE_URL}/api/ListaActividades`,
  asignaciones: `${AUTH_API_BASE_URL}/api/AsignacionActividad`,
}

// Función simplificada para HTTPS
const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
  try {
    console.log(`🔄 Auth API Fetching (HTTPS): ${url}`)
    console.log(`📱 Platform: ${Platform.OS}`)

    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    }

    console.log("🔧 Fetch options:", {
      method: fetchOptions.method || "GET",
      headers: fetchOptions.headers,
      body: fetchOptions.body ? "Present" : "None",
    })

    const response = await fetch(url, fetchOptions)

    console.log(`📡 Auth API Response status: ${response.status} for ${url}`)

    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
        console.error(`❌ Auth API Error response: ${errorText}`)
      } catch (e) {
        console.error(`❌ Could not read error response`)
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ""}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error(`❌ Response is not JSON. Content-Type: ${contentType}`)
      console.error(`❌ Response text: ${text.substring(0, 200)}...`)
      throw new Error(`La respuesta no es JSON válido. Content-Type: ${contentType}`)
    }

    const data = await response.json()
    console.log(`✅ Auth API Data received from ${url}:`, Array.isArray(data) ? `${data.length} items` : typeof data)
    return data
  } catch (error: any) {
    console.error(`❌ Auth API Error fetching ${url}:`, error)

    if (error.message.includes("Network request failed") || error.message.includes("fetch")) {
      throw new Error(
        `Error de conexión HTTPS.\n\nPosibles causas:\n• API no está corriendo en ${url}\n• Certificado SSL inválido\n• IP incorrecta\n• Puerto incorrecto (debería ser 7150)\n\nSolución:\n1. Verifica que la API esté corriendo: dotnet run\n2. Verifica la IP: ${url}\n3. Abre en navegador: ${url.replace("/api/Usuario", "/swagger")}`,
      )
    }

    if (error.message.includes("CORS")) {
      throw new Error(
        `Error de CORS.\n\nLa API necesita permitir solicitudes desde aplicaciones móviles.\nVerifica la configuración CORS en Program.cs`,
      )
    }

    throw error
  }
}

// Interfaces para los datos - ACTUALIZADAS SEGÚN TU API
export interface Upa {
  idUpa: string // GUID en SQL Server
  nombre: string
  descripcion: string
  latitud: number
  longitud: number
  estado: boolean
}

export interface Usuario {
  idUsuario: string // GUID en SQL Server
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  estado: boolean
  upaId: string // GUID en SQL Server
  upa: Upa | null // ✅ CAMPO QUE FALTABA SEGÚN TU API
  numIntentos: number
}

export interface ListaActividades {
  idListaActividades: number
  nombreActividad: string
  descripcion: string
  modulo: string
  estado: boolean
}

export interface AsignacionActividad {
  idAsignacionActividad: number
  actividadId: number
  actividadUsuarioId: string // GUID que referencia al usuario
  estadoAsignacion: boolean
}

// Servicios de autenticación
export const authService = {
  // Obtener todos los usuarios
  getUsuarios: async (): Promise<Usuario[]> => {
    return await fetchWithErrorHandling(AUTH_ENDPOINTS.usuarios)
  },

  // Obtener usuario por ID
  getUsuario: async (id: string): Promise<Usuario> => {
    return await fetchWithErrorHandling(`${AUTH_ENDPOINTS.usuarios}/${id}`)
  },

  // Crear usuario
  createUsuario: async (usuario: Omit<Usuario, "idUsuario">): Promise<Usuario> => {
    return await fetchWithErrorHandling(AUTH_ENDPOINTS.usuarios, {
      method: "POST",
      body: JSON.stringify(usuario),
    })
  },

  // Actualizar usuario - USANDO TU PUT EXISTENTE CORRECTAMENTE
  updateUsuario: async (id: string, usuario: Usuario): Promise<Usuario> => {
    console.log(`🔄 Actualizando usuario ${id} con PUT en tu API existente`)
    console.log(`📝 Datos enviados:`, {
      ...usuario,
      contrasena: usuario.contrasena ? `${usuario.contrasena.substring(0, 20)}...` : "No change",
    })

    return await fetchWithErrorHandling(`${AUTH_ENDPOINTS.usuarios}/${id}`, {
      method: "PUT",
      body: JSON.stringify(usuario),
    })
  },

  // Obtener UPAs
  getUpas: async (): Promise<Upa[]> => {
    return await fetchWithErrorHandling(AUTH_ENDPOINTS.upas)
  },

  // Obtener actividades
  getActividades: async (): Promise<ListaActividades[]> => {
    return await fetchWithErrorHandling(AUTH_ENDPOINTS.actividades)
  },

  // Obtener asignaciones de actividades
  getAsignaciones: async (): Promise<AsignacionActividad[]> => {
    return await fetchWithErrorHandling(AUTH_ENDPOINTS.asignaciones)
  },

  // Obtener asignaciones por usuario
  getAsignacionesByUsuario: async (usuarioId: string): Promise<AsignacionActividad[]> => {
    const asignaciones = await fetchWithErrorHandling(AUTH_ENDPOINTS.asignaciones)
    return asignaciones.filter((a: AsignacionActividad) => a.actividadUsuarioId === usuarioId && a.estadoAsignacion)
  },

  // Login
  login: async (correo: string, contrasena: string): Promise<{ usuario: Usuario; actividades: ListaActividades[] }> => {
    try {
      console.log(`🔐 Intentando login con correo: ${correo}`)

      // Encriptar contraseña con el mismo método que SQL Server
      const contrasenaEncriptada = encryptPassword(contrasena)
      console.log(`🔐 Contraseña encriptada generada: ${contrasenaEncriptada.substring(0, 20)}...`)

      // Obtener usuarios
      const usuarios = await authService.getUsuarios()
      console.log(`👥 Total usuarios obtenidos: ${usuarios.length}`)

      // Buscar usuario por correo y contraseña
      const usuario = usuarios.find((u) => {
        const correoCoincide = u.correo.toLowerCase() === correo.toLowerCase()
        const contrasenaCoincide = u.contrasena === contrasenaEncriptada
        const usuarioActivo = u.estado === true

        console.log(`🔍 Verificando usuario: ${u.correo}`)
        console.log(`  - Correo coincide: ${correoCoincide}`)
        console.log(`  - Contraseña coincide: ${contrasenaCoincide}`)
        console.log(`  - Usuario activo: ${usuarioActivo}`)
        console.log(`  - Hash almacenado: ${u.contrasena.substring(0, 20)}...`)

        return correoCoincide && contrasenaCoincide && usuarioActivo
      })

      if (!usuario) {
        console.error("❌ Usuario no encontrado o credenciales inválidas")
        throw new Error("Credenciales inválidas o usuario inactivo")
      }

      console.log(`✅ Usuario encontrado: ${usuario.nombre} ${usuario.apellido}`)

      // Obtener actividades del usuario
      const asignaciones = await authService.getAsignacionesByUsuario(usuario.idUsuario)
      console.log(`🎯 Asignaciones encontradas: ${asignaciones.length}`)

      const todasActividades = await authService.getActividades()
      console.log(`📋 Total actividades disponibles: ${todasActividades.length}`)

      const actividadesUsuario = todasActividades.filter((actividad) =>
        asignaciones.some((asignacion) => asignacion.actividadId === actividad.idListaActividades),
      )

      console.log(`✅ Actividades asignadas al usuario: ${actividadesUsuario.length}`)

      return {
        usuario,
        actividades: actividadesUsuario,
      }
    } catch (error) {
      console.error("❌ Error en login:", error)
      throw error
    }
  },

  // Cambiar contraseña - SOLO ACTUALIZA LA CONTRASEÑA
  cambiarContrasena: async (usuarioId: string, nuevaContrasena: string): Promise<void> => {
    console.log(`🔐 Cambiando SOLO la contraseña para usuario: ${usuarioId}`)

    // 1. Obtener el usuario completo primero
    const usuario = await authService.getUsuario(usuarioId)
    console.log(`👤 Usuario obtenido:`, {
      id: usuario.idUsuario,
      correo: usuario.correo,
      nombre: usuario.nombre,
    })

    // 2. Encriptar la nueva contraseña
    const contrasenaEncriptada = encryptPassword(nuevaContrasena)
    console.log(`🔐 Nueva contraseña encriptada: ${contrasenaEncriptada.substring(0, 20)}...`)

    // 3. Crear el objeto completo del usuario EXACTAMENTE como lo devuelve tu API
    const usuarioActualizado: Usuario = {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      contrasena: contrasenaEncriptada, // ✅ SOLO ESTO CAMBIA
      estado: usuario.estado,
      upaId: usuario.upaId,
      upa: usuario.upa, // ✅ MANTENER EL CAMPO UPA
      numIntentos: 0, // ✅ RESETEAR INTENTOS
    }

    console.log(`🔄 Enviando usuario completo con nueva contraseña:`, {
      ...usuarioActualizado,
      contrasena: `${contrasenaEncriptada.substring(0, 20)}...`,
    })

    // 4. Actualizar con el objeto completo
    await authService.updateUsuario(usuarioId, usuarioActualizado)

    console.log(`✅ Contraseña actualizada exitosamente`)
  },

  // Función de prueba para verificar hash
  testPasswordHash: (password: string): string => {
    return encryptPassword(password)
  },

  // Función para probar conectividad HTTPS
  testConnection: async (): Promise<{ success: boolean; details: string }> => {
    try {
      console.log(`🔍 Testing HTTPS connection to: ${AUTH_ENDPOINTS.usuarios}`)
      console.log(`📱 Platform: ${Platform.OS}`)

      const startTime = Date.now()

      const data = await fetchWithErrorHandling(AUTH_ENDPOINTS.usuarios)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`📡 HTTPS Connection test successful`)
      console.log(`⏱️ Response time: ${responseTime}ms`)

      const details = `✅ Status: 200 OK\n⏱️ Tiempo de respuesta: ${responseTime}ms\n📱 Plataforma: ${Platform.OS}\n👥 Usuarios encontrados: ${Array.isArray(data) ? data.length : "N/A"}\n🌐 URL: ${AUTH_ENDPOINTS.usuarios}`

      return {
        success: true,
        details: details,
      }
    } catch (error: any) {
      console.error("❌ HTTPS Connection test failed:", error)

      const errorDetails = `❌ Error: ${error.message}\n📱 Plataforma: ${Platform.OS}\n🌐 URL: ${AUTH_ENDPOINTS.usuarios}\n\n🔧 Verifica:\n• API corriendo: dotnet run\n• Puerto correcto: 7150\n• Swagger: ${AUTH_API_BASE_URL}/swagger`

      return {
        success: false,
        details: errorDetails,
      }
    }
  },
}
