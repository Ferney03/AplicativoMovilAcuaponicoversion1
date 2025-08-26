"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { sarimaTruchasService } from "../services/sarimaService"

const screenWidth = Dimensions.get("window").width

interface PrediccionTruchasSARIMAScreenProps {
  navigation: any
}

interface ResultadoPrediccionSARIMA {
  diasPrediccion: number
  longitudActual: number
  longitudPrediccion: number
  crecimientoEsperado: number
  prediccionesDiarias: number[]
  confianzaModelo: number
  modeloInfo: {
    p: number
    d: number
    q: number
    P: number
    D: number
    Q: number
    seasonalPeriod: number
    dataPoints: number
    seasonalStrength: number
    isStationary: boolean
  }
  totalRegistros: number
  variablesAmbientales: {
    temperatura: number
    conductividad: number
    ph: number
  }
  metadata: any
}

export default function PrediccionTruchasSARIMAScreen({ navigation }: PrediccionTruchasSARIMAScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("7")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionSARIMA | null>(null)
  const [datosParaGrafico, setDatosParaGrafico] = useState<number[]>([])
  const [progreso, setProgreso] = useState("")

  // Función para validar números y evitar NaN
  const validarNumero = (valor: any, defaultValue = 0): number => {
    const num = Number(valor)
    if (isNaN(num) || !isFinite(num)) {
      return defaultValue
    }
    return num
  }

  // Función para formatear números de forma segura
  const formatearNumero = (valor: number, decimales = 2): string => {
    const numeroValido = validarNumero(valor, 0)
    return numeroValido.toFixed(decimales)
  }

  const realizarPrediccion = async () => {
    const dias = validarNumero(diasPrediccion, 0)
    if (dias <= 0 || dias > 1000) {
      Alert.alert("Error", "Por favor ingresa un número válido de días (1-100)")
      return
    }

    setCargando(true)
    setProgreso("Iniciando análisis SARIMA...")

    try {
      console.log(`🎯 Iniciando predicción SARIMA para ${dias} días...`)

      setProgreso("Obteniendo TODOS los datos históricos diarios...")
      const resultado = await sarimaTruchasService.realizarPrediccionSARIMA(dias)

      setProgreso("Procesando modelo de series temporales...")
      const { datos: datosHistoricos } = await sarimaTruchasService.obtenerDatosHistoricos()
      setDatosParaGrafico(datosHistoricos.slice(-20).map((d: { longitud: number }) => validarNumero(d.longitud, 0)))

      setResultado(resultado)
      setProgreso("")

      Alert.alert(
        "🎯 Predicción SARIMA Completada",
        `Modelo de Series Temporales SARIMA\n\n` +
          `🐟 Longitud actual: ${formatearNumero(resultado.longitudActual)} cm\n` +
          `📈 Longitud predicha: ${formatearNumero(resultado.longitudPrediccion)} cm\n` +
          `📊 Crecimiento esperado: +${formatearNumero(resultado.crecimientoEsperado)} cm\n\n` +
          `🎯 Confianza del modelo: ${formatearNumero(resultado.confianzaModelo * 100, 1)}%\n` +
          `📋 Días analizados: ${resultado.totalRegistros}\n` +
          `🔄 Periodicidad: ${resultado.modeloInfo.seasonalPeriod} días\n\n` +
          `✅ Usando TODOS los datos históricos disponibles`,
      )
    } catch (error) {
      console.error("❌ Error en predicción SARIMA:", error)
      setProgreso("")
      Alert.alert(
        "Error",
        `No se pudo realizar la predicción SARIMA:\n\n${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setCargando(false)
    }
  }

  const getCalidadModelo = (confianza: number) => {
    const confianzaValida = validarNumero(confianza, 0)
    if (confianzaValida >= 0.9) return { texto: "Excelente", color: "#4CAF50", emoji: "🟢" }
    if (confianzaValida >= 0.75) return { texto: "Bueno", color: "#8BC34A", emoji: "🟡" }
    if (confianzaValida >= 0.6) return { texto: "Aceptable", color: "#FF9800", emoji: "🟠" }
    return { texto: "Pobre", color: "#F44336", emoji: "🔴" }
  }

  const getEstacionalidad = (fuerza: number) => {
    const fuerzaValida = validarNumero(fuerza, 0)
    if (fuerzaValida >= 0.7) return { texto: "Fuerte", color: "#4CAF50" }
    if (fuerzaValida >= 0.3) return { texto: "Moderada", color: "#FF9800" }
    return { texto: "Débil", color: "#666" }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>SARIMA Truchas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="timeline" size={24} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelo SARIMA (Series Temporales)</Text>
            <Text style={styles.infoText}>
              📈 SARIMA(p,d,q)(P,D,Q)[s]: Modelo autorregresivo integrado de media móvil estacional{"\n"}🔄 Detecta
              patrones estacionales y tendencias{"\n"}📊 Ideal para predicciones a corto-medio plazo{"\n"}🐟
              Especializado para crecimiento de truchas{"\n"}✅ Usa los datos históricos disponibles{"\n"}🎯
              Soporta predicciones hasta 100 días{"\n"}
            </Text>
          </View>
        </View>

        {/* Input para días de predicción */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>📅 Días para predicción (1-100):</Text>
          <TextInput
            style={styles.input}
            value={diasPrediccion}
            onChangeText={setDiasPrediccion}
            keyboardType="numeric"
            placeholder="Ej: 7, 30, 100"
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.predictButton, cargando && styles.predictButtonDisabled]}
            onPress={realizarPrediccion}
            disabled={cargando}
          >
            <MaterialIcons name="timeline" size={20} color="white" />
            <Text style={styles.predictButtonText}>
              {cargando ? "Analizando series temporales..." : "Realizar Predicción SARIMA"}
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
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>🎯 Resultados SARIMA</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🐟 Longitud Actual:</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.longitudActual)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📈 Longitud Predicha ({resultado.diasPrediccion} días):</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.longitudPrediccion)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📊 Crecimiento Esperado:</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{formatearNumero(resultado.crecimientoEsperado)} cm
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🎯 Confianza del Modelo:</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.confianzaModelo).color }]}>
                  {formatearNumero(resultado.confianzaModelo * 100, 1)}%{" "}
                  {getCalidadModelo(resultado.confianzaModelo).emoji}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
                <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
              </View>

              <View style={styles.qualityIndicator}>
                <Text style={styles.qualityText}>✅ Usando TODOS los datos históricos disponibles</Text>
                <Text style={styles.qualitySubtext}>🎯 Longitud actual obtenida directamente de la API</Text>
              </View>
            </View>

            {/* Información del modelo SARIMA */}
            <View style={styles.modelInfoCard}>
              <Text style={styles.modelInfoTitle}>🔧 Parámetros SARIMA</Text>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Modelo:</Text>
                <Text style={styles.parameterValue}>
                  SARIMA({resultado.modeloInfo.p},{resultado.modeloInfo.d},{resultado.modeloInfo.q})(
                  {resultado.modeloInfo.P},{resultado.modeloInfo.D},{resultado.modeloInfo.Q})[
                  {resultado.modeloInfo.seasonalPeriod}]
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Periodicidad Estacional:</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfo.seasonalPeriod} días</Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Fuerza Estacional:</Text>
                <Text
                  style={[
                    styles.parameterValue,
                    { color: getEstacionalidad(resultado.modeloInfo.seasonalStrength).color },
                  ]}
                >
                  {formatearNumero(resultado.modeloInfo.seasonalStrength * 100, 1)}% (
                  {getEstacionalidad(resultado.modeloInfo.seasonalStrength).texto})
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Serie Estacionaria:</Text>
                <Text
                  style={[styles.parameterValue, { color: resultado.modeloInfo.isStationary ? "#4CAF50" : "#FF9800" }]}
                >
                  {resultado.modeloInfo.isStationary ? "Sí" : "No"}
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Puntos de Datos:</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfo.dataPoints}</Text>
              </View>
            </View>

            {/* Variables ambientales */}
            <View style={styles.variablesCard}>
              <Text style={styles.variablesTitle}>🌡️ Variables Ambientales Actuales</Text>

              <View style={styles.variableRow}>
                <MaterialIcons name="thermostat" size={20} color="#F44336" />
                <Text style={styles.variableLabel}>Temperatura:</Text>
                <Text style={styles.variableValue}>
                  {formatearNumero(resultado.variablesAmbientales.temperatura, 1)}°C
                </Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="electrical-services" size={20} color="#FF9800" />
                <Text style={styles.variableLabel}>Conductividad:</Text>
                <Text style={styles.variableValue}>
                  {formatearNumero(resultado.variablesAmbientales.conductividad, 0)} µS/cm
                </Text>
              </View>

              <View style={styles.variableRow}>
                <MaterialIcons name="science" size={20} color="#9C27B0" />
                <Text style={styles.variableLabel}>pH:</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.ph, 2)}</Text>
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
                  {"\n"}✅ Usando todos los datos para máxima precisión
                </Text>
              </View>
            )}
          </>
        )}

        {/* Gráfico de datos históricos */}
        {datosParaGrafico.length > 1 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>📈 Serie Temporal Histórica - Longitud</Text>
            <LineChart
              data={{
                labels: datosParaGrafico.map((_, i) => `D${i + 1}`),
                datasets: [
                  {
                    data: datosParaGrafico.length > 0 ? datosParaGrafico : [0],
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
            <Text style={styles.chartSubtitle}>Últimos 20 días</Text>
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
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
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
  },
  modelInfoCard: {
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
  modelInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  parameterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 2,
  },
  parameterLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  variablesCard: {
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
  variablesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  variableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 2,
  },
  variableLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  variableValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  metadataCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 20,
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
