"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { authService } from "../config/authApi"
import { useAuth } from "../context/authContext"

interface CambiarContrasenaScreenProps {
  navigation: any
}

export default function CambiarContrasenaScreen({ navigation }: CambiarContrasenaScreenProps) {
  const [contrasenaActual, setContrasenaActual] = useState("")
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmarContrasena, setConfirmarContrasena] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { user, updateUser } = useAuth()

  const handleCambiarContrasena = async () => {
    if (!contrasenaActual.trim() || !nuevaContrasena.trim() || !confirmarContrasena.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    if (nuevaContrasena !== confirmarContrasena) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden")
      return
    }

    if (nuevaContrasena.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    if (contrasenaActual === nuevaContrasena) {
      Alert.alert("Error", "La nueva contraseña debe ser diferente a la actual")
      return
    }

    setLoading(true)

    try {
      console.log("🔐 Verificando contraseña actual...")

      // Verificar contraseña actual
      await authService.login(user!.correo, contrasenaActual)
      console.log("✅ Contraseña actual verificada")

      // Cambiar contraseña
      console.log("🔄 Cambiando contraseña...")
      await authService.cambiarContrasena(user!.idUsuario, nuevaContrasena)
      console.log("✅ Contraseña cambiada exitosamente")

      // Actualizar usuario en contexto
      const updatedUser = { ...user!, numIntentos: 0 }
      await updateUser(updatedUser)

      Alert.alert("✅ Contraseña Cambiada", "Tu contraseña ha sido actualizada exitosamente", [
        {
          text: "Aceptar",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("❌ Error cambiando contraseña:", error)
      Alert.alert("Error", "La contraseña actual es incorrecta o hubo un problema al cambiarla")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Cambiar Contraseña</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.userInfo}>
          <MaterialIcons name="account-circle" size={48} color="#2E7D32" />
          <Text style={styles.userName}>
            {user?.nombre} {user?.apellido}
          </Text>
          <Text style={styles.userEmail}>{user?.correo}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Actualizar Contraseña</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONTRASEÑA ACTUAL</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={contrasenaActual}
                onChangeText={setContrasenaActual}
                placeholder="Ingresa tu contraseña actual"
                secureTextEntry={!showCurrentPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showCurrentPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={nuevaContrasena}
                onChangeText={setNuevaContrasena}
                placeholder="Ingresa tu nueva contraseña"
                secureTextEntry={!showNewPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showNewPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONFIRMAR NUEVA CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
                placeholder="Confirma tu nueva contraseña"
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.changeButton, loading && styles.changeButtonDisabled]}
            onPress={handleCambiarContrasena}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialIcons name="security" size={20} color="white" />
                <Text style={styles.changeButtonText}>Cambiar Contraseña</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>📋 Requisitos de la contraseña:</Text>
            <Text style={styles.requirementsText}>
              • Mínimo 6 caracteres{"\n"}• Debe ser diferente a la actual{"\n"}• Se recomienda usar mayúsculas,
              minúsculas y números
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  changeButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  changeButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  changeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  requirements: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 12,
    color: "#2E7D32",
    lineHeight: 18,
  },
})
