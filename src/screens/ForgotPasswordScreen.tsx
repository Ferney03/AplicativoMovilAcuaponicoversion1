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
import { recuperacionService } from "../services/recuperacionService"
//import { __DEV__ } from "react-native"

interface ForgotPasswordScreenProps {
  navigation: any
}

type Step = "email" | "code" | "password"

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<Step>("email")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [userId, setUserId] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [recoveryToken, setRecoveryToken] = useState("") // Store the token returned by backend

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico")
      return
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido")
      return
    }

    setLoading(true)

    try {
      console.log(`🔐 Solicitando recuperación para: ${email}`)

      const response = await recuperacionService.solicitarRecuperacion(email)

      if (response.success) {
        setSuccessMessage("✅ Correo enviado exitosamente")
        setShowSuccessMessage(true)

        setTimeout(() => {
          setStep("code")
          setShowSuccessMessage(false)
        }, 1500)
      } else {
        Alert.alert("❌ Error", response.message)
      }
    } catch (error: any) {
      console.error("❌ Error en solicitud de recuperación:", error)
      Alert.alert("❌ Error", `No se pudo procesar la solicitud de recuperación.\n\nDetalles: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Por favor ingresa el código de verificación")
      return
    }

    if (verificationCode.length !== 6) {
      Alert.alert("Error", "El código debe tener 6 dígitos")
      return
    }

    setLoading(true)

    try {
      console.log(`🔐 Verificando código para: ${email}`)

      const response = await recuperacionService.verificarCodigo(email, verificationCode)

      if (response.success && response.usuarioId) {
        setUserId(response.usuarioId)
        setRecoveryToken(response.token ?? "") // Store the token for password change
        setStep("password")
        Alert.alert("✅ Código Verificado", "Código correcto. Ahora puedes establecer tu nueva contraseña.")
      } else {
        Alert.alert("❌ Código Incorrecto", response.message)
      }
    } catch (error: any) {
      console.error("❌ Error en verificación de código:", error)
      Alert.alert("❌ Error de Verificación", `No se pudo verificar el código.\n\nDetalles: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      console.log(`🔐 Cambiando contraseña con token: ${recoveryToken}`)
      console.log(`🔐 Nueva contraseña: ${newPassword}`)

      const response = await recuperacionService.cambiarContrasena(recoveryToken, newPassword)

      if (response.success) {
        Alert.alert(
          "✅ Contraseña Actualizada",
          "Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
          [
            {
              text: "Ir a Login",
              onPress: () => navigation.navigate("Login"),
            },
          ],
        )
      } else {
        Alert.alert("❌ Error", response.message)
      }
    } catch (error: any) {
      console.error("❌ Error en cambio de contraseña:", error)
      Alert.alert("❌ Error al Cambiar Contraseña", `No se pudo cambiar la contraseña.\n\nDetalles: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    if (step === "password") {
      setStep("code")
      setNewPassword("")
      setConfirmPassword("")
      setUserId("")
      setRecoveryToken("") // Clear recovery token when going back
    } else if (step === "code") {
      setStep("email")
      setVerificationCode("")
      setGeneratedCode("")
    } else {
      navigation.goBack()
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Recuperar Contraseña"
      case "code":
        return "Verificar Código"
      case "password":
        return "Nueva Contraseña"
      default:
        return "Recuperar Contraseña"
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Ingresa tu correo electrónico registrado para generar un código de verificación"
      case "code":
        return `Ingresa el código de 6 dígitos generado para ${email}`
      case "password":
        return "Establece tu nueva contraseña (mínimo 6 caracteres)"
      default:
        return ""
    }
  }


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} disabled={loading}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={{
            uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ESCUDO%20BLANCO-lq2HlvrBo4JQUpo2S0PMPOOi8KpuPa.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{getStepTitle().toUpperCase()}</Text>
        <Text style={styles.subtitle}>Universidad de Cundinamarca</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{getStepTitle()}</Text>
        <Text style={styles.formDescription}>{getStepDescription()}</Text>

        {showSuccessMessage && (
          <View style={styles.successMessageContainer}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        )}

        {step === "email" && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loadingText}>Validando...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Generar Código</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === "code" && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>CÓDIGO DE VERIFICACIÓN</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="security" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loadingText}>Verificando...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleSendCode} disabled={loading}>
              <Text style={styles.resendButtonText}>Generar Nuevo Código</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "password" && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite la contraseña"
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Requisitos de contraseña:</Text>
              <Text style={[styles.requirement, newPassword.length >= 6 && styles.requirementMet]}>
                • Mínimo 6 caracteres
              </Text>
              <Text
                style={[
                  styles.requirement,
                  newPassword === confirmPassword && newPassword.length > 0 && styles.requirementMet,
                ]}
              >
                • Las contraseñas deben coincidir
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loadingText}>Cambiando...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Cambiar Contraseña</Text>
              )}
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
  submitButton: {
    backgroundColor: "#00897B",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
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
  devButton: {
    marginTop: 10,
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FFA726",
    borderRadius: 5,
  },
  devButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  passwordRequirements: {
    backgroundColor: "#F0F8F0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  requirementMet: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  successMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  successMessageText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
})
