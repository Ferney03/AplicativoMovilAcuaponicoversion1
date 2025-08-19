"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { authService, type Usuario as UsuarioAPI } from "../config/authApi"

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  upa: string
  fechaRegistro?: string
  activo: boolean
}

interface UsuariosScreenProps {
  navigation: any
}

export default function UsuariosScreen({ navigation }: UsuariosScreenProps) {
  const [searchText, setSearchText] = useState("")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("👥 Cargando usuarios desde API de autenticación...")

      // Usar el servicio de autenticación que ya funciona
      const usuariosAPI = await authService.getUsuarios()
      console.log(`✅ Usuarios obtenidos de la API: ${usuariosAPI.length}`)

      // Obtener UPAs para mostrar nombres en lugar de IDs
      let upas: any[] = []
      try {
        upas = await authService.getUpas()
        console.log(`✅ UPAs obtenidas: ${upas.length}`)
      } catch (upaError) {
        console.warn("⚠️ No se pudieron cargar las UPAs:", upaError)
      }

      // Formatear usuarios para la interfaz
      const usuariosFormateados: Usuario[] = usuariosAPI.map((usuario: UsuarioAPI) => {
        // Buscar el nombre de la UPA
        const upa = upas.find((u) => u.idUpa === usuario.upaId)
        const nombreUpa = upa ? upa.nombre : "UPA Desconocida"

        return {
          id: usuario.idUsuario,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.correo,
          upa: nombreUpa,
          activo: usuario.estado,
          fechaRegistro: undefined, // La API no proporciona fecha de registro
        }
      })

      setUsuarios(usuariosFormateados)
      console.log(`✅ Usuarios formateados: ${usuariosFormateados.length}`)
    } catch (error: any) {
      console.error("❌ Error cargando usuarios:", error)
      setError(`Error al cargar usuarios: ${error.message}`)

      // Sin datos de fallback - mostrar error real
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios basado en la búsqueda
  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.upa.toLowerCase().includes(searchText.toLowerCase()),
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Cargando usuarios desde la base de datos...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Usuarios Registrados</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={cargarUsuarios}>
          <MaterialIcons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="warning" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={cargarUsuarios}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, apellido, correo o UPA..."
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
          <Text style={styles.statNumber}>{usuariosFiltrados.length}</Text>
          <Text style={styles.statLabel}>{searchText ? "Encontrados" : "Total Usuarios"}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{usuarios.filter((u) => u.activo).length}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{new Set(usuarios.map((u) => u.upa)).size}</Text>
          <Text style={styles.statLabel}>UPAs</Text>
        </View>
      </View>

      {/* Lista de usuarios */}
      <ScrollView style={styles.usersList}>
        {usuariosFiltrados.length > 0 ? (
          usuariosFiltrados.map((usuario) => (
            <View key={usuario.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userIcon}>
                  <MaterialIcons name="account-circle" size={40} color="#2E7D32" />
                  {!usuario.activo && (
                    <View style={styles.inactiveIndicator}>
                      <MaterialIcons name="block" size={16} color="#F44336" />
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {usuario.nombre} {usuario.apellido}
                  </Text>
                  <Text style={styles.userEmail}>{usuario.email}</Text>
                  <View style={styles.upaContainer}>
                    <MaterialIcons name="location-on" size={16} color="#4CAF50" />
                    <Text style={styles.upaText}>UPA: {usuario.upa}</Text>
                  </View>
                  <Text style={styles.userIdText}>ID: {usuario.id.substring(0, 8)}...</Text>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusIndicator, { backgroundColor: usuario.activo ? "#4CAF50" : "#F44336" }]}>
                    <Text style={styles.statusText}>{usuario.activo ? "Activo" : "Inactivo"}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="search-off" size={48} color="#999" />
            <Text style={styles.noResultsText}>
              {error
                ? "Error al cargar usuarios"
                : searchText
                  ? "No se encontraron usuarios"
                  : "No hay usuarios registrados"}
            </Text>
            <Text style={styles.noResultsSubtext}>
              {error
                ? "Verifica la conexión con la API"
                : searchText
                  ? "Intenta con otros términos de búsqueda"
                  : "La base de datos está vacía"}
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
    color: "#2E7D32",
  },
  header: {
    backgroundColor: "#2E7D32",
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
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userIcon: {
    marginRight: 15,
    position: "relative",
  },
  inactiveIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  upaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  upaText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginLeft: 4,
  },
  userIdText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
