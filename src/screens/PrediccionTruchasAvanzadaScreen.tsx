"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { prediccionAvanzadaTruchasService } from "../services/prediccionAvanzadaService"

const screenWidth = Dimensions.get("window").width

interface PrediccionTruchasAvanzadaScreenProps {
  navigation: any
}

interface ResultadoPrediccionAvanzada {
  diasPrediccion: number
  longitudActual: number

  // Regresión lineal
  longitudPrediccionLineal: number
  crecimientoEsperadoLineal: number
  r2Lineal: number
  pendienteLineal: number
  interceptoLineal: number

  // von Bertalanffy
  longitudPrediccionVB: number
  crecimientoEsperadoVB: number
  L_infinito: number
  coeficientesVB: number[]
  r2VB: number
  errorVB: number

  // General
  totalRegistros: number
  edadEstimadaMeses: number
  variablesAmbientales: {
    temperatura: number
    conductividad: number
    ph: number
    oxigeno: number
  }
  metadata: any
}

export default function PrediccionTruchasAvanzadaScreen({ navigation }: PrediccionTruchasAvanzadaScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("7")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionAvanzada | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<number[]>([])
  const [progreso, setProgreso] = useState("")

  const realizarPrediccion = async () => {
    const dias = Number.parseInt(diasPrediccion)
    if (isNaN(dias) || dias <= 0 || dias > 365) {
      Alert.alert("Error", "Por favor ingresa un número válido de días (1-365)")
      return
    }

    setCargando(true)
    setProgreso("Iniciando análisis avanzado...")

    try {
      console.log(`🎯 Iniciando predicción avanzada para ${dias} días...`)

      setProgreso("Obteniendo datos históricos diarios...")
      const resultado = await prediccionAvanzadaTruchasService.realizarPrediccion(dias)

      setProgreso("Procesando modelos de crecimiento...")
      const { datos: datosHistoricos } = await prediccionAvanzadaTruchasService.obtenerDatosHistoricos()
      setDatosParaGrafico(
        datosHistoricos.slice(-15).map((d: { valorObservado: number }) => d.valorObservado)
      )

      setResultado(resultado)
      setProgreso("")

      Alert.alert(
        "🎯 Predicción Avanzada Completada",
        `Modelos: Regresión Lineal + von Bertalanffy\n\n` +
          `📏 Longitud actual: ${resultado.longitudActual.toFixed(2)} cm\n\n` +
          `📈 REGRESIÓN LINEAL:\n` +
          `• Predicha: ${resultado.longitudPrediccionLineal.toFixed(2)} cm\n` +
          `• Crecimiento: +${resultado.crecimientoEsperadoLineal.toFixed(2)} cm\n` +
          `• R²: ${(resultado.r2Lineal * 100).toFixed(1)}%\n\n` +
          `🧬 VON BERTALANFFY:\n` +
          `• Predicha: ${resultado.longitudPrediccionVB.toFixed(2)} cm\n` +
          `• Crecimiento: +${resultado.crecimientoEsperadoVB.toFixed(2)} cm\n` +
          `• R²: ${(resultado.r2VB * 100).toFixed(1)}%\n` +
          `• L∞: ${resultado.L_infinito.toFixed(2)} cm`,
      )
    } catch (error) {
      console.error("❌ Error en predicción avanzada:", error)
      setProgreso("")
      let errorMessage = "Ocurrió un error desconocido."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }
      Alert.alert("Error", `No se pudo realizar la predicción avanzada:\n\n${errorMessage}`)
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
        <Text style={styles.title}>Predicción Avanzada Truchas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="psychology" size={24} color="#1976D2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelos Duales: Lineal + von Bertalanffy</Text>
            <Text style={styles.infoText}>
              📈 Regresión Lineal: L(t) = mt + b{"\n"}🧬 von Bertalanffy: L(t) = L∞ · (1 - e^(-k(t-t₀))){"\n\n"}
              Combina simplicidad lineal con realismo biológico.
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
            placeholder="Ej: 7"
            maxLength={3}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="psychology" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? "Analizando datos diarios..." : "Realizar Predicción Dual"}
            </Text>
          </TouchableOpacity>

          {progreso && (
            <View style={styles.progressContainer}>
              <MaterialIcons name="settings" size={16} color="#1976D2" />
              <Text style={styles.progressText}>{progreso}</Text>
            </View>
          )}
        </View>

        {/* Resultados de la predicción */}
        {resultado && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>🎯 Resultados de Ambos Modelos</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📏 Longitud Actual:</Text>
                <Text style={styles.resultValue}>{resultado.longitudActual.toFixed(2)} cm</Text>
              </View>

              <Text style={styles.sectionTitle}>📈 REGRESIÓN LINEAL</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Longitud Predicha ({resultado.diasPrediccion} días):</Text>
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
                <Text style={styles.resultLabel}>Tasa de Crecimiento:</Text>
                <Text style={styles.resultValue}>{resultado.pendienteLineal.toFixed(4)} cm/día</Text>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 15 }]}>🧬 VON BERTALANFFY</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Longitud Predicha ({resultado.diasPrediccion} días):</Text>
                <Text style={styles.resultValue}>{resultado.longitudPrediccionVB.toFixed(2)} cm</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Crecimiento Esperado:</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{resultado.crecimientoEsperadoVB.toFixed(2)} cm
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Precisión (R²):</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.r2VB).color }]}>
                  {(resultado.r2VB * 100).toFixed(1)}% {getCalidadModelo(resultado.r2VB).emoji}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Longitud Máxima Teórica (L∞):</Text>
                <Text style={[styles.resultValue, { color: "#FF9800" }]}>{resultado.L_infinito.toFixed(2)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
                <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🎂 Edad Estimada:</Text>
                <Text style={styles.resultValue}>{resultado.edadEstimadaMeses?.toFixed(1)} meses</Text>
              </View>
            </View>

            {/* Variables ambientales */}
            <View style={styles.variablesCard}>
              <Text style={styles.variablesTitle}>🌡️ Variables Ambientales Actuales</Text>

              <View style={styles.variableRow}>
                <MaterialIcons name="thermostat" size={20} color="#F44336" />
                <Text style={styles.variableLabel}>Temperatura:</Text>
                <Text style={styles.variableValue}>{resultado.variablesAmbientales.temperatura.toFixed(1)}°C</Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="air" size={20} color="#2196F3" />
                <Text style={styles.variableLabel}>Oxígeno Disuelto:</Text>
                <Text style={styles.variableValue}>{resultado.variablesAmbientales.oxigeno.toFixed(1)} mg/L</Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="electrical-services" size={20} color="#FF9800" />
                <Text style={styles.variableLabel}>Conductividad:</Text>
                <Text style={styles.variableValue}>
                  {resultado.variablesAmbientales.conductividad.toFixed(0)} μS/cm
                </Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="science" size={20} color="#9C27B0" />
                <Text style={styles.variableLabel}>pH:</Text>
                <Text style={styles.variableValue}>{resultado.variablesAmbientales.ph.toFixed(2)}</Text>
              </View>
            </View>

            {/* Información de la API */}
            {resultado.metadata && (
              <View style={styles.metadataCard}>
                <Text style={styles.metadataTitle}>📊 Información de los Datos</Text>
                <Text style={styles.metadataText}>
                  • {resultado.metadata.descripcion}
                  {"\n"}• Frecuencia original: {resultado.metadata.frecuenciaOriginal}
                  {"\n"}• Total de días disponibles: {resultado.metadata.totalDias}
                  {"\n"}• Registros por día: {resultado.metadata.registrosPorDia?.toLocaleString()}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Gráfico de datos históricos */}
        {datosParaGrafico.length > 1 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>📈 Datos Históricos Diarios</Text>
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
            <Text style={styles.chartSubtitle}>Últimos 15 días (último dato diario)</Text>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Ventajas del Enfoque Dual</Text>
            <Text style={styles.infoText}>
              • Usa endpoint optimizado de la API (último dato diario){"\n"}• Regresión lineal: simple y rápida{"\n"}•
              von Bertalanffy: biológicamente realista{"\n"}• Calibrado con datos de referencia (0-8 meses){"\n"}•
              Considera variables ambientales{"\n"}• Compara ambos enfoques para mejor decisión{"\n\n"}✅ Basado en{" "}
              {resultado?.totalRegistros} días de datos reales
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
    fontSize: 18,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
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
  variablesCard: {
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
  variablesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  variableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  variableLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
  variableValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  metadataCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  metadataText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
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
