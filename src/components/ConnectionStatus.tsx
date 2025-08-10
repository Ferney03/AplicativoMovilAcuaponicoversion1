"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { API_BASE_URL } from "../config/api"
import { showNetworkHelp } from "../utils/networkUtils"

interface ConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void
}

export default function ConnectionStatus({ onConnectionChange }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkConnection = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`${API_BASE_URL}/api/truchas/temperatura/latest`, {
          method: "GET",
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        const connected = response.ok
        setIsConnected(connected)
        setLastCheck(new Date())
        onConnectionChange?.(connected)
      } catch (error) {
        clearTimeout(timeoutId)
        setIsConnected(false)
        setLastCheck(new Date())
        onConnectionChange?.(false)
      }
    } catch (error) {
      setIsConnected(false)
      setLastCheck(new Date())
      onConnectionChange?.(false)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 10000) // Verificar cada 10 segundos
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (isConnected === null) return "#FFA726" // Naranja para "verificando"
    return isConnected ? "#4CAF50" : "#F44336" // Verde o rojo
  }

  const getStatusText = () => {
    if (isConnected === null) return "Verificando..."
    return isConnected ? "Conectado" : "Sin conexión"
  }

  const getStatusIcon = () => {
    if (isConnected === null) return "sync"
    return isConnected ? "wifi" : "wifi-off"
  }

  return (
    <View style={styles.container}>
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
        <MaterialIcons name={getStatusIcon()} size={16} color="white" />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {!isConnected && isConnected !== null && (
        <TouchableOpacity style={styles.helpButton} onPress={showNetworkHelp}>
          <MaterialIcons name="help-outline" size={16} color="#666" />
          <Text style={styles.helpText}>Ayuda</Text>
        </TouchableOpacity>
      )}

      {lastCheck && <Text style={styles.lastCheckText}>Última verificación: {lastCheck.toLocaleTimeString()}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  helpText: {
    color: "#666",
    fontSize: 12,
    marginLeft: 4,
  },
  lastCheckText: {
    color: "#999",
    fontSize: 10,
  },
})
