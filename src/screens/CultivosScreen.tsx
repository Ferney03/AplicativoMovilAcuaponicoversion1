"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { lechugasService } from "../services/apiService"
import { MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../context/authContext"

const screenWidth = Dimensions.get("window").width

interface LechugaDisplayData {
  altura: number
  areaFoliar: number
  temperatura: number
  humedad: number
  ph: number
}

interface HistoryData {
  temperatura: number[]
  humedad: number[]
  ph: number[]
}

interface CultivosScreenProps {
  navigation?: any
}

export default function CultivosScreen({ navigation }: CultivosScreenProps = {}) {
  const { user } = useAuth()
  const [data, setData] = useState<LechugaDisplayData>({
    altura: 0,
    areaFoliar: 0,
    temperatura: 0,
    humedad: 0,
    ph: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [history, setHistory] = useState<HistoryData>({
    temperatura: [],
    humedad: [],
    ph: [],
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Verificar acceso según el dominio del correo
  const isUcundinamarcaUser = user?.correo?.endsWith("@ucundinamarca.edu.co") || false
  const isGmailUser = user?.correo?.endsWith("@gmail.com") || false

  // Solo usuarios institucionales tienen acceso a modelos
  const hasModelAccess = isUcundinamarcaUser

  console.log(`🔍 CultivosScreen - Usuario: ${user?.correo}`)
  console.log(`🎓 Ucundinamarca: ${isUcundinamarcaUser} (acceso completo)`)
  console.log(`📧 Gmail: ${isGmailUser} (solo visualización)`)
  console.log(`📊 Acceso a modelos: ${hasModelAccess}`)

  const fetchData = async () => {
    try {
      console.log("🥬 Starting lechugas data fetch...")
      const latestData = await lechugasService.getLatestValues()

      const newData = {
        altura: Number(latestData.altura) || 0,
        areaFoliar: Number(latestData.areaFoliar) || 0,
        temperatura: Number(latestData.temperatura) || 0,
        humedad: Number(latestData.humedad) || 0,
        ph: Number(latestData.ph) || 0,
      }

      console.log("🥬 Final lechugas data:", newData)
      setData(newData)
      setIsConnected(true)
      setLastUpdate(new Date())

      // Actualizar historial para gráficas (mantener últimos 10 valores)
      setHistory((prev) => ({
        temperatura: [...prev.temperatura.slice(-9), newData.temperatura],
        humedad: [...prev.humedad.slice(-9), newData.humedad],
        ph: [...prev.ph.slice(-9), newData.ph],
      }))
    } catch (error) {
      console.error("❌ Error fetching truchas data:", error)
      setIsConnected(false)
      const errorMessage = error instanceof Error ? error.message : String(error)
      Alert.alert(
        "Error de Conexión - Truchas",
        `No se pudieron obtener los datos.\n\nDetalles del error:\n${errorMessage}\n\nVerifica:\n• Tu API esté corriendo en puerto 55839\n• La conexión de red\n• El firewall`,
      )
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000) // Actualizar cada 15 segundos
    return () => clearInterval(interval)
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleModeloRegresion = () => {
    if (!hasModelAccess) {
      Alert.alert(
        "Acceso Restringido",
        "Los modelos de regresión solo están disponibles para usuarios institucionales (@ucundinamarca.edu.co)",
      )
      return
    }

    // Solo un modelo unificado
    navigation?.navigate("PrediccionLechugasAvanzada")
  }

  const handleModeloSeriesTemporales = () => {
    if (!hasModelAccess) {
      Alert.alert(
        "Acceso Restringido",
        "Los modelos de series temporales solo están disponibles para usuarios institucionales (@ucundinamarca.edu.co)",
      )
      return
    }

    navigation?.navigate("PrediccionLechugasSARIMA")
  }

  // Configuraciones de gráficos estilo Tableau/PowerBI
  const temperaturaChartConfig = {
    backgroundColor: "#FF6B35",
    backgroundGradientFrom: "#FF8E53",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: "#FF4500",
    backgroundGradientToOpacity: 0.8,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 20,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "3",
      stroke: "#ffffff",
      fill: "#FFE4B5",
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: "rgba(255,255,255,0.3)",
      strokeWidth: 1,
    },
    strokeWidth: 4,
    fillShadowGradient: "#FFE4B5",
    fillShadowGradientOpacity: 0.3,
  }

  const humedadChartConfig = {
    backgroundColor: "#1E88E5",
    backgroundGradientFrom: "#42A5F5",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: "#0D47A1",
    backgroundGradientToOpacity: 0.9,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 20,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "3",
      stroke: "#ffffff",
      fill: "#87CEEB",
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: "rgba(255,255,255,0.3)",
      strokeWidth: 1,
    },
    strokeWidth: 4,
    fillShadowGradient: "#87CEEB",
    fillShadowGradientOpacity: 0.3,
  }

  const phChartConfig = {
    backgroundColor: "#7B1FA2",
    backgroundGradientFrom: "#9C27B0",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: "#4A148C",
    backgroundGradientToOpacity: 0.9,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 20,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "3",
      stroke: "#ffffff",
      fill: "#E1BEE7",
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: "rgba(255,255,255,0.3)",
      strokeWidth: 1,
    },
    strokeWidth: 4,
    fillShadowGradient: "#E1BEE7",
    fillShadowGradientOpacity: 0.3,
  }

  const getConnectionStatus = () => {
    if (isConnected === null) return { color: "#FFA726", icon: "sync", text: "Conectando..." }
    if (isConnected) return { color: "#4CAF50", icon: "wifi", text: "Conectado" }
    return { color: "#F44336", icon: "wifi-off", text: "Sin conexión" }
  }

  const status = getConnectionStatus()

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: status.color }]}>
          <MaterialIcons name={status.icon as any} size={16} color="white" />
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
        {lastUpdate && (
          <Text style={styles.lastUpdateText}>Última actualización: {lastUpdate.toLocaleTimeString()}</Text>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Monitoreo de Lechugas</Text>
        <Text style={styles.subtitle}>Datos en tiempo real</Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, styles.alturaCard]}>
          <MaterialIcons name="height" size={32} color="#4CAF50" />
          <Text style={[styles.metricValue, { color: "#4CAF50" }]}>{data.altura.toFixed(1)} cm</Text>
          <Text style={styles.metricLabel}>Altura</Text>
        </View>
        <View style={[styles.metricCard, styles.areaCard]}>
          <MaterialIcons name="eco" size={32} color="#8BC34A" />
          <Text style={[styles.metricValue, { color: "#8BC34A" }]}>{data.areaFoliar.toFixed(1)} cm²</Text>
          <Text style={styles.metricLabel}>Área Foliar</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, styles.tempCard]}>
          <MaterialIcons name="thermostat" size={32} color="#FF6B35" />
          <Text style={[styles.metricValue, { color: "#FF6B35" }]}>{data.temperatura.toFixed(1)}°C</Text>
          <Text style={styles.metricLabel}>Temperatura</Text>
        </View>
        <View style={[styles.metricCard, styles.humedadCard]}>
          <MaterialIcons name="water-drop" size={32} color="#1E88E5" />
          <Text style={[styles.metricValue, { color: "#1E88E5" }]}>{data.humedad.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Humedad</Text>
        </View>
      </View>

      <View style={[styles.metricCardFull, styles.phCard]}>
        <MaterialIcons name="science" size={32} color="#7B1FA2" />
        <Text style={[styles.metricValue, { color: "#7B1FA2" }]}>{data.ph.toFixed(2)}</Text>
        <Text style={styles.metricLabel}>pH</Text>
      </View>

      {history.temperatura.length > 1 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <MaterialIcons name="thermostat" size={24} color="#FF6B35" />
            <Text style={styles.chartTitle}>Temperatura - Tiempo Real</Text>
          </View>
          <LineChart
            data={{
              labels: history.temperatura.map((_, i) => `${i + 1}`),
              datasets: [
                {
                  data: history.temperatura,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  strokeWidth: 4,
                },
              ],
            }}
            width={screenWidth - 40}
            height={240}
            chartConfig={temperaturaChartConfig}
            bezier
            style={styles.chart}
            withShadow={true}
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
          />
          <View style={styles.chartFooter}>
            <Text style={styles.chartSubtitle}>📈 Tendencia en tiempo real</Text>
          </View>
        </View>
      )}

      {history.humedad.length > 1 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <MaterialIcons name="water-drop" size={24} color="#1E88E5" />
            <Text style={styles.chartTitle}>Humedad - Tiempo Real</Text>
          </View>
          <LineChart
            data={{
              labels: history.humedad.map((_, i) => `${i + 1}`),
              datasets: [
                {
                  data: history.humedad,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  strokeWidth: 4,
                },
              ],
            }}
            width={screenWidth - 40}
            height={240}
            chartConfig={humedadChartConfig}
            bezier
            style={styles.chart}
            withShadow={true}
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
          />
          <View style={styles.chartFooter}>
            <Text style={styles.chartSubtitle}>💧 Monitoreo continuo</Text>
          </View>
        </View>
      )}

      {history.ph.length > 1 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <MaterialIcons name="science" size={24} color="#7B1FA2" />
            <Text style={styles.chartTitle}>pH - Tiempo Real</Text>
          </View>
          <LineChart
            data={{
              labels: history.ph.map((_, i) => `${i + 1}`),
              datasets: [
                {
                  data: history.ph,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  strokeWidth: 4,
                },
              ],
            }}
            width={screenWidth - 40}
            height={240}
            chartConfig={phChartConfig}
            bezier
            style={styles.chart}
            withShadow={true}
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
          />
          <View style={styles.chartFooter}>
            <Text style={styles.chartSubtitle}>⚗️ Control de acidez</Text>
          </View>
        </View>
      )}

      {/* Botones para modelos estadísticos - Solo usuarios institucionales */}
      {hasModelAccess && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.regressionButton} onPress={handleModeloRegresion}>
            <MaterialIcons name="trending-up" size={20} color="white" />
            <Text style={styles.buttonText}>Modelo de Regresión Unificado</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.timeSeriesButton} onPress={handleModeloSeriesTemporales}>
            <MaterialIcons name="timeline" size={20} color="white" />
            <Text style={styles.buttonText}>Series Temporales SARIMA</Text>
          </TouchableOpacity>
        </View>
      )}

      {!hasModelAccess && (isGmailUser || !isUcundinamarcaUser) && (
        <View style={styles.restrictedContainer}>
          <MaterialIcons name={isGmailUser ? "visibility" : "lock"} size={24} color="#999" />
          <Text style={styles.restrictedText}>
            {isGmailUser
              ? "Usuario Gmail: Solo visualización de gráficas y alertas"
              : "Los modelos estadísticos requieren correo institucional"}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  statusBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  lastUpdateText: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
  },
  header: {
    backgroundColor: "#2E7D32",
    padding: 25,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "white",
    fontSize: 16,
    marginTop: 5,
    opacity: 0.9,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  metricCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    flex: 0.48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 4,
  },
  alturaCard: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  areaCard: {
    borderLeftColor: "#8BC34A",
    backgroundColor: "#F9FBE7",
  },
  tempCard: {
    borderLeftColor: "#FF6B35",
    backgroundColor: "#FFF3E0",
  },
  humedadCard: {
    borderLeftColor: "#1E88E5",
    backgroundColor: "#E3F2FD",
  },
  metricCardFull: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 4,
  },
  phCard: {
    borderLeftColor: "#7B1FA2",
    backgroundColor: "#F3E5F5",
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontWeight: "500",
  },
  chartContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#F0F0F0",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  chart: {
    borderRadius: 20,
    marginVertical: 8,
  },
  chartFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: "center",
  },
  chartSubtitle: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  regressionButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timeSeriesButton: {
    backgroundColor: "#9C27B0",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  restrictedContainer: {
    alignItems: "center",
    padding: 20,
    margin: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  restrictedText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
})
