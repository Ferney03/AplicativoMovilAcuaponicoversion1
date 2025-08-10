"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { lechugasService } from "../services/apiService"
import { MaterialIcons } from "@expo/vector-icons"

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
      console.error("❌ Error fetching lechugas data:", error)
      setIsConnected(false)
      let errorMessage = "Error desconocido"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      Alert.alert(
        "Error de Conexión - Lechugas",
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

  const chartConfig = {
    backgroundColor: "#2E7D32",
    backgroundGradientFrom: "#4CAF50",
    backgroundGradientTo: "#2E7D32",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
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
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.altura.toFixed(1)} cm</Text>
          <Text style={styles.metricLabel}>Altura</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.areaFoliar.toFixed(1)} cm²</Text>
          <Text style={styles.metricLabel}>Área Foliar</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.temperatura.toFixed(1)}°C</Text>
          <Text style={styles.metricLabel}>Temperatura</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.humedad.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Humedad</Text>
        </View>
      </View>

      <View style={styles.metricCardFull}>
        <Text style={styles.metricValue}>{data.ph.toFixed(2)}</Text>
        <Text style={styles.metricLabel}>pH</Text>
      </View>

      {history.temperatura.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Temperatura - Tiempo Real</Text>
          <LineChart
            data={{
              labels: history.temperatura.map((_, i) => `${i + 1}`),
              datasets: [{ data: history.temperatura }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {history.humedad.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Humedad - Tiempo Real</Text>
          <LineChart
            data={{
              labels: history.humedad.map((_, i) => `${i + 1}`),
              datasets: [{ data: history.humedad }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {history.ph.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>pH - Tiempo Real</Text>
          <LineChart
            data={{
              labels: history.ph.map((_, i) => `${i + 1}`),
              datasets: [{ data: history.ph }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.modelButton} onPress={() => navigation?.navigate("PrediccionLechugasAvanzada")}>
          <Text style={styles.buttonText}>Modelo Avanzado de Crecimiento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modelButton} onPress={() => navigation?.navigate("PrediccionLechugas")}>
          <Text style={styles.buttonText}>Modelo Lineal Simple</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E8",
  },
  statusBar: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
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
  lastUpdateText: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
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
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  metricCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    flex: 0.48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricCardFull: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  chart: {
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  modelButton: {
    backgroundColor: "#00897B",
    borderRadius: 10,
    padding: 15,
    flex: 0.48,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
  },
})
