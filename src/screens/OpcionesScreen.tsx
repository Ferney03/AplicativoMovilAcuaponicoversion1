"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, BackHandler, Platform } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../context/authContext"

interface OpcionesScreenProps {
  navigation?: any
}

export default function OpcionesScreen({ navigation }: OpcionesScreenProps) {
  const { user, userActivities, logout } = useAuth()

  // Verificar acceso según el dominio del correo
  const isUcundinamarcaUser = user?.correo?.endsWith("@ucundinamarca.edu.co") || false
  const isGmailUser = user?.correo?.endsWith("@gmail.com") || false

  console.log(`🔍 OpcionesScreen - Usuario: ${user?.correo}`)
  console.log(`🎓 Ucundinamarca: ${isUcundinamarcaUser} (acceso completo)`)
  console.log(`📧 Gmail: ${isGmailUser} (solo gráficas y alertas)`)

  const handleUsuariosRegistrados = () => {
    if (!isUcundinamarcaUser) {
      Alert.alert(
        "Acceso Restringido",
        "Solo usuarios institucionales (@ucundinamarca.edu.co) pueden ver usuarios registrados",
      )
      return
    }

    if (navigation) {
      navigation.navigate("Usuarios")
    }
  }

  const handleGenerarAlerta = () => {
    // Tanto usuarios institucionales como Gmail pueden ver alertas
    if (!isUcundinamarcaUser && !isGmailUser) {
      Alert.alert("Acceso Restringido", "Requiere correo institucional (@ucundinamarca.edu.co) o @gmail.com")
      return
    }

    if (navigation) {
      navigation.navigate("Alertas")
    }
  }

  const handleGenerarReporte = () => {
    if (!isUcundinamarcaUser) {
      Alert.alert("Acceso Restringido", "Solo usuarios institucionales (@ucundinamarca.edu.co) pueden generar reportes")
      return
    }

    if (navigation) {
      navigation.navigate("Reportes")
    }
  }

  const handleCambiarContrasena = () => {
    if (!isUcundinamarcaUser) {
      Alert.alert(
        "Acceso Restringido",
        "Solo usuarios institucionales (@ucundinamarca.edu.co) pueden cambiar contraseña",
      )
      return
    }

    navigation?.navigate("CambiarContrasena")
  }

  const handleAcercaDe = () => {
    if (!isUcundinamarcaUser) {
      Alert.alert(
        "Acceso Restringido",
        "Solo usuarios institucionales (@ucundinamarca.edu.co) pueden ver información del aplicativo",
      )
      return
    }

    Alert.alert(
      "Acerca del Aplicativo",
      `Monitor Acuapónico UCUNDINAMARCA\nVersión 2.0.0\n\nUsuario: ${user?.nombre} ${user?.apellido}\nCorreo: ${user?.correo}\nActividades: ${userActivities.length}\n\nPlataforma: ${Platform.OS}\n\nDesarrollado para el monitoreo de sistemas acuapónicos con truchas arcoíris y lechugas.`,
    )
  }

  const handleSalir = () => {
    Alert.alert("🚪 Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          await logout()
          // En Android, cerrar la aplicación después del logout
          if (Platform.OS === "android") {
            BackHandler.exitApp()
          }
        },
      },
    ])
  }

  const options = [
    {
      id: 1,
      title: "Ver Usuarios Registrados",
      icon: "people",
      description: "Ver lista de usuarios del sistema",
      action: handleUsuariosRegistrados,
      color: "#2E7D32",
      requiredAccess: "institutional", // Solo institucionales
    },
    {
      id: 2,
      title: "Ver Alertas del Sistema",
      icon: "notifications-active",
      description: "Ver alertas automáticas de variables ambientales",
      action: handleGenerarAlerta,
      color: "#FF9800",
      requiredAccess: "both", // Institucionales y Gmail
    },
    {
      id: 3,
      title: "Generar Reporte",
      icon: "assessment",
      description: "Exportar datos en Excel o PDF",
      action: handleGenerarReporte,
      color: "#1976D2",
      requiredAccess: "institutional", // Solo institucionales
    },
    {
      id: 4,
      title: "Cambiar Contraseña",
      icon: "lock",
      description: "Actualizar tu contraseña",
      action: handleCambiarContrasena,
      color: "#FF5722",
      requiredAccess: "institutional", // Solo institucionales
    },
    {
      id: 5,
      title: "Acerca del Aplicativo",
      icon: "info",
      description: "Información sobre la aplicación",
      action: handleAcercaDe,
      color: "#607D8B",
      requiredAccess: "institutional", // Solo institucionales
    },
    {
      id: 6,
      title: "Cerrar Sesión",
      icon: "exit-to-app",
      description: "Salir de la aplicación",
      action: handleSalir,
      color: "#F44336",
      requiredAccess: "all", // Todos los usuarios
    },
  ]

  // Filtrar opciones según permisos
  const availableOptions = options.filter((option) => {
    if (option.requiredAccess === "all") return true
    if (option.requiredAccess === "institutional") return isUcundinamarcaUser
    if (option.requiredAccess === "both") return isUcundinamarcaUser || isGmailUser
    return false
  })

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Opciones del Sistema</Text>
        <Text style={styles.subtitle}>
          {user?.nombre} {user?.apellido}
        </Text>
        <Text style={styles.userInfo}>{user?.correo}</Text>
        <Text style={styles.activitiesInfo}>
          {isUcundinamarcaUser
            ? "🎓 Usuario Institucional"
            : isGmailUser
              ? "📧 Usuario Gmail"
              : "❌ Usuario Sin Permisos"}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {availableOptions.map((option) => (
          <TouchableOpacity key={option.id} style={styles.optionCard} onPress={option.action}>
            <View style={[styles.optionIcon, { backgroundColor: option.color + "20" }]}>
              <MaterialIcons name={option.icon as any} size={32} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Sistema de Monitoreo Acuapónico</Text>
        <Text style={styles.infoText}>Universidad de Cundinamarca</Text>
        <Text style={styles.infoText}>Versión 2.0.0 - Con Control de Acceso</Text>
        <Text style={styles.infoText}>Plataforma: {Platform.OS}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#2E7D32",
    padding: 20,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "white",
    fontSize: 18,
    marginTop: 5,
    fontWeight: "600",
  },
  userInfo: {
    color: "white",
    fontSize: 14,
    marginTop: 5,
    opacity: 0.9,
  },
  activitiesInfo: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
    textAlign: "center",
  },
  optionsContainer: {
    padding: 20,
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    marginRight: 15,
    padding: 10,
    borderRadius: 25,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  infoContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
})
