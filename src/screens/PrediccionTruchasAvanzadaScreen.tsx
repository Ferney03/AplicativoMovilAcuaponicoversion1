"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { prediccionAvanzadaTruchasService } from "../services/prediccionService"

const screenWidth = Dimensions.get("window").width

interface PrediccionTruchasAvanzadaScreenProps {
  navigation: any
}

interface ResultadoPrediccionAvanzada {
  diasPrediccion: number
  longitudActual: number
  longitudPrediccionLineal: number
  crecimientoEsperadoLineal: number
  r2Lineal: number
  longitudPrediccionVB: number
  crecimientoEsperadoVB: number
  r2VB: number
  L_infinito: number
  totalRegistros: number
  edadEstimadaMeses: number
}

export default function PrediccionTruchasAvanzadaScreen({ navigation }: PrediccionTruchasAvanzadaScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("5")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionAvanzada | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<number[]>([])
  const [progreso, setProgreso] = useState("")

  const realizarPrediccion = async () => {
    try {
      const dias = Number.parseInt(diasPrediccion)
      if (isNaN(dias) || dias <= 0 || dias > 1000) {
        Alert.alert("Error", "Por favor ingresa un número válido de días (1-100)")
        return
      }

      setCargando(true)
      setProgreso("Obteniendo datos históricos...")

      const resultado = await prediccionAvanzadaTruchasService.realizarPrediccion(dias)

      setProgreso("Procesando datos para gráficos...")
      // Obtener datos para el gráfico
      try {
        const datosHistoricos = await prediccionAvanzadaTruchasService.obtenerDatosHistoricos()
        const longitudesParaGrafico = datosHistoricos.datos.slice(-10).map((d: any) => d.valorObservado)
        setDatosParaGrafico(longitudesParaGrafico.length > 0 ? longitudesParaGrafico : [0])
      } catch (error) {
        console.error("Error obteniendo datos para gráfico:", error)
        setDatosParaGrafico([0])
      }

      setResultado(resultado)
      setProgreso("")

      Alert.alert(
        "🐟 Predicción Avanzada Completada",
        `Predicción para ${dias} días:\n\n` +
          `📏 LONGITUD ACTUAL: ${resultado.longitudActual.toFixed(2)} cm\n\n` +
          `📈 REGRESIÓN LINEAL:\n` +
          `• Predicción: ${resultado.longitudPrediccionLineal.toFixed(2)} cm\n` +
          `• Crecimiento: +${resultado.crecimientoEsperadoLineal.toFixed(2)} cm\n` +
          `• Precisión: ${(resultado.r2Lineal * 100).toFixed(1)}%\n\n`
      )
    } catch (error) {
      console.error("Error en predicción:", error)
      setProgreso("")
      Alert.alert(
        "Error",
        `No se pudo realizar la predicción:\n\n${error instanceof Error ? error.message : String(error)}`,
      )
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
        <Text style={styles.title}>Modelo Avanzado Truchas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="auto-awesome" size={24} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelos Biológicos Avanzados</Text>
            <Text style={styles.infoText}>
              Combina regresión lineal con el modelo de Von Bertalanffy para predicciones del crecimiento de
              truchas. Considera variables ambientales como temperatura, pH, y conductividad.{"\n"}
              🌡️ Variables ambientales integradas{"\n"}📊 Datos de referencia científica
            </Text>
          </View>
        </View>

        {/* Input para días de predicción */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>📅 Días para predicción avanzada (1-1000):</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder="Ej: 5, 30, 100, 365"
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="auto-awesome" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? "Analizando con modelos avanzados..." : "Realizar Predicción Avanzada"}
            </Text>
          </TouchableOpacity>

          {progreso && (
            <View style={styles.progressContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color="#2196F3" />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          )}
        </View>

        {/* Resultados de la predicción */}
        {resultado && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>🐟 Resultados del Modelo Avanzado</Text>

            <Text style={styles.sectionTitle}>📏 ESTADO ACTUAL</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Longitud Actual:</Text>
              <Text style={styles.resultValue}>{resultado.longitudActual.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Edad Estimada:</Text>
              <Text style={styles.resultValue}>{resultado.edadEstimadaMeses.toFixed(1)} meses</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>📈 REGRESIÓN LINEAL</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Predicción ({resultado.diasPrediccion} días):</Text>
              <Text style={styles.resultValue}>{resultado.longitudPrediccionLineal.toFixed(2)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Crecimiento Esperado:</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{resultado.crecimientoEsperadoLineal.toFixed(2)} cm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Precisión (R²):</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Lineal).color }]}>
                {(resultado.r2Lineal * 100).toFixed(1)}% {getCalidadModelo(resultado.r2Lineal).emoji}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
              <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
            </View>

            <View style={styles.qualityIndicator}>
              <Text style={styles.qualityText}>🧬 Modelos Biológicos Avanzados</Text>
              <Text style={styles.qualitySubtext}>📈 Regresión lineal + von Bertalanffy</Text>
              <Text style={styles.qualitySubtext}>🌡️ Variables ambientales integradas</Text>
              <Text style={styles.qualitySubtext}>📊 Datos de referencia científica</Text>
            </View>
          </View>
        )}

        {/* Gráfico de datos históricos */}
        {datosParaGrafico.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>📈 Datos Históricos de Longitud</Text>
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
                backgroundColor: "#2196F3",
                backgroundGradientFrom: "#42A5F5",
                backgroundGradientTo: "#2196F3",
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
            <Text style={styles.chartSubtitle}>Últimos días analizados</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  inputCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    backgroundColor: "#F8F9FA",
  },
  predictButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    marginTop: 15,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
  },
  progressText: {
    color: "#2196F3",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 2,
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
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 4,
  },
  qualitySubtext: {
    fontSize: 12,
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 2,
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  chart: {
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
})
