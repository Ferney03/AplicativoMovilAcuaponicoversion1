"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { authService } from "../config/authApi"
import { useAuth } from "../context/authContext"

interface LoginScreenProps {
  navigation?: any
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert("Error", "Por favor ingresa email y contraseña")
      return
    }

    setLoading(true)

    try {
      console.log("🔐 Intentando login con:", email)
      console.log("🔐 Contraseña ingresada:", password)

      // Mostrar hash de la contraseña para debugging
      const hashTest = authService.testPasswordHash(password)
      console.log("🔐 Hash generado:", hashTest)

      const { usuario, actividades } = await authService.login(email, password)

      console.log("✅ Login exitoso:", usuario.nombre, usuario.apellido)

      await login(usuario, actividades)

      Alert.alert(
        "✅ Bienvenido",
        `Hola ${usuario.nombre} ${usuario.apellido}\n\n¡Has iniciado sesión exitosamente!`,
      )
    } catch (error: any) {
      console.error("❌ Error en login:", error)

      const errorMessage = error.message || "No se pudo iniciar sesión"

      const alertButtons: Array<{ text: string; style?: "default" | "cancel" | "destructive"; onPress?: () => void }> =
        [
          {
            text: "Cerrar",
            style: "cancel",
          },
        ]

      Alert.alert("Error de Autenticación", errorMessage, alertButtons)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    if (navigation) {
      navigation.navigate("ForgotPassword")
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ESCUDO%20BLANCO-lq2HlvrBo4JQUpo2S0PMPOOi8KpuPa.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SISTEMA MÓVIL</Text>
        <Text style={styles.subtitle}>Monitor Acuapónico UCUNDINAMARCA</Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Iniciar Sesión</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword} disabled={loading}>
          <Text style={styles.forgotPasswordText}>¿Problemas para iniciar sesión?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E7D32",
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    opacity: 0.9,
  },
  loginCard: {
    backgroundColor: "#E8F5E8",
    margin: 20,
    borderRadius: 10,
    padding: 30,
    marginBottom: 40,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
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
    backgroundColor: "#4DB6AC",
    borderRadius: 8,
    paddingHorizontal: 15,
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
  loginButton: {
    backgroundColor: "#00897B",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#00897B",
    fontSize: 14,
  },
})
