"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

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
}

interface AlertasScreenProps {
  navigation: any
}

export default function AlertasScreen({ navigation }: AlertasScreenProps) {
  const [searchText, setSearchText] = useState("")
  const [alertas, setAlertas] = useState<AlertaAutomatica[]>([])

  // Simular alertas automáticas del sistema
  useEffect(() => {
    const alertasSimuladas: AlertaAutomatica[] = [
      {
        id: "alert_001",
        modulo: "tanques",
        variable: "pH",
        valor: 8.5,
        valorLimite: 8.0,
        tipo: "alto",
        timestamp: "2024-01-15 14:23:15",
        descripcion: "pH del agua se elevó por encima del límite seguro",
        icono: "science",
        color: "#F44336",
      },
      {
        id: "alert_002",
        modulo: "cultivos",
        variable: "Temperatura",
        valor: 26.8,
        valorLimite: 25.0,
        tipo: "alto",
        timestamp: "2024-01-15 13:45:22",
        descripcion: "Temperatura ambiente excedió el rango óptimo",
        icono: "thermostat",
        color: "#FF9800",
      },
      {
        id: "alert_003",
        modulo: "tanques",
        variable: "Conductividad",
        valor: 135,
        valorLimite: 150,
        tipo: "bajo",
        timestamp: "2024-01-15 12:10:08",
        descripcion: "Conductividad del agua por debajo del mínimo",
        icono: "electrical-services",
        color: "#FF9800",
      },
      {
        id: "alert_004",
        modulo: "cultivos",
        variable: "Humedad",
        valor: 45,
        valorLimite: 50,
        tipo: "bajo",
        timestamp: "2024-01-15 11:30:45",
        descripcion: "Humedad relativa por debajo del rango recomendado",
        icono: "water-drop",
        color: "#2196F3",
      },
      {
        id: "alert_005",
        modulo: "tanques",
        variable: "Temperatura",
        valor: 9.2,
        valorLimite: 10.0,
        tipo: "bajo",
        timestamp: "2024-01-15 10:15:33",
        descripcion: "Temperatura del agua muy baja para truchas",
        icono: "thermostat",
        color: "#F44336",
      },
      {
        id: "alert_006",
        modulo: "cultivos",
        variable: "pH",
        valor: 5.2,
        valorLimite: 5.5,
        tipo: "bajo",
        timestamp: "2024-01-15 09:22:17",
        descripcion: "pH del sustrato por debajo del óptimo",
        icono: "science",
        color: "#9C27B0",
      },
      {
        id: "alert_007",
        modulo: "tanques",
        variable: "pH",
        valor: 8.3,
        valorLimite: 8.0,
        tipo: "alto",
        timestamp: "2024-01-14 16:45:12",
        descripcion: "pH del agua elevado - revisar sistema de filtración",
        icono: "science",
        color: "#F44336",
      },
      {
        id: "alert_008",
        modulo: "cultivos",
        variable: "Temperatura",
        valor: 17.5,
        valorLimite: 18.0,
        tipo: "bajo",
        timestamp: "2024-01-14 15:30:28",
        descripcion: "Temperatura ambiente baja - activar calefacción",
        icono: "thermostat",
        color: "#FF9800",
      },
    ]

    setAlertas(alertasSimuladas)
  }, [])

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

  const getAlertColor = (tipo: "alto" | "bajo") => {
    return tipo === "alto" ? "#F44336" : "#FF9800"
  }

  const handleAlertDetail = (alerta: AlertaAutomatica) => {
    Alert.alert(
      `🚨 Alerta: ${alerta.variable}`,
      `Módulo: ${alerta.modulo === "cultivos" ? "Cultivos" : "Tanques/Peces"}
      
Variable: ${alerta.variable}
Valor actual: ${alerta.valor}${alerta.variable === "Temperatura" ? "°C" : alerta.variable === "Humedad" ? "%" : alerta.variable === "Conductividad" ? " μS/cm" : ""}
Límite: ${alerta.valorLimite}${alerta.variable === "Temperatura" ? "°C" : alerta.variable === "Humedad" ? "%" : alerta.variable === "Conductividad" ? " μS/cm" : ""}
Tipo: ${alerta.tipo === "alto" ? "Valor Alto" : "Valor Bajo"}

Fecha y hora: ${alerta.timestamp}

Descripción: ${alerta.descripcion}`,
      [
        {
          text: "Marcar como Revisada",
          onPress: () => Alert.alert("✅ Alerta Revisada", "La alerta ha sido marcada como revisada."),
        },
        { text: "Cerrar", style: "cancel" },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Alertas Automáticas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por módulo, variable o descripción..."
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
            {alertasFiltradas.filter((a) => a.tipo === "alto").length}
          </Text>
          <Text style={styles.statLabel}>Valores Altos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#FF9800" }]}>
            {alertasFiltradas.filter((a) => a.tipo === "bajo").length}
          </Text>
          <Text style={styles.statLabel}>Valores Bajos</Text>
        </View>
      </View>

      <ScrollView style={styles.alertsList}>
        {alertasFiltradas.length > 0 ? (
          <>
            {/* Sección Cultivos */}
            {alertasCultivos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🥬 Alertas de Cultivos ({alertasCultivos.length})</Text>
                {alertasCultivos.map((alerta) => (
                  <TouchableOpacity key={alerta.id} style={styles.alertCard} onPress={() => handleAlertDetail(alerta)}>
                    <View style={styles.alertHeader}>
                      <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alerta.tipo) + "20" }]}>
                        <MaterialIcons
                          name={getAlertIcon(alerta.tipo) as any}
                          size={24}
                          color={getAlertColor(alerta.tipo)}
                        />
                      </View>
                      <View style={styles.alertInfo}>
                        <Text style={styles.alertVariable}>{alerta.variable}</Text>
                        <Text style={styles.alertValue}>
                          Valor: {alerta.valor}
                          {alerta.variable === "Temperatura"
                            ? "°C"
                            : alerta.variable === "Humedad"
                              ? "%"
                              : alerta.variable === "Conductividad"
                                ? " μS/cm"
                                : ""}{" "}
                          <Text style={{ color: getAlertColor(alerta.tipo) }}>
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
                <Text style={styles.sectionTitle}>🐟 Alertas de Tanques/Peces ({alertasTanques.length})</Text>
                {alertasTanques.map((alerta) => (
                  <TouchableOpacity key={alerta.id} style={styles.alertCard} onPress={() => handleAlertDetail(alerta)}>
                    <View style={styles.alertHeader}>
                      <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alerta.tipo) + "20" }]}>
                        <MaterialIcons
                          name={getAlertIcon(alerta.tipo) as any}
                          size={24}
                          color={getAlertColor(alerta.tipo)}
                        />
                      </View>
                      <View style={styles.alertInfo}>
                        <Text style={styles.alertVariable}>{alerta.variable}</Text>
                        <Text style={styles.alertValue}>
                          Valor: {alerta.valor}
                          {alerta.variable === "Temperatura"
                            ? "°C"
                            : alerta.variable === "Humedad"
                              ? "%"
                              : alerta.variable === "Conductividad"
                                ? " μS/cm"
                                : ""}{" "}
                          <Text style={{ color: getAlertColor(alerta.tipo) }}>
                            ({alerta.tipo === "alto" ? "↑" : "���"} Límite: {alerta.valorLimite})
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
            <MaterialIcons name="notifications-off" size={48} color="#999" />
            <Text style={styles.noResultsText}>
              {searchText ? "No se encontraron alertas" : "No hay alertas automáticas"}
            </Text>
            <Text style={styles.noResultsSubtext}>
              {searchText ? "Intenta con otros términos de búsqueda" : "El sistema está funcionando correctamente"}
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
  placeholder: {
    width: 34,
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
  alertVariable: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
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
    color: "#999",
    marginTop: 15,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
})
