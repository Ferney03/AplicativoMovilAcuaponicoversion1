"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { prediccionTruchasService } from "../services/prediccionService"

const screenWidth = Dimensions.get("window").width

interface PrediccionTruchasScreenProps {
  navigation: any
}

interface ResultadoPrediccion {
  diasPrediccion: number
  longitudActual: number
  longitudPrediccion: number
  crecimientoEsperado: number
  tasaCrecimiento: number
  r2: number
  totalRegistros: number
}

export default function PrediccionTruchasScreen({ navigation }: PrediccionTruchasScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("5")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccion | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<number[]>([])
  const [progreso, setProgreso] = useState("")

  // Función para realizar la predicción
  const realizarPrediccion = async () => {
    const dias = Number.parseInt(diasPrediccion)
    if (isNaN(dias) || dias <= 0 || dias > 365) {
      Alert.alert("Error", "Por favor ingresa un número válido de días (1-365)")
      return
    }

    setCargando(true)
    setProgreso("Iniciando análisis...")

    try {
      console.log(`🎯 Iniciando predicción para ${dias} días...`)

      setProgreso("Obteniendo datos históricos por días...")
      const resultado = await prediccionTruchasService.realizarPrediccion(dias)

      setProgreso("Procesando datos para gráfico...")
      // Obtener datos para el gráfico
      const datosHistoricos = await prediccionTruchasService.obtenerDatosHistoricos()
      setDatosParaGrafico(datosHistoricos.longitudes.slice(-10)) // Últimos 10 valores

      setResultado(resultado)
      setProgreso("")

      Alert.alert(
        "🎯 Predicción Completada",
        `Predicción para ${dias} días:\n\n` +
          `📏 Longitud actual: ${resultado.longitudActual.toFixed(2)} cm\n` +
          `📈 Longitud predicha: ${resultado.longitudPrediccion.toFixed(2)} cm\n` +
          `📊 Crecimiento esperado: +${resultado.crecimientoEsperado.toFixed(2)} cm\n` +
          `📉 Precisión del modelo (R²): ${(resultado.r2 * 100).toFixed(1)}%\n` +
          `📋 Días analizados: ${resultado.totalRegistros}`,
      )
    } catch (error) {
      console.error("❌ Error en predicción:", error)
      setProgreso("")
      let errorMessage = "Ocurrió un error desconocido."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      Alert.alert("Error", `No se pudo realizar la predicción:\n\n${errorMessage}`)
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (r2: number) => {
    if (r2 >= 0.9) return { texto: "Excelente", color: "#4CAF50", emoji: "🟢" }
    if (r2 >= 0.75) return { texto: "Bueno", color: "#8BC34A", emoji: "🟡" }
    if (r2 >= 0.5) return { texto: "Aceptable", color: "#FF9800", emoji: "🟠" }
    return { texto: "Pobre", color: "#F44336", emoji: "🔴" }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Predicción Truchas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="functions" size={24} color="#1976D2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelo de Regresión Lineal con Datos Reales</Text>
            <Text style={styles.infoText}>
              Utiliza datos históricos reales de la API, calculando promedios diarios para predecir el crecimiento en
              longitud de las truchas.
            </Text>
          </View>
        </View>

        {/* Input para días de predicción */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>📅 Días para predicción:</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder="Ej: 5"
            maxLength={3}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="trending-up" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? "Analizando datos reales..." : "Realizar Predicción"}
            </Text>
          </TouchableOpacity>

          {progreso && (
            <View style={styles.progressContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color="#1976D2" />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          )}
        </View>

        {/* Resultados de la predicción */}
        {resultado && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>🎯 Resultados de la Predicción</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📏 Longitud Actual:</Text>
              <Text style={styles.resultValue}>{resultado.longitudActual.toFixed(2)} cm</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📈 Longitud Predicha ({resultado.diasPrediccion} días):</Text>
              <Text style={styles.resultValue}>{resultado.longitudPrediccion.toFixed(2)} cm</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📊 Crecimiento Esperado:</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{resultado.crecimientoEsperado.toFixed(2)} cm
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📉 Precisión del Modelo (R²):</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2).color }]}>
                {(resultado.r2 * 100).toFixed(1)}% {getCalidadModelo(resultado.r2).emoji}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
              <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
            </View>

            <View style={styles.qualityIndicator}>
              <Text style={styles.qualityText}>
                Calidad del modelo: {getCalidadModelo(resultado.r2).texto} (Datos reales de API)
              </Text>
            </View>
          </View>
        )}

        {/* Gráfico de datos históricos */}
        {datosParaGrafico.length > 1 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>📈 Promedios Diarios de Longitud (Datos Reales)</Text>
            <LineChart
              data={{
                labels: datosParaGrafico.map((_, i) => `D${i + 1}`),
                datasets: [
                  {
                    data: datosParaGrafico,
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: "#1976D2",
                backgroundGradientFrom: "#2196F3",
                backgroundGradientTo: "#1976D2",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
            <Text style={styles.chartSubtitle}>Últimos días analizados (promedios diarios)</Text>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#FF9800" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Metodología de Análisis</Text>
            <Text style={styles.infoText}>
              • Se obtienen datos reales de la API por rangos diarios{"\n"}• Se calcula el promedio de cada día{"\n"}•
              Se aplica regresión lineal a los promedios diarios{"\n"}• R² ≥ 75% indica buena predicción{"\n\n"}✅ Todos
              los datos provienen de tu API real
            </Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  predictButton: {
    backgroundColor: "#1976D2",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  predictButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  predictButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  progressText: {
    color: "#1976D2",
    fontSize: 14,
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  qualityIndicator: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976D2",
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  chart: {
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
})
