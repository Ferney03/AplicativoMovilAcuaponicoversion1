"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

// Datos simplificados de usuarios registrados
const USUARIOS_REGISTRADOS = [
  {
    id: 1,
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "carlos.rodriguez@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 2,
    nombre: "María",
    apellido: "González",
    email: "maria.gonzalez@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 3,
    nombre: "Juan",
    apellido: "Martínez",
    email: "juan.martinez@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 4,
    nombre: "Ana",
    apellido: "López",
    email: "ana.lopez@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 5,
    nombre: "Pedro",
    apellido: "Sánchez",
    email: "pedro.sanchez@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 6,
    nombre: "Laura",
    apellido: "García",
    email: "laura.garcia@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 7,
    nombre: "Miguel",
    apellido: "Torres",
    email: "miguel.torres@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
  {
    id: 8,
    nombre: "Carmen",
    apellido: "Ruiz",
    email: "carmen.ruiz@ucundinamarca.edu.co",
    upa: "El Vergel",
  },
]

interface UsuariosScreenProps {
  navigation: any
}

export default function UsuariosScreen({ navigation }: UsuariosScreenProps) {
  const [searchText, setSearchText] = useState("")

  // Filtrar usuarios basado en la búsqueda
  const usuariosFiltrados = USUARIOS_REGISTRADOS.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchText.toLowerCase()) ||
      usuario.upa.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Usuarios Registrados</Text>
        <View style={styles.placeholder} />
      </View>

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
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>UPA Activa</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>El Vergel</Text>
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
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="search-off" size={48} color="#999" />
            <Text style={styles.noResultsText}>No se encontraron usuarios</Text>
            <Text style={styles.noResultsSubtext}>Intenta con otros términos de búsqueda</Text>
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
  },
})
