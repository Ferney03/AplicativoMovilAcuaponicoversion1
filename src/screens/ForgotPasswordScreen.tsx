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
import { MaterialIcons } from "@expo/vector-icons"

// Usuarios simulados para verificar si el correo existe
const USUARIOS_REGISTRADOS = [
  "carlos.rodriguez@ucundinamarca.edu.co",
  "maria.gonzalez@ucundinamarca.edu.co",
  "juan.martinez@ucundinamarca.edu.co",
  "ana.lopez@ucundinamarca.edu.co",
  "pedro.sanchez@ucundinamarca.edu.co",
  "admin@ucundinamarca.edu.co",
  "usuario@ucundinamarca.edu.co",
]

interface ForgotPasswordScreenProps {
  navigation: any
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [verificationCode, setVerificationCode] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico")
      return
    }

    if (!email.includes("@ucundinamarca.edu.co")) {
      Alert.alert("Error", "Debes usar un correo institucional (@ucundinamarca.edu.co)")
      return
    }

    setLoading(true)

    // Simular verificación del correo
    setTimeout(() => {
      const emailExists = USUARIOS_REGISTRADOS.includes(email.toLowerCase())

      if (emailExists) {
        // Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        setGeneratedCode(code)
        setStep("code")
        Alert.alert(
          "✅ Código Enviado",
          `Se ha enviado un código de verificación a:\n${email}\n\n🔐 Código: ${code}\n\n(En producción, este código se enviaría por correo)`,
        )
      } else {
        Alert.alert(
          "❌ Correo No Encontrado",
          "El correo electrónico ingresado no está registrado en el sistema.\n\nContacta al administrador para registrarte.",
        )
      }
      setLoading(false)
    }, 2000)
  }

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Por favor ingresa el código de verificación")
      return
    }

    if (verificationCode === generatedCode) {
      Alert.alert(
        "✅ Código Verificado",
        "El código es correcto. En producción, aquí podrías restablecer tu contraseña.",
        [
          {
            text: "Continuar",
            onPress: () => navigation.goBack(),
          },
        ],
      )
    } else {
      Alert.alert("❌ Código Incorrecto", "El código ingresado no es válido. Inténtalo de nuevo.")
    }
  }

  const handleGoBack = () => {
    if (step === "code") {
      setStep("email")
      setVerificationCode("")
      setGeneratedCode("")
    } else {
      navigation.goBack()
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={{
            uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ESCUDO%20BLANCO-lq2HlvrBo4JQUpo2S0PMPOOi8KpuPa.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>RECUPERAR CONTRASEÑA</Text>
        <Text style={styles.subtitle}>Universidad de Cundinamarca</Text>
      </View>

      <View style={styles.formCard}>
        {step === "email" ? (
          <>
            <Text style={styles.formTitle}>Ingresa tu Correo</Text>
            <Text style={styles.formDescription}>
              Te enviaremos un código de verificación a tu correo institucional
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ucundinamarca.edu.co"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>{loading ? "Verificando..." : "Enviar Código"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.formTitle}>Código de Verificación</Text>
            <Text style={styles.formDescription}>Ingresa el código de 6 dígitos enviado a {email}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CÓDIGO DE VERIFICACIÓN</Text>
              <TextInput
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="123456"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleVerifyCode}>
              <Text style={styles.submitButtonText}>Verificar Código</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleSendCode}>
              <Text style={styles.resendButtonText}>Reenviar Código</Text>
            </TouchableOpacity>
          </>
        )}
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    padding: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
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
  formCard: {
    backgroundColor: "#E8F5E8",
    margin: 20,
    borderRadius: 10,
    padding: 30,
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  formDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
    lineHeight: 20,
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
  submitButton: {
    backgroundColor: "#00897B",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  resendButton: {
    marginTop: 15,
    alignItems: "center",
  },
  resendButtonText: {
    color: "#00897B",
    fontSize: 14,
    textDecorationLine: "underline",
  },
})
