"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { sarimaLechugasService } from "../services/sarimaService"

const screenWidth = Dimensions.get("window").width

interface PrediccionLechugasSARIMAScreenProps {
  navigation: any
}

interface ResultadoPrediccionSARIMA {
  diasPrediccion: number
  alturaActual: number
  areaFoliarActual: number
  alturaPrediccion: number
  areaFoliarPrediccion: number
  crecimientoAlturaEsperado: number
  crecimientoAreaEsperado: number
  prediccionesAlturasDiarias: number[]
  prediccionesAreasDiarias: number[]
  confianzaModeloAltura: number
  confianzaModeloArea: number
  modeloInfoAltura: {
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
  modeloInfoArea: {
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
    humedad: number
    ph: number
  }
  metadata: any
}

export default function PrediccionLechugasSARIMAScreen({ navigation }: PrediccionLechugasSARIMAScreenProps) {
  const [diasPrediccion, setDiasPrediccion] = useState("7")
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoPrediccionSARIMA | null>(null)
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

  const realizarPrediccion = async () => {
    try {
      const dias = validarNumero(diasPrediccion, 0)
      if (dias <= 0 || dias > 1000) {
        Alert.alert("Error", "Por favor ingresa un número válido de días (1-100)")
        return
      }

      setCargando(true)
      setProgreso("Iniciando análisis SARIMA...")

      console.log(`🎯 SARIMA LECHUGAS UI: Iniciando predicción para ${dias} días...`)

      setProgreso("Obteniendo TODOS los datos históricos diarios...")
      const resultado = await sarimaLechugasService.realizarPrediccionSARIMA(dias)

      console.log(`🥬 SARIMA LECHUGAS UI: Resultado recibido:`, resultado)

      setProgreso("Procesando modelo de series temporales...")
      try {
        const { datos: datosHistoricos } = await sarimaLechugasService.obtenerDatosHistoricos()
        const alturasParaGrafico = datosHistoricos.slice(-20).map((d: { altura: number }) => validarNumero(d.altura, 0))
        const areasParaGrafico = datosHistoricos
          .slice(-20)
          .map((d: { areaFoliar: number }) => validarNumero(d.areaFoliar, 0))

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
        "🎯 Predicción SARIMA Completada",
        `Modelo de Series Temporales SARIMA\n\n` +
          `🌱 Altura actual: ${formatearNumero(resultado.alturaActual)} cm\n` +
          `🍃 Área actual: ${formatearNumero(resultado.areaFoliarActual)} cm²\n\n` +
          `📈 Altura predicha: ${formatearNumero(resultado.alturaPrediccion)} cm\n` +
          `📈 Área predicha: ${formatearNumero(resultado.areaFoliarPrediccion)} cm²\n\n` +
          `📊 Crecimiento altura: +${formatearNumero(resultado.crecimientoAlturaEsperado)} cm\n` +
          `📊 Crecimiento área: +${formatearNumero(resultado.crecimientoAreaEsperado)} cm²\n\n` +
          `🎯 Confianza altura: ${formatearNumero(resultado.confianzaModeloAltura * 100, 1)}%\n` +
          `🎯 Confianza área: ${formatearNumero(resultado.confianzaModeloArea * 100, 1)}%\n` +
          `📋 Días analizados: ${resultado.totalRegistros}\n` +
          `🔄 Periodicidad: ${resultado.modeloInfoAltura.seasonalPeriod} días\n\n` +
          `✅ Usando TODOS los datos históricos disponibles`,
      )
    } catch (error) {
      console.error("❌ SARIMA LECHUGAS UI: Error en predicción:", error)
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
        <Text style={styles.title}>SARIMA Lechugas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información del modelo */}
        <View style={styles.infoCard}>
          <MaterialIcons name="timeline" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Modelo SARIMA (Series Temporales)</Text>
            <Text style={styles.infoText}>
              📈 SARIMA(p,d,q)(P,D,Q)[s]: Modelo autorregresivo integrado de media móvil estacional{"\n"}🔄 Detecta
              patrones estacionales y tendencias{"\n"}🌱 Modelos duales para altura y área foliar{"\n"}✅ Usa los datos históricos disponibles{"\n"}🎯 Soporta
              predicciones hasta 100 días{"\n"}
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
              <MaterialIcons name="hourglass-empty" size={16} color="#4CAF50" />
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
                <Text style={styles.resultLabel}>🌱 Altura Actual:</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.alturaActual)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🍃 Área Foliar Actual:</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarActual)} cm²</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📈 Altura Predicha ({resultado.diasPrediccion} días):</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.alturaPrediccion)} cm</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📈 Área Predicha ({resultado.diasPrediccion} días):</Text>
                <Text style={styles.resultValue}>{formatearNumero(resultado.areaFoliarPrediccion)} cm²</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📊 Crecimiento Altura:</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{formatearNumero(resultado.crecimientoAlturaEsperado)} cm
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📊 Crecimiento Área:</Text>
                <Text style={[styles.resultValue, { color: "#4CAF50" }]}>
                  +{formatearNumero(resultado.crecimientoAreaEsperado)} cm²
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🎯 Confianza Altura:</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.confianzaModeloAltura).color }]}>
                  {formatearNumero(resultado.confianzaModeloAltura * 100, 1)}%{" "}
                  {getCalidadModelo(resultado.confianzaModeloAltura).emoji}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🎯 Confianza Área:</Text>
                <Text style={[styles.resultValue, { color: getCalidadModelo(resultado.confianzaModeloArea).color }]}>
                  {formatearNumero(resultado.confianzaModeloArea * 100, 1)}%{" "}
                  {getCalidadModelo(resultado.confianzaModeloArea).emoji}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📋 Días Analizados:</Text>
                <Text style={styles.resultValue}>{resultado.totalRegistros}</Text>
              </View>

              <View style={styles.qualityIndicator}>
                <Text style={styles.qualityText}>✅ Usando TODOS los datos históricos disponibles</Text>
                <Text style={styles.qualitySubtext}>🎯 Valores actuales obtenidos directamente de la API</Text>
              </View>
            </View>

            {/* Información del modelo SARIMA para altura */}
            <View style={styles.modelInfoCard}>
              <Text style={styles.modelInfoTitle}>🔧 Parámetros SARIMA - Altura</Text>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Modelo:</Text>
                <Text style={styles.parameterValue}>
                  SARIMA({resultado.modeloInfoAltura.p},{resultado.modeloInfoAltura.d},{resultado.modeloInfoAltura.q})(
                  {resultado.modeloInfoAltura.P},{resultado.modeloInfoAltura.D},{resultado.modeloInfoAltura.Q})[
                  {resultado.modeloInfoAltura.seasonalPeriod}]
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Periodicidad Estacional:</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfoAltura.seasonalPeriod} días</Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Fuerza Estacional:</Text>
                <Text
                  style={[
                    styles.parameterValue,
                    { color: getEstacionalidad(resultado.modeloInfoAltura.seasonalStrength).color },
                  ]}
                >
                  {formatearNumero(resultado.modeloInfoAltura.seasonalStrength * 100, 1)}% (
                  {getEstacionalidad(resultado.modeloInfoAltura.seasonalStrength).texto})
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Serie Estacionaria:</Text>
                <Text
                  style={[
                    styles.parameterValue,
                    { color: resultado.modeloInfoAltura.isStationary ? "#4CAF50" : "#FF9800" },
                  ]}
                >
                  {resultado.modeloInfoAltura.isStationary ? "Sí" : "No"}
                </Text>
              </View>
            </View>

            {/* Información del modelo SARIMA para área */}
            <View style={styles.modelInfoCard}>
              <Text style={styles.modelInfoTitle}>🔧 Parámetros SARIMA - Área Foliar</Text>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Modelo:</Text>
                <Text style={styles.parameterValue}>
                  SARIMA({resultado.modeloInfoArea.p},{resultado.modeloInfoArea.d},{resultado.modeloInfoArea.q})(
                  {resultado.modeloInfoArea.P},{resultado.modeloInfoArea.D},{resultado.modeloInfoArea.Q})[
                  {resultado.modeloInfoArea.seasonalPeriod}]
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Periodicidad Estacional:</Text>
                <Text style={styles.parameterValue}>{resultado.modeloInfoArea.seasonalPeriod} días</Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Fuerza Estacional:</Text>
                <Text
                  style={[
                    styles.parameterValue,
                    { color: getEstacionalidad(resultado.modeloInfoArea.seasonalStrength).color },
                  ]}
                >
                  {formatearNumero(resultado.modeloInfoArea.seasonalStrength * 100, 1)}% (
                  {getEstacionalidad(resultado.modeloInfoArea.seasonalStrength).texto})
                </Text>
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Serie Estacionaria:</Text>
                <Text
                  style={[
                    styles.parameterValue,
                    { color: resultado.modeloInfoArea.isStationary ? "#4CAF50" : "#FF9800" },
                  ]}
                >
                  {resultado.modeloInfoArea.isStationary ? "Sí" : "No"}
                </Text>
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
                <MaterialIcons name="water-drop" size={20} color="#2196F3" />
                <Text style={styles.variableLabel}>Humedad:</Text>
                <Text style={styles.variableValue}>{formatearNumero(resultado.variablesAmbientales.humedad, 1)}%</Text>
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
                  {"\n"}✅ Usando TODOS los datos para máxima precisión
                </Text>
              </View>
            )}
          </>
        )}

        {/* Gráficos de datos históricos */}
        {datosParaGrafico.alturas.length > 0 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Serie Temporal Histórica - Altura</Text>
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
              <Text style={styles.chartSubtitle}>Últimos 20 días (usando todos los datos para SARIMA)</Text>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>📈 Serie Temporal Histórica - Área Foliar</Text>
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
              <Text style={styles.chartSubtitle}>Últimos 20 días (usando todos los datos para SARIMA)</Text>
            </View>
          </>
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
    borderLeftColor: "#4CAF50",
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
