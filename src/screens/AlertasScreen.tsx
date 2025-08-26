"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { truchasService, lechugasService } from "../services/apiService"

interface AlertaAutomatica {
  id: string
  modulo: "cultivos" | "tanques"
  variable: string
  valor: number
  valorLimite: number
  tipo: "alto" | "bajo"
  timestamp: string
  descripcion: string
  icono: string
  color: string
  severidad: "critica" | "alta" | "media" | "baja"
}

interface AlertasScreenProps {
  navigation: any
}

// Límites ACTUALIZADOS según especificaciones
const LIMITES_TRUCHAS = {
  temperatura: { min: 9, max: 21 }, // °C
  conductividad: { min: 250, max: 850 }, // μS/cm
  ph: { min: 6.5, max: 8.8 },
}

const LIMITES_LECHUGAS = {
  temperatura: { min: 15, max: 28 }, // °C
  humedad: { min: 50, max: 85 }, // %
  ph: { min: 5.5, max: 7.4 },
}

export default function AlertasScreen({ navigation }: AlertasScreenProps) {
  const [searchText, setSearchText] = useState("")
  const [alertas, setAlertas] = useState<AlertaAutomatica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarAlertasReales()

    // Actualizar alertas cada 30 segundos
    const interval = setInterval(cargarAlertasReales, 30000)
    return () => clearInterval(interval)
  }, [])

  const cargarAlertasReales = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🚨 Cargando alertas desde la API con límites actualizados...")

      const alertasGeneradas: AlertaAutomatica[] = []

      // Obtener datos actuales de truchas - SOLO VARIABLES AMBIENTALES
      try {
        const datosTruchas = await truchasService.getLatestValues()
        console.log("🐟 Datos truchas obtenidos:", datosTruchas)

        // Verificar SOLO variables ambientales de truchas (NO longitud)
        const verificarTruchas = [
          {
            key: "temperatura",
            valor: datosTruchas.temperatura,
            limites: LIMITES_TRUCHAS.temperatura,
            unidad: "°C",
            variable: "Temperatura",
          },
          {
            key: "conductividad",
            valor: datosTruchas.conductividad,
            limites: LIMITES_TRUCHAS.conductividad,
            unidad: "μS/cm",
            variable: "Conductividad",
          },
          {
            key: "ph",
            valor: datosTruchas.ph,
            limites: LIMITES_TRUCHAS.ph,
            unidad: "",
            variable: "pH",
          },
        ]

        verificarTruchas.forEach((item) => {
          if (item.valor < item.limites.min) {
            alertasGeneradas.push({
              id: `truchas_${item.key}_bajo_${Date.now()}`,
              modulo: "tanques",
              variable: item.variable,
              valor: item.valor,
              valorLimite: item.limites.min,
              tipo: "bajo",
              timestamp: new Date().toLocaleString(),
              descripcion: `${item.variable} del agua por debajo del mínimo recomendado (${item.limites.min}${item.unidad})`,
              icono: item.key === "temperatura" ? "thermostat" : item.key === "ph" ? "science" : "electrical-services",
              color: "#F44336",
              severidad: item.valor < item.limites.min * 0.8 ? "critica" : "alta",
            })
          } else if (item.valor > item.limites.max) {
            alertasGeneradas.push({
              id: `truchas_${item.key}_alto_${Date.now()}`,
              modulo: "tanques",
              variable: item.variable,
              valor: item.valor,
              valorLimite: item.limites.max,
              tipo: "alto",
              timestamp: new Date().toLocaleString(),
              descripcion: `${item.variable} del agua por encima del máximo recomendado (${item.limites.max}${item.unidad})`,
              icono: item.key === "temperatura" ? "thermostat" : item.key === "ph" ? "science" : "electrical-services",
              color: "#FF9800",
              severidad: item.valor > item.limites.max * 1.2 ? "critica" : "alta",
            })
          }
        })
      } catch (truchasError) {
        console.error("❌ Error obteniendo datos de truchas:", truchasError)
      }

      // Obtener datos actuales de lechugas
      try {
        const datosLechugas = await lechugasService.getLatestValues()
        console.log("🥬 Datos lechugas obtenidos:", datosLechugas)

        // Verificar SOLO variables ambientales de lechugas 
        const verificarLechugas = [
          {
            key: "temperatura",
            valor: datosLechugas.temperatura,
            limites: LIMITES_LECHUGAS.temperatura,
            unidad: "°C",
            variable: "Temperatura",
          },
          {
            key: "humedad",
            valor: datosLechugas.humedad,
            limites: LIMITES_LECHUGAS.humedad,
            unidad: "%",
            variable: "Humedad",
          },
          {
            key: "ph",
            valor: datosLechugas.ph,
            limites: LIMITES_LECHUGAS.ph,
            unidad: "",
            variable: "pH",
          },
        ]

        verificarLechugas.forEach((item) => {
          if (item.valor < item.limites.min) {
            alertasGeneradas.push({
              id: `lechugas_${item.key}_bajo_${Date.now()}`,
              modulo: "cultivos",
              variable: item.variable,
              valor: item.valor,
              valorLimite: item.limites.min,
              tipo: "bajo",
              timestamp: new Date().toLocaleString(),
              descripcion: `${item.variable} del ambiente por debajo del mínimo recomendado (${item.limites.min}${item.unidad})`,
              icono: item.key === "temperatura" ? "thermostat" : item.key === "ph" ? "science" : "water-drop",
              color: "#F44336",
              severidad: item.valor < item.limites.min * 0.8 ? "critica" : "alta",
            })
          } else if (item.valor > item.limites.max) {
            alertasGeneradas.push({
              id: `lechugas_${item.key}_alto_${Date.now()}`,
              modulo: "cultivos",
              variable: item.variable,
              valor: item.valor,
              valorLimite: item.limites.max,
              tipo: "alto",
              timestamp: new Date().toLocaleString(),
              descripcion: `${item.variable} del ambiente por encima del máximo recomendado (${item.limites.max}${item.unidad})`,
              icono: item.key === "temperatura" ? "thermostat" : item.key === "ph" ? "science" : "water-drop",
              color: "#FF9800",
              severidad: item.valor > item.limites.max * 1.2 ? "critica" : "alta",
            })
          }
        })
      } catch (lechugasError) {
        console.error("❌ Error obteniendo datos de lechugas:", lechugasError)
      }

      // Ordenar alertas por severidad y timestamp
      alertasGeneradas.sort((a, b) => {
        const severidadOrder = { critica: 4, alta: 3, media: 2, baja: 1 }
        return severidadOrder[b.severidad] - severidadOrder[a.severidad]
      })

      setAlertas(alertasGeneradas)
      console.log(`✅ Alertas generadas: ${alertasGeneradas.length}`)

      if (alertasGeneradas.length === 0) {
        console.log("✅ No hay alertas - todas las variables ambientales están dentro de los rangos normales")
      }
    } catch (error: any) {
      console.error("❌ Error cargando alertas:", error)
      setError(`Error al cargar alertas: ${error.message}`)
      setAlertas([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar alertas basado en la búsqueda
  const alertasFiltradas = alertas.filter(
    (alerta) =>
      alerta.modulo.toLowerCase().includes(searchText.toLowerCase()) ||
      alerta.variable.toLowerCase().includes(searchText.toLowerCase()) ||
      alerta.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
      alerta.tipo.toLowerCase().includes(searchText.toLowerCase()),
  )

  // Agrupar alertas por módulo
  const alertasCultivos = alertasFiltradas.filter((a) => a.modulo === "cultivos")
  const alertasTanques = alertasFiltradas.filter((a) => a.modulo === "tanques")

  const getAlertIcon = (tipo: "alto" | "bajo") => {
    return tipo === "alto" ? "trending-up" : "trending-down"
  }

  const getAlertColor = (severidad: string) => {
    switch (severidad) {
      case "critica":
        return "#D32F2F"
      case "alta":
        return "#F44336"
      case "media":
        return "#FF9800"
      case "baja":
        return "#2196F3"
      default:
        return "#FF9800"
    }
  }

  const getSeveridadText = (severidad: string) => {
    switch (severidad) {
      case "critica":
        return "🔴 CRÍTICA"
      case "alta":
        return "🟠 ALTA"
      case "media":
        return "🟡 MEDIA"
      case "baja":
        return "🔵 BAJA"
      default:
        return "🟡 MEDIA"
    }
  }

  const handleAlertDetail = (alerta: AlertaAutomatica) => {
    Alert.alert(
      `🚨 Alerta ${getSeveridadText(alerta.severidad)}`,
      `Módulo: ${alerta.modulo === "cultivos" ? "Cultivos (Lechugas)" : "Tanques (Truchas)"}
      
Variable: ${alerta.variable}
Valor actual: ${alerta.valor}${alerta.variable === "Temperatura" ? "°C" : alerta.variable === "Humedad" ? "%" : alerta.variable === "Conductividad" ? " μS/cm" : ""}
Límite ${alerta.tipo}: ${alerta.valorLimite}${alerta.variable === "Temperatura" ? "°C" : alerta.variable === "Humedad" ? "%" : alerta.variable === "Conductividad" ? " μS/cm" : ""}
Severidad: ${getSeveridadText(alerta.severidad)}

Fecha y hora: ${alerta.timestamp}

Descripción: ${alerta.descripcion}

⚠️ Recomendación: Revisar inmediatamente el sistema ${alerta.modulo === "cultivos" ? "de cultivos" : "de tanques"}.

📊 LÍMITES:
🐟 Truchas: T(9-21°C), pH(6.5-8.8), C(250-850μS/cm)
🥬 Lechugas: T(15-28°C), pH(5.5-7.4), H(50-85%)`,
      [
        {
          text: "Marcar como Revisada",
          onPress: () => Alert.alert("✅ Alerta Revisada", "La alerta ha sido marcada como revisada."),
        },
        { text: "Cerrar", style: "cancel" },
      ],
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Analizando variables ambientales con límites actualizados...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Alertas Ambientales</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={cargarAlertasReales}>
          <MaterialIcons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="warning" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={cargarAlertasReales}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Información de límites */}
      <View style={styles.limitsContainer}>
        <Text style={styles.limitsTitle}>📊 Límites Actualizados:</Text>
        <Text style={styles.limitsText}>🐟 Truchas: T(9-21°C), pH(6.5-8.8), C(250-850μS/cm)</Text>
        <Text style={styles.limitsText}>🥬 Lechugas: T(15-28°C), pH(5.5-7.4), H(50-85%)</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por variable ambiental..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <MaterialIcons name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{alertasFiltradas.length}</Text>
          <Text style={styles.statLabel}>{searchText ? "Encontradas" : "Total Alertas"}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#F44336" }]}>
            {alertasFiltradas.filter((a) => a.severidad === "critica" || a.severidad === "alta").length}
          </Text>
          <Text style={styles.statLabel}>Críticas/Altas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#4CAF50" }]}>{alertasFiltradas.length === 0 ? "OK" : "⚠️"}</Text>
          <Text style={styles.statLabel}>Estado</Text>
        </View>
      </View>

      <ScrollView style={styles.alertsList}>
        {alertasFiltradas.length > 0 ? (
          <>
            {/* Sección Cultivos */}
            {alertasCultivos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🥬 Alertas Ambientales - Cultivos ({alertasCultivos.length})</Text>
                {alertasCultivos.map((alerta) => (
                  <TouchableOpacity
                    key={alerta.id}
                    style={[styles.alertCard, { borderLeftColor: getAlertColor(alerta.severidad) }]}
                    onPress={() => handleAlertDetail(alerta)}
                  >
                    <View style={styles.alertHeader}>
                      <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alerta.severidad) + "20" }]}>
                        <MaterialIcons
                          name={getAlertIcon(alerta.tipo) as any}
                          size={24}
                          color={getAlertColor(alerta.severidad)}
                        />
                      </View>
                      <View style={styles.alertInfo}>
                        <View style={styles.alertTitleRow}>
                          <Text style={styles.alertVariable}>{alerta.variable}</Text>
                          <Text style={[styles.severidadBadge, { backgroundColor: getAlertColor(alerta.severidad) }]}>
                            {getSeveridadText(alerta.severidad)}
                          </Text>
                        </View>
                        <Text style={styles.alertValue}>
                          Valor: {alerta.valor}
                          {alerta.variable === "Temperatura"
                            ? "°C"
                            : alerta.variable === "Humedad"
                              ? "%"
                              : alerta.variable === "Conductividad"
                                ? " μS/cm"
                                : ""}{" "}
                          <Text style={{ color: getAlertColor(alerta.severidad) }}>
                            ({alerta.tipo === "alto" ? "↑" : "↓"} Límite: {alerta.valorLimite})
                          </Text>
                        </Text>
                        <Text style={styles.alertDescription}>{alerta.descripcion}</Text>
                        <Text style={styles.alertTimestamp}>{alerta.timestamp}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={24} color="#666" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sección Tanques */}
            {alertasTanques.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🐟 Alertas Ambientales - Tanques ({alertasTanques.length})</Text>
                {alertasTanques.map((alerta) => (
                  <TouchableOpacity
                    key={alerta.id}
                    style={[styles.alertCard, { borderLeftColor: getAlertColor(alerta.severidad) }]}
                    onPress={() => handleAlertDetail(alerta)}
                  >
                    <View style={styles.alertHeader}>
                      <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alerta.severidad) + "20" }]}>
                        <MaterialIcons
                          name={getAlertIcon(alerta.tipo) as any}
                          size={24}
                          color={getAlertColor(alerta.severidad)}
                        />
                      </View>
                      <View style={styles.alertInfo}>
                        <View style={styles.alertTitleRow}>
                          <Text style={styles.alertVariable}>{alerta.variable}</Text>
                          <Text style={[styles.severidadBadge, { backgroundColor: getAlertColor(alerta.severidad) }]}>
                            {getSeveridadText(alerta.severidad)}
                          </Text>
                        </View>
                        <Text style={styles.alertValue}>
                          Valor: {alerta.valor}
                          {alerta.variable === "Temperatura"
                            ? "°C"
                            : alerta.variable === "Humedad"
                              ? "%"
                              : alerta.variable === "Conductividad"
                                ? " μS/cm"
                                : ""}{" "}
                          <Text style={{ color: getAlertColor(alerta.severidad) }}>
                            ({alerta.tipo === "alto" ? "↑" : "↓"} Límite: {alerta.valorLimite})
                          </Text>
                        </Text>
                        <Text style={styles.alertDescription}>{alerta.descripcion}</Text>
                        <Text style={styles.alertTimestamp}>{alerta.timestamp}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={24} color="#666" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name={error ? "error" : "check-circle"} size={48} color={error ? "#F44336" : "#4CAF50"} />
            <Text style={[styles.noResultsText, { color: error ? "#F44336" : "#4CAF50" }]}>
              {error
                ? "Error al cargar alertas"
                : searchText
                  ? "No se encontraron alertas"
                  : "✅ Variables ambientales normales"}
            </Text>
            <Text style={styles.noResultsSubtext}>
              {error
                ? "Verifica la conexión con la API"
                : searchText
                  ? "Intenta con otros términos de búsqueda"
                  : "Todas las variables están dentro de los rangos actualizados"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF9800",
    textAlign: "center",
  },
  header: {
    backgroundColor: "#FF9800",
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
  refreshButton: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  errorText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#F44336",
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  limitsContainer: {
    backgroundColor: "#E8F5E8",
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  limitsText: {
    fontSize: 12,
    color: "#388E3C",
    marginBottom: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    flex: 0.3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF9800",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  alertsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  alertCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    padding: 10,
    borderRadius: 25,
    marginRight: 15,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  alertVariable: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  severidadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  alertValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  alertDescription: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
    lineHeight: 18,
  },
  alertTimestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
})
