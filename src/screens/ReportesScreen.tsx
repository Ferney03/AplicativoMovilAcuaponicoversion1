"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

interface ReportesScreenProps {
  navigation: any
}

export default function ReportesScreen({ navigation }: ReportesScreenProps) {
  const [generandoReporte, setGenerandoReporte] = useState(false)

  const generarReporteCultivos = async (formato: "excel" | "pdf") => {
    setGenerandoReporte(true)
    Alert.alert("⏳ Generando Reporte", "Recopilando datos de cultivos...")

    try {
      // Simular datos de cultivos
      const datosCultivos = {
        fecha: new Date().toLocaleDateString(),
        totalRegistros: 403626,
        temperaturaPromedio: 22.5,
        humedadPromedio: 65.2,
        phPromedio: 6.8,
        alturaPromedio: 15.3,
        areaFoliarPromedio: 45.7,
      }

      // Simular generación de archivo
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const contenidoReporte = `REPORTE DE CULTIVOS (${formato.toUpperCase()})
Fecha de generación: ${datosCultivos.fecha}
Sistema de Monitoreo Acuapónico - UCUNDINAMARCA

=== RESUMEN EJECUTIVO ===
Total de registros: ${datosCultivos.totalRegistros.toLocaleString()}
Período: Último mes

=== DATOS PROMEDIO ===
• Temperatura: ${datosCultivos.temperaturaPromedio}°C
• Humedad: ${datosCultivos.humedadPromedio}%
• pH: ${datosCultivos.phPromedio}
• Altura de plantas: ${datosCultivos.alturaPromedio} cm
• Área foliar: ${datosCultivos.areaFoliarPromedio} cm²

=== ANÁLISIS ===
✅ Temperatura dentro del rango óptimo (18-25°C)
✅ Humedad en niveles adecuados (50-80%)
⚠️ pH ligeramente elevado (recomendado: 5.5-7.5)
✅ Crecimiento de plantas normal

=== RECOMENDACIONES ===
1. Monitorear niveles de pH más frecuentemente
2. Mantener condiciones actuales de temperatura
3. Continuar con el programa de fertilización

Generado por: Sistema Móvil Monitor Acuapónico
Universidad de Cundinamarca`

      // Crear archivo temporal
      const fileName = `reporte_cultivos_${Date.now()}.${formato === "pdf" ? "pdf" : "xlsx"}`
      const fileUri = FileSystem.documentDirectory + fileName

      // Escribir contenido (en producción aquí generarías el archivo real)
      await FileSystem.writeAsStringAsync(fileUri, contenidoReporte)

      setGenerandoReporte(false)

      Alert.alert(
        "✅ Reporte Generado",
        `Reporte de cultivos generado exitosamente en formato ${formato.toUpperCase()}`,
        [
          {
            text: "Compartir",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri)
              } else {
                Share.share({
                  message: contenidoReporte,
                  title: `Reporte Cultivos ${datosCultivos.fecha}`,
                })
              }
            },
          },
          {
            text: "Ver Contenido",
            onPress: () => Alert.alert("📄 Contenido del Reporte", contenidoReporte),
          },
          { text: "Cerrar", style: "default" },
        ],
      )
    } catch (error) {
      setGenerandoReporte(false)
      Alert.alert("❌ Error", "No se pudo generar el reporte. Inténtalo de nuevo.")
    }
  }

  const generarReporteTanques = async (formato: "excel" | "pdf") => {
    setGenerandoReporte(true)
    Alert.alert("⏳ Generando Reporte", "Recopilando datos de tanques/peces...")

    try {
      // Simular datos de tanques
      const datosTanques = {
        fecha: new Date().toLocaleDateString(),
        totalRegistros: 1039426,
        temperaturaPromedio: 12.8,
        conductividadPromedio: 198.5,
        phPromedio: 7.2,
        longitudPromedio: 18.4,
      }

      // Simular generación de archivo
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const contenidoReporte = `REPORTE DE TANQUES/PECES (${formato.toUpperCase()})
Fecha de generación: ${datosTanques.fecha}
Sistema de Monitoreo Acuapónico - UCUNDINAMARCA

=== RESUMEN EJECUTIVO ===
Total de registros: ${datosTanques.totalRegistros.toLocaleString()}
Período: Último mes

=== DATOS PROMEDIO ===
• Temperatura del agua: ${datosTanques.temperaturaPromedio}°C
• Conductividad: ${datosTanques.conductividadPromedio} μS/cm
• pH: ${datosTanques.phPromedio}
• Longitud promedio truchas: ${datosTanques.longitudPromedio} cm

=== ANÁLISIS ===
✅ Temperatura del agua óptima (10-15°C)
✅ Conductividad en rango adecuado (150-250 μS/cm)
✅ pH dentro del rango óptimo (6.5-8.0)
✅ Crecimiento de truchas normal

=== CALIDAD DEL AGUA ===
• Oxígeno disuelto: Óptimo
• Turbidez: Baja
• Amoníaco: Dentro de límites
• Nitritos: Controlados

=== RECOMENDACIONES ===
1. Mantener condiciones actuales del agua
2. Continuar con alimentación programada
3. Monitoreo semanal de parámetros químicos

Generado por: Sistema Móvil Monitor Acuapónico
Universidad de Cundinamarca`

      // Crear archivo temporal
      const fileName = `reporte_tanques_${Date.now()}.${formato === "pdf" ? "pdf" : "xlsx"}`
      const fileUri = FileSystem.documentDirectory + fileName

      // Escribir contenido (en producción aquí generarías el archivo real)
      await FileSystem.writeAsStringAsync(fileUri, contenidoReporte)

      setGenerandoReporte(false)

      Alert.alert(
        "✅ Reporte Generado",
        `Reporte de tanques/peces generado exitosamente en formato ${formato.toUpperCase()}`,
        [
          {
            text: "Compartir",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri)
              } else {
                Share.share({
                  message: contenidoReporte,
                  title: `Reporte Tanques ${datosTanques.fecha}`,
                })
              }
            },
          },
          {
            text: "Ver Contenido",
            onPress: () => Alert.alert("📄 Contenido del Reporte", contenidoReporte),
          },
          { text: "Cerrar", style: "default" },
        ],
      )
    } catch (error) {
      setGenerandoReporte(false)
      Alert.alert("❌ Error", "No se pudo generar el reporte. Inténtalo de nuevo.")
    }
  }

  const reportes = [
    {
      id: 1,
      titulo: "Reporte de Cultivos",
      descripcion: "Datos completos de lechugas y variables ambientales",
      icono: "eco",
      color: "#4CAF50",
      modulo: "cultivos",
    },
    {
      id: 2,
      titulo: "Reporte de Tanques/Peces",
      descripcion: "Datos completos de truchas y calidad del agua",
      icono: "waves",
      color: "#2196F3",
      modulo: "tanques",
    },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Generar Reportes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#1976D2" />
          <Text style={styles.infoText}>
            Los reportes incluyen datos históricos, análisis estadístico y recomendaciones basadas en los parámetros
            monitoreados.
          </Text>
        </View>

        {reportes.map((reporte) => (
          <View key={reporte.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={[styles.reportIcon, { backgroundColor: reporte.color + "20" }]}>
                <MaterialIcons name={reporte.icono as any} size={32} color={reporte.color} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{reporte.titulo}</Text>
                <Text style={styles.reportDescription}>{reporte.descripcion}</Text>
              </View>
            </View>

            <View style={styles.formatButtons}>
              <TouchableOpacity
                style={[styles.formatButton, { backgroundColor: "#4CAF50" }]}
                onPress={() =>
                  reporte.modulo === "cultivos" ? generarReporteCultivos("excel") : generarReporteTanques("excel")
                }
                disabled={generandoReporte}
              >
                <MaterialIcons name="table-chart" size={20} color="white" />
                <Text style={styles.formatButtonText}>Excel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatButton, { backgroundColor: "#F44336" }]}
                onPress={() =>
                  reporte.modulo === "cultivos" ? generarReporteCultivos("pdf") : generarReporteTanques("pdf")
                }
                disabled={generandoReporte}
              >
                <MaterialIcons name="picture-as-pdf" size={20} color="white" />
                <Text style={styles.formatButtonText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.historialCard}>
          <Text style={styles.historialTitle}>📁 Historial de Reportes</Text>
          <Text style={styles.historialDescription}>
            Los reportes generados se guardan automáticamente en tu dispositivo y pueden ser compartidos por correo,
            WhatsApp o otras aplicaciones.
          </Text>
          <TouchableOpacity style={styles.historialButton}>
            <MaterialIcons name="folder" size={20} color="#666" />
            <Text style={styles.historialButtonText}>Ver Historial</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {generandoReporte && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <MaterialIcons name="hourglass-empty" size={32} color="#1976D2" />
            <Text style={styles.loadingText}>Generando reporte...</Text>
            <Text style={styles.loadingSubtext}>Por favor espera</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#1976D2",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 5,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  reportIcon: {
    padding: 15,
    borderRadius: 25,
    marginRight: 15,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  reportDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  formatButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  formatButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  historialCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historialTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  historialDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  historialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  historialButtonText: {
    color: "#666",
    marginLeft: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
})
