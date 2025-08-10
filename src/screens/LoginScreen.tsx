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
} from "react-native"

interface LoginScreenProps {
  onLogin: (email: string) => void
  navigation?: any
}

export default function LoginScreen({ onLogin, navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = () => {
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert("Error", "Por favor ingresa email y contraseña")
      return
    }

    // Simulación de login básico
    if (email.includes("@") && password.length >= 6) {
      onLogin(email)
    } else {
      Alert.alert("Error", "Credenciales inválidas")
    }
  }

  const handleForgotPassword = () => {
    navigation?.navigate("ForgotPassword")
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
        <Text style={styles.loginTitle}>Login</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@ucundinamarca.edu.co"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
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
  input: {
    backgroundColor: "#4DB6AC",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  loginButton: {
    backgroundColor: "#00897B",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
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
