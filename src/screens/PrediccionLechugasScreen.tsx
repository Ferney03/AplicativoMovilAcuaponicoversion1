"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { prediccionLechugasService } from "../services/prediccionService"

const screenWidth = Dimensions.get("window").width

interface PrediccionLechugasScreenProps {
  navigation: any
}

interface ResultadoPrediccion {
  diasPrediccion: number
  alturaActual: number
  alturaPrediccion: number
  areaFoliarActual: number
  areaFoliarPrediccion: number
  crecimientoAlturaEsperado: number
  crecimientoAreaEsperado: number
  r2Altura: number
  r2Area: number
  totalRegistros: number
}

export default function PrediccionLechugasScreen({ navigation }: PrediccionLechugasScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("5")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccion | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<{ alturas: number[]; areas: number[] }>({
    alturas: [],
    areas: [],
  })
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
      const resultado = await prediccionLechugasService.realizarPrediccion(dias)

      setProgreso("Procesando datos para gráficos...")
      // Obtener datos para el gráfico
      const datosHistoricos = await prediccionLechugasService.obtenerDatosHistoricos()
      setDatosParaGrafico({
        alturas: datosHistoricos.alturas.slice(-10),
        areas: datosHistoricos.areas.slice(-10),
      })

      setResultado(resultado)
      setProgreso("")

      Alert.alert(
        "🎯 Predicción Completada",
        `Predicción para ${dias} días:\n\n` +
          `🌱 ALTURA:\n` +
          `• Actual: ${resultado.alturaActual.toFixed(2)} cm\n` +
          `• Predicha: ${resultado.alturaPrediccion.toFixed(2)} cm\n` +
          `• Crecimiento: +${resultado.crecimientoAlturaEsperado.toFixed(2)} cm\n\n` +
          `🍃 ÁREA FOLIAR:\n` +
          `• Actual: ${resultado.areaFoliarActual.toFixed(2)} cm²\n` +
          `• Predicha: ${resultado.areaFoliarPrediccion.toFixed(2)} cm²\n` +
          `• Crecimiento: +${resultado.crecimientoAreaEsperado.toFixed(2)} cm²\n\n` +
          `📋 Días analizados: ${resultado.totalRegistros}`,
      )
    } catch (error) {
      console.error("❌ Error en predicción:", error)
      setProgreso("")
      let errorMessage = "Ocurrió un error desconocido."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
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
        <Text style={styles.title}>Predicción Lechugas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="functions" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelo de Regresión Lineal Dual con Datos Reales</Text>
            <Text style={styles.infoText}>
              Utiliza datos históricos reales de la API, calculando promedios diarios para predecir el crecimiento en
              altura y área foliar de las lechugas.
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
              <MaterialIcons name="hourglass-empty" size={16} color="#4CAF50" />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          )}
        </View>

        {/* Resultados de la predicción */}
        {resultado && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>🎯 Resultados de la Predicción</Text>

            <Text style={styles.sectionTitle}>🌱 ALTURA</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Altura Actual:</Text>
              <Text style={styles.resultValue}>{resultado.alturaActual.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Altura Predicha ({resultado.diasPrediccion} días):</Text>
              <Text style={styles.resultValue}>{resultado.alturaPrediccion.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Crecimiento Esperado:</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{resultado.crecimientoAlturaEsperado.toFixed(2)} cm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Precisión Altura (R²):</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Altura).color }]}>
                {(resultado.r2Altura * 100).toFixed(1)}% {getCalidadModelo(resultado.r2Altura).emoji}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>🍃 ÁREA FOLIAR</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Área Actual:</Text>
              <Text style={styles.resultValue}>{resultado.areaFoliarActual.toFixed(2)} cm²</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Área Predicha ({resultado.diasPrediccion} días):</Text>
              <Text style={styles.resultValue}>{resultado.areaFoliarPrediccion.toFixed(2)} cm²</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Crecimiento Esperado:</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{resultado.crecimientoAreaEsperado.toFixed(2)} cm²
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Precisión Área (R²):</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Area).color }]}>
                {(resultado.r2Area * 100).toFixed(1)}% {getCalidadModelo(resultado.r2Area).emoji}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
              <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
            </View>

            <View style={styles.qualityIndicator}>
              <Text style={styles.qualityText}>Análisis basado en datos reales de API</Text>
            </View>
          </View>
        )}

        {/* Gráficos de datos históricos */}
        {datosParaGrafico.alturas.length > 1 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Promedios Diarios de Altura (Datos Reales)</Text>
              <LineChart
                data={{
                  labels: datosParaGrafico.alturas.map((_, i) => `D${i + 1}`),
                  datasets: [
                    {
                      data: datosParaGrafico.alturas,
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#4CAF50",
                  backgroundGradientFrom: "#66BB6A",
                  backgroundGradientTo: "#4CAF50",
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

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Promedios Diarios de Área Foliar (Datos Reales)</Text>
              <LineChart
                data={{
                  labels: datosParaGrafico.areas.map((_, i) => `D${i + 1}`),
                  datasets: [
                    {
                      data: datosParaGrafico.areas,
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#8BC34A",
                  backgroundGradientFrom: "#9CCC65",
                  backgroundGradientTo: "#8BC34A",
                  decimalPlaces: 0,
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
          </>
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
    backgroundColor: "#4CAF50",
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
    backgroundColor: "#4CAF50",
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
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
  },
  progressText: {
    color: "#4CAF50",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  qualityIndicator: {
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
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
