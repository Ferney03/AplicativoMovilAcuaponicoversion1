"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { truchasService, lechugasService } from "../services/apiService"

export interface Alerta {
  id: string
  tipo: "temperatura" | "ph" | "conductividad" | "humedad"
  modulo: "cultivos" | "tanques"
  valor: number
  limite: { min: number; max: number }
  severidad: "baja" | "media" | "alta" | "critica"
  mensaje: string
  timestamp: Date
  vista: boolean
  ignorada: boolean
}

interface AlertContextType {
  alertas: Alerta[]
  alertaActual: Alerta | null
  alertasActivas: Alerta[]
  verificarAlertas: () => Promise<void>
  marcarComoVista: (id: string) => void
  ignorarAlerta: (id: string) => void
  limpiarAlertas: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}

// Límites actualizados según especificaciones
const LIMITES = {
  truchas: {
    temperatura: { min: 10, max: 20 },
    conductividad: { min: 280, max: 750 },
    ph: { min: 6.5, max: 8.5 },
  },
  lechugas: {
    temperatura: { min: 15, max: 26 },
    humedad: { min: 50, max: 85 },
    ph: { min: 5.5, max: 7.2 },
  },
}

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [alertaActual, setAlertaActual] = useState<Alerta | null>(null)
  const [ultimaVerificacion, setUltimaVerificacion] = useState<{ [key: string]: Date }>({})

  const calcularSeveridad = (
    valor: number,
    limite: { min: number; max: number },
  ): "baja" | "media" | "alta" | "critica" => {
    const rango = limite.max - limite.min
    const margenCritico = rango * 0.15 // 15% del rango
    const margenAlto = rango * 0.25 // 25% del rango

    if (valor < limite.min) {
      const diferencia = limite.min - valor
      if (diferencia >= margenCritico) return "critica"
      if (diferencia >= margenAlto) return "alta"
      return "media"
    }

    if (valor > limite.max) {
      const diferencia = valor - limite.max
      if (diferencia >= margenCritico) return "critica"
      if (diferencia >= margenAlto) return "alta"
      return "media"
    }

    return "baja"
  }

  const generarMensaje = (
    tipo: string,
    modulo: string,
    valor: number,
    limite: { min: number; max: number },
  ): string => {
    const moduloNombre = modulo === "cultivos" ? "Lechugas" : "Truchas"
    const tipoNombre = tipo === "ph" ? "pH" : tipo.charAt(0).toUpperCase() + tipo.slice(1)
    const unidad = tipo === "temperatura" ? "°C" : tipo === "humedad" ? "%" : tipo === "conductividad" ? " μS/cm" : ""

    if (valor < limite.min) {
      return `${tipoNombre} en ${moduloNombre} muy baja: ${valor}${unidad} (mín: ${limite.min}${unidad})`
    }
    if (valor > limite.max) {
      return `${tipoNombre} en ${moduloNombre} muy alta: ${valor}${unidad} (máx: ${limite.max}${unidad})`
    }
    return `${tipoNombre} en ${moduloNombre} normal: ${valor}${unidad}`
  }

  const verificarAlertas = async () => {
    try {
      console.log("🔍 Verificando alertas con límites actualizados...")

      // Obtener datos de lechugas
      try {
        const datosLechugas = await lechugasService.getLatestValues()
        console.log("📊 Datos lechugas:", datosLechugas)

        // Verificar temperatura lechugas (15-28°C)
        if (
          datosLechugas.temperatura < LIMITES.lechugas.temperatura.min ||
          datosLechugas.temperatura > LIMITES.lechugas.temperatura.max
        ) {
          crearAlerta("temperatura", "cultivos", datosLechugas.temperatura, LIMITES.lechugas.temperatura)
        }

        // Verificar humedad lechugas (50-85%)
        if (
          datosLechugas.humedad < LIMITES.lechugas.humedad.min ||
          datosLechugas.humedad > LIMITES.lechugas.humedad.max
        ) {
          crearAlerta("humedad", "cultivos", datosLechugas.humedad, LIMITES.lechugas.humedad)
        }

        // Verificar pH lechugas (5.5-7.4)
        if (datosLechugas.ph < LIMITES.lechugas.ph.min || datosLechugas.ph > LIMITES.lechugas.ph.max) {
          crearAlerta("ph", "cultivos", datosLechugas.ph, LIMITES.lechugas.ph)
        }
      } catch (error) {
        console.error("❌ Error verificando lechugas:", error)
      }

      // Obtener datos de truchas
      try {
        const datosTruchas = await truchasService.getLatestValues()
        console.log("📊 Datos truchas:", datosTruchas)

        // Verificar temperatura truchas (9-21°C)
        if (
          datosTruchas.temperatura < LIMITES.truchas.temperatura.min ||
          datosTruchas.temperatura > LIMITES.truchas.temperatura.max
        ) {
          crearAlerta("temperatura", "tanques", datosTruchas.temperatura, LIMITES.truchas.temperatura)
        }

        // Verificar conductividad truchas (250-850 μS/cm)
        if (
          datosTruchas.conductividad < LIMITES.truchas.conductividad.min ||
          datosTruchas.conductividad > LIMITES.truchas.conductividad.max
        ) {
          crearAlerta("conductividad", "tanques", datosTruchas.conductividad, LIMITES.truchas.conductividad)
        }

        // Verificar pH truchas (6.5-8.8)
        if (datosTruchas.ph < LIMITES.truchas.ph.min || datosTruchas.ph > LIMITES.truchas.ph.max) {
          crearAlerta("ph", "tanques", datosTruchas.ph, LIMITES.truchas.ph)
        }
      } catch (error) {
        console.error("❌ Error verificando truchas:", error)
      }
    } catch (error) {
      console.error("❌ Error verificando alertas:", error)
    }
  }

  const crearAlerta = (
    tipo: Alerta["tipo"],
    modulo: Alerta["modulo"],
    valor: number,
    limite: { min: number; max: number },
  ) => {
    const alertaKey = `${tipo}-${modulo}-${valor.toFixed(1)}`
    const ahora = new Date()

    // Anti-spam: no crear la misma alerta en menos de 5 minutos
    if (ultimaVerificacion[alertaKey] && ahora.getTime() - ultimaVerificacion[alertaKey].getTime() < 5 * 60 * 1000) {
      return
    }

    const nuevaAlerta: Alerta = {
      id: `${Date.now()}-${Math.random()}`,
      tipo,
      modulo,
      valor: Number(valor.toFixed(2)),
      limite,
      severidad: calcularSeveridad(valor, limite),
      mensaje: generarMensaje(tipo, modulo, valor, limite),
      timestamp: ahora,
      vista: false,
      ignorada: false,
    }

    console.log(`🚨 Nueva alerta: ${nuevaAlerta.mensaje}`)

    setAlertas((prev) => [nuevaAlerta, ...prev])
    setUltimaVerificacion((prev) => ({ ...prev, [alertaKey]: ahora }))

    // Mostrar alerta si no hay una activa
    if (!alertaActual) {
      setAlertaActual(nuevaAlerta)
    }
  }

  const marcarComoVista = (id: string) => {
    setAlertas((prev) => prev.map((alerta) => (alerta.id === id ? { ...alerta, vista: true } : alerta)))

    if (alertaActual?.id === id) {
      // Mostrar siguiente alerta no vista
      const siguienteAlerta = alertas.find((a) => !a.vista && !a.ignorada && a.id !== id)
      setAlertaActual(siguienteAlerta || null)
    }
  }

  const ignorarAlerta = (id: string) => {
    setAlertas((prev) => prev.map((alerta) => (alerta.id === id ? { ...alerta, ignorada: true } : alerta)))

    if (alertaActual?.id === id) {
      // Mostrar siguiente alerta no ignorada
      const siguienteAlerta = alertas.find((a) => !a.vista && !a.ignorada && a.id !== id)
      setAlertaActual(siguienteAlerta || null)
    }
  }

  const limpiarAlertas = () => {
    setAlertas([])
    setAlertaActual(null)
    setUltimaVerificacion({})
  }

  const alertasActivas = alertas.filter((a) => !a.vista && !a.ignorada)

  // Verificación automática cada 15 segundos
  useEffect(() => {
    const interval = setInterval(verificarAlertas, 15000)
    verificarAlertas() // Verificar inmediatamente
    return () => clearInterval(interval)
  }, [])

  // Auto-hide para alertas no críticas
  useEffect(() => {
    if (alertaActual && alertaActual.severidad !== "critica") {
      const timer = setTimeout(() => {
        ignorarAlerta(alertaActual.id)
      }, 10000) // 10 segundos

      return () => clearTimeout(timer)
    }
  }, [alertaActual])

  return (
    <AlertContext.Provider
      value={{
        alertas,
        alertaActual,
        alertasActivas,
        verificarAlertas,
        marcarComoVista,
        ignorarAlerta,
        limpiarAlertas,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}
