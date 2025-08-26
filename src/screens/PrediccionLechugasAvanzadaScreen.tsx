"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { prediccionLechugasService } from "../services/prediccionService"

const screenWidth = Dimensions.get("window").width

interface PrediccionLechugasAvanzadaScreenProps {
  navigation: any
}

interface ResultadoPrediccionAvanzada {
  diasPrediccion: number
  alturaActual: number
  areaFoliarActual: number
  alturaPrediccion: number
  areaFoliarPrediccion: number
  crecimientoAlturaEsperado: number
  crecimientoAreaEsperado: number
  r2Altura: number
  r2Area: number
  totalRegistros: number
}

export default function PrediccionLechugasAvanzadaScreen({ navigation }: PrediccionLechugasAvanzadaScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("5")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionAvanzada | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<{ alturas: number[]; areas: number[] }>({
    alturas: [],
    areas: [],
  })
  const [progreso, setProgreso] = useState("")

  // Función para validar números y evitar NaN - ULTRA ROBUSTA
  const validarNumero = (valor: any, defaultValue = 0): number => {
    // Si es null, undefined, string vacía, etc.
    if (valor === null || valor === undefined || valor === "" || valor === "null" || valor === "undefined") {
      return defaultValue
    }

    // Convertir a número
    const num = Number(valor)

    // Verificar si es un número válido y finito
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue
    }

    return num
  }

  // Función para formatear números de forma ULTRA segura
  const formatearNumero = (valor: number, decimales = 2): string => {
    try {
      const numeroValido = validarNumero(valor, 0)
      return numeroValido.toFixed(decimales)
    } catch (error) {
      console.error("Error formateando número:", error)
      return "0.00"
    }
  }

  // Función para realizar la predicción ARREGLADA
  const realizarPrediccion = async () => {
    try {
      const dias = validarNumero(diasPrediccion, 0)
      if (dias <= 0 || dias > 1000) {
        Alert.alert("Error", "Por favor ingresa un número válido de días (1-100)")
        return
      }

      setCargando(true)
      setProgreso("Iniciando análisis de regresión...")

      console.log(`🎯 REGRESIÓN: Iniciando predicción para ${dias} días...`)

      setProgreso("Obteniendo TODOS los datos históricos de la API...")
      // 🎯 USAR EL SERVICIO SIMPLE QUE FUNCIONA BIEN
      const resultado = await prediccionLechugasService.realizarPrediccion(dias)

      console.log(`🥬 REGRESIÓN: Resultado recibido:`, resultado)

      setProgreso("Procesando datos para gráficos...")
      // Obtener datos para el gráfico
      try {
        // 🎯 USAR EL SERVICIO SIMPLE QUE FUNCIONA BIEN
        const datosHistoricos = await prediccionLechugasService.obtenerDatosHistoricos()
        const alturasParaGrafico = datosHistoricos.alturas.slice(-10)
        const areasParaGrafico = datosHistoricos.areas.slice(-10)

        setDatosParaGrafico({
          alturas: alturasParaGrafico.length > 0 ? alturasParaGrafico : [0],
          areas: areasParaGrafico.length > 0 ? areasParaGrafico : [0],
        })
      } catch (error) {
        console.error("Error obteniendo datos para gráfico:", error)
        setDatosParaGrafico({ alturas: [0], areas: [0] })
      }

      setResultado(resultado)
      setProgreso("")

      Alert.alert(
        "🎯 Predicción de Regresión Completada",
        `Predicción para ${dias} días:\n\n` +
          `🌱 ALTURA:\n` +
          `• Actual: ${formatearNumero(resultado.alturaActual)} cm\n` +
          `• Predicha: ${formatearNumero(resultado.alturaPrediccion)} cm\n` +
          `• Crecimiento: +${formatearNumero(resultado.crecimientoAlturaEsperado)} cm\n\n` +
          `🍃 ÁREA FOLIAR:\n` +
          `• Actual: ${formatearNumero(resultado.areaFoliarActual)} cm²\n` +
          `• Predicha: ${formatearNumero(resultado.areaFoliarPrediccion)} cm²\n` +
          `• Crecimiento: +${formatearNumero(resultado.crecimientoAreaEsperado)} cm²\n\n` +
          `📋 Días analizados: ${resultado.totalRegistros}\n\n` +
          `✅ Modelo de Regresión Lineal`,
      )
    } catch (error) {
      console.error("❌ REGRESIÓN: Error en predicción:", error)
      setProgreso("")
      Alert.alert(
        "Error",
        `No se pudo realizar la predicción de regresión:\n\n${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (r2: number) => {
    const r2Valido = validarNumero(r2, 0)
    if (r2Valido >= 0.9) return { texto: "Excelente", color: "#4CAF50", emoji: "🟢" }
    if (r2Valido >= 0.75) return { texto: "Bueno", color: "#8BC34A", emoji: "🟡" }
    if (r2Valido >= 0.5) return { texto: "Aceptable", color: "#FF9800", emoji: "🟠" }
    return { texto: "Pobre", color: "#F44336", emoji: "🔴" }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Modelo de Regresión Lechugas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelo de Regresión Lineal</Text>
            <Text style={styles.infoText}>
              Utiliza regresión lineal múltiple con Von Bertalanffy para predecir altura y área foliar de las lechugas.{"\n"}📊 Análisis estadístico completo
            </Text>
          </View>
        </View>

        {/* Input para días de predicción */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>📅 Días para predicción de regresión (1-100):</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder="Ej: 5, 30, 100"
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="trending-up" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? "Analizando con regresión lineal..." : "Realizar Predicción de Regresión"}
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
            <Text style={styles.resultTitle}>🎯 Resultados del Modelo de Regresión</Text>

            <Text style={styles.sectionTitle}>🌱 ALTURA</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Altura Actual:</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.alturaActual)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Predicción ({resultado.diasPrediccion} días):</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.alturaPrediccion)} cm</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Crecimiento Esperado:</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{formatearNumero(resultado.crecimientoAlturaEsperado)} cm
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Precisión (R²):</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Altura).color }]}>
                {formatearNumero(resultado.r2Altura * 100, 1)}% {getCalidadModelo(resultado.r2Altura).emoji}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>🍃 ÁREA FOLIAR</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Área Actual:</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarActual)} cm²</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Predicción ({resultado.diasPrediccion} días):</Text>
              <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarPrediccion)} cm²</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Crecimiento Esperado:</Text>
              <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                +{formatearNumero(resultado.crecimientoAreaEsperado)} cm²
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Precisión (R²):</Text>
              <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2Area).color }]}>
                {formatearNumero(resultado.r2Area * 100, 1)}% {getCalidadModelo(resultado.r2Area).emoji}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
              <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
            </View>

            <View style={styles.qualityIndicator}>
              <Text style={styles.qualityText}>✅ Modelo de Regresión Lineal</Text>
              <Text style={styles.qualitySubtext}>🎯 Valores actuales obtenidos directamente de la API</Text>
              <Text style={styles.qualitySubtext}>📊 Análisis estadístico completo</Text>
            </View>
          </View>
        )}

        {/* Gráficos de datos históricos */}
        {datosParaGrafico.alturas.length > 0 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Datos Históricos de Altura (TODOS los datos)</Text>
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
              <Text style={styles.chartSubtitle}>Últimos días analizados (regresión lineal)</Text>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Datos Históricos de Área Foliar (TODOS los datos)</Text>
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
              <Text style={styles.chartSubtitle}>Últimos días analizados (regresión lineal)</Text>
            </View>
          </>
        )}

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#FF9800" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Metodología del Modelo de Regresión</Text>
            <Text style={styles.infoText}>
              • Se obtienen TODOS los datos históricos{"\n"}• Se aplica regresión lineal dual (altura + área)
              {"\n"}• Se calculan coeficientes de determinación (R²){"\n"}• Obtiene
              valores actuales del último registro{"\n\n"}
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#4CAF50",
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
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#4CAF50",
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
    backgroundColor: "#E8F5E8",
    borderRadius: 10,
  },
  progressText: {
    color: "#4CAF50",
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
    color: "#4CAF50",
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
    backgroundColor: "#E8F5E8",
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    alignItems: "center",
  },
  qualityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 4,
  },
  qualitySubtext: {
    fontSize: 12,
    color: "#4CAF50",
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
