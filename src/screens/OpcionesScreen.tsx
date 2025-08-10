import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { API_BASE_URL, testConnection } from "../config/api"
import { Platform } from "react-native"

interface OpcionesScreenProps {
  onLogout: () => void
  navigation?: any
}

// Datos simulados de usuarios registrados
const USUARIOS_REGISTRADOS = [
  { id: 1, nombre: "Dr. Carlos Rodríguez", email: "carlos.rodriguez@ucundinamarca.edu.co" },
  { id: 2, nombre: "Ing. María González", email: "maria.gonzalez@ucundinamarca.edu.co" },
  { id: 3, nombre: "Prof. Juan Martínez", email: "juan.martinez@ucundinamarca.edu.co" },
  { id: 4, nombre: "Dra. Ana López", email: "ana.lopez@ucundinamarca.edu.co" },
  { id: 5, nombre: "Ing. Pedro Sánchez", email: "pedro.sanchez@ucundinamarca.edu.co" },
]

export default function OpcionesScreen({ onLogout, navigation }: OpcionesScreenProps) {
  const handleUsuariosRegistrados = () => {
    if (navigation) {
      navigation.navigate("Usuarios")
    } else {
      // Fallback para cuando no hay navegación
      const usuariosList = USUARIOS_REGISTRADOS.map(
        (user, index) => `${index + 1}. ${user.nombre}\n   ${user.email}`,
      ).join("\n\n")

      Alert.alert("👥 Usuarios Registrados", `Total: ${USUARIOS_REGISTRADOS.length} usuarios\n\n${usuariosList}`, [
        { text: "Cerrar", style: "default" },
      ])
    }
  }

  const handleGenerarAlerta = () => {
    if (navigation) {
      navigation.navigate("Alertas")
    } else {
      // Fallback para cuando no hay navegación
      Alert.alert("🚨 Configurar Alertas", "Selecciona el tipo de alerta que deseas configurar:", [
        {
          text: "Cultivos (Lechugas)",
          onPress: () => configurarAlertaCultivos(),
        },
        {
          text: "Tanques/Peces (Truchas)",
          onPress: () => configurarAlertaTanques(),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ])
    }
  }

  const configurarAlertaCultivos = () => {
    Alert.alert(
      "🥬 Alertas para Cultivos",
      "Configurar alertas para cambios bruscos en:\n\n• Temperatura > 25°C o < 18°C\n• Humedad > 80% o < 50%\n• pH > 7.5 o < 5.5\n• Altura de crecimiento anormal",
      [
        {
          text: "Activar Alertas",
          onPress: () =>
            Alert.alert("✅ Alertas Activadas", "Las alertas para cultivos han sido configuradas correctamente."),
        },
        { text: "Cancelar", style: "cancel" },
      ],
    )
  }

  const configurarAlertaTanques = () => {
    Alert.alert(
      "🐟 Alertas para Tanques/Peces",
      "Configurar alertas para cambios bruscos en:\n\n• Temperatura > 15°C o < 10°C\n• Conductividad > 250 μS/cm o < 150 μS/cm\n• pH > 8.0 o < 6.5\n• Longitud de crecimiento anormal",
      [
        {
          text: "Activar Alertas",
          onPress: () =>
            Alert.alert("✅ Alertas Activadas", "Las alertas para tanques/peces han sido configuradas correctamente."),
        },
        { text: "Cancelar", style: "cancel" },
      ],
    )
  }

  const handleGenerarReporte = () => {
    if (navigation) {
      navigation.navigate("Reportes")
    } else {
      // Fallback para cuando no hay navegación
      Alert.alert("📊 Generar Reporte", "Selecciona el módulo para generar el reporte:", [
        {
          text: "Cultivos (Excel)",
          onPress: () => generarReporteCultivos("excel"),
        },
        {
          text: "Cultivos (PDF)",
          onPress: () => generarReporteCultivos("pdf"),
        },
        {
          text: "Tanques/Peces (Excel)",
          onPress: () => generarReporteTanques("excel"),
        },
        {
          text: "Tanques/Peces (PDF)",
          onPress: () => generarReporteTanques("pdf"),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ])
    }
  }

  const generarReporteCultivos = async (formato: "excel" | "pdf") => {
    Alert.alert("⏳ Generando Reporte", "Recopilando datos de cultivos...")

    // Simular generación de reporte
    setTimeout(() => {
      const fecha = new Date().toLocaleDateString()
      const reporteInfo = `Reporte de Cultivos (${formato.toUpperCase()})\nFecha: ${fecha}\n\nDatos incluidos:\n• Temperatura actual y histórica\n• Humedad del ambiente\n• Niveles de pH\n• Altura de plantas\n• Área foliar\n\nTotal de registros: 403,626`

      Alert.alert("✅ Reporte Generado", reporteInfo, [
        {
          text: "Compartir",
          onPress: () =>
            Share.share({
              message: reporteInfo,
              title: `Reporte Cultivos ${fecha}`,
            }),
        },
        { text: "Cerrar", style: "default" },
      ])
    }, 2000)
  }

  const generarReporteTanques = async (formato: "excel" | "pdf") => {
    Alert.alert("⏳ Generando Reporte", "Recopilando datos de tanques/peces...")

    // Simular generación de reporte
    setTimeout(() => {
      const fecha = new Date().toLocaleDateString()
      const reporteInfo = `Reporte de Tanques/Peces (${formato.toUpperCase()})\nFecha: ${fecha}\n\nDatos incluidos:\n• Temperatura del agua\n• Conductividad eléctrica\n• Niveles de pH\n• Longitud de truchas\n• Calidad del agua\n\nTotal de registros: 1,039,426`

      Alert.alert("✅ Reporte Generado", reporteInfo, [
        {
          text: "Compartir",
          onPress: () =>
            Share.share({
              message: reporteInfo,
              title: `Reporte Tanques ${fecha}`,
            }),
        },
        { text: "Cerrar", style: "default" },
      ])
    }, 2000)
  }

  const handleTestConnection = async () => {
    Alert.alert("Probando conexión", "Verificando conexión con la API...")
    const isConnected = await testConnection()
    Alert.alert(
      isConnected ? "✅ Conexión exitosa" : "❌ Error de conexión",
      isConnected
        ? "La conexión con la API está funcionando correctamente"
        : `No se pudo conectar con la API.\n\nURL: ${API_BASE_URL}\nPlataforma: ${Platform.OS}\n\nVerifica:\n• Que tu API esté corriendo en puerto 55839\n• La configuración de red\n• El firewall\n• Que los endpoints respondan correctamente`,
    )
  }

  const handleSalir = () => {
    Alert.alert("🚪 Salir de la Aplicación", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          onLogout()
        },
      },
    ])
  }

  const options = [
    {
      id: 1,
      title: "Usuarios Registrados",
      icon: "people",
      description: "Ver lista de usuarios del sistema",
      action: handleUsuariosRegistrados,
      color: "#2E7D32",
    },
    {
      id: 2,
      title: "Generar Alerta y/o Regularidad",
      icon: "notifications-active",
      description: "Configurar alertas para cambios bruscos",
      action: handleGenerarAlerta,
      color: "#FF9800",
    },
    {
      id: 3,
      title: "Generar Reporte",
      icon: "assessment",
      description: "Exportar datos en Excel o PDF",
      action: handleGenerarReporte,
      color: "#1976D2",
    },
    {
      id: 4,
      title: "Probar Conexión API",
      icon: "wifi",
      description: "Verificar conexión con el servidor",
      action: handleTestConnection,
      color: "#4CAF50",
    },
    {
      id: 5,
      title: "Acerca de",
      icon: "info",
      description: "Información sobre la aplicación",
      action: () =>
        Alert.alert(
          "Acerca de",
          `Monitor Acuapónico UCUNDINAMARCA\nVersión 1.0.0\n\nAPI URL: ${API_BASE_URL}\nPlataforma: ${Platform.OS}\n\nDesarrollado para el monitoreo de sistemas acuapónicos con truchas arcoíris y lechugas.`,
        ),
      color: "#607D8B",
    },
    {
      id: 6,
      title: "Salir",
      icon: "exit-to-app",
      description: "Cerrar sesión y salir de la aplicación",
      action: handleSalir,
      color: "#F44336",
    },
  ]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Opciones del Sistema</Text>
        <Text style={styles.subtitle}>Configuración y herramientas</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
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
        <Text style={styles.infoText}>Versión 1.0.0</Text>
        <Text style={styles.infoText}>API: {API_BASE_URL}</Text>
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
    fontSize: 16,
    marginTop: 5,
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
    fontSize: 18,
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
