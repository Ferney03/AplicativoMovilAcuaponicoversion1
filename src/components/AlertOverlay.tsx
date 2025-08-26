"use client"

import { useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import type { Alerta } from "../context/AlertContext"

interface AlertOverlayProps {
  alerta: Alerta
  onVerAlerta: () => void
  onIgnorar: () => void
}

const { width } = Dimensions.get("window")

export default function AlertOverlay({ alerta, onVerAlerta, onIgnorar }: AlertOverlayProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getSeverityColor = (severidad: string) => {
    switch (severidad) {
      case "critica":
        return "#DC2626"
      case "alta":
        return "#EA580C"
      case "media":
        return "#D97706"
      case "baja":
        return "#059669"
      default:
        return "#6B7280"
    }
  }

  const getSeverityIcon = (severidad: string) => {
    switch (severidad) {
      case "critica":
        return "error"
      case "alta":
        return "warning"
      case "media":
        return "info"
      case "baja":
        return "check-circle"
      default:
        return "notifications"
    }
  }

  const handleVerAlerta = () => {
    // Animación de salida
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onVerAlerta()
    })
  }

  const handleIgnorar = () => {
    // Animación de salida
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onIgnorar()
    })
  }

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.alertContainer,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
            borderLeftColor: getSeverityColor(alerta.severidad),
          },
        ]}
      >
        <View style={styles.alertHeader}>
          <MaterialIcons
            name={getSeverityIcon(alerta.severidad) as any}
            size={24}
            color={getSeverityColor(alerta.severidad)}
          />
          <Text style={[styles.severityText, { color: getSeverityColor(alerta.severidad) }]}>
            {alerta.severidad.toUpperCase()}
          </Text>
          <Text style={styles.timestampText}>{alerta.timestamp.toLocaleTimeString()}</Text>
        </View>

        <Text style={styles.alertMessage}>{alerta.mensaje}</Text>

        <View style={styles.alertActions}>
          <TouchableOpacity style={styles.ignoreButton} onPress={handleIgnorar}>
            <MaterialIcons name="close" size={20} color="#666" />
            <Text style={styles.ignoreButtonText}>Ignorar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewButton} onPress={handleVerAlerta}>
            <MaterialIcons name="visibility" size={20} color="white" />
            <Text style={styles.viewButtonText}>Ver Alertas</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  alertContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  severityText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  timestampText: {
    fontSize: 12,
    color: "#666",
  },
  alertMessage: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    lineHeight: 22,
  },
  alertActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ignoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  ignoreButtonText: {
    marginLeft: 4,
    color: "#666",
    fontSize: 14,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2E7D32",
  },
  viewButtonText: {
    marginLeft: 4,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
})
