"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { View, StatusBar, Platform, BackHandler, Alert } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { AuthProvider, useAuth } from "./src/context/authContext"
import LoginScreen from "./src/screens/LoginScreen"
import MainTabNavigator from "./src/navigation/MainTabNavigator"
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen"
import UsuariosScreen from "./src/screens/UsuariosScreen"
import AlertasScreen from "./src/screens/AlertasScreen"
import ReportesScreen from "./src/screens/ReportesScreen"
import PrediccionTruchasScreen from "./src/screens/PrediccionTruchasScreen"
import PrediccionTruchasAvanzadaScreen from "./src/screens/PrediccionTruchasAvanzadaScreen"
import PrediccionLechugasAvanzadaScreen from "./src/screens/PrediccionLechugasAvanzadaScreen"
import PrediccionTruchasSARIMAScreen from "./src/screens/PrediccionTruchasSARIMAScreen"
import PrediccionLechugasSARIMAScreen from "./src/screens/PrediccionLechugasSARIMAScreen"
import CambiarContrasenaScreen from "./src/screens/CambiarContrasenaScreen"

const Stack = createStackNavigator()

function AppNavigator() {
  const { isLoggedIn } = useAuth()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigatorWrapper} />
            <Stack.Screen name="Usuarios" component={UsuariosScreen} />
            <Stack.Screen name="Alertas" component={AlertasScreen} />
            <Stack.Screen name="Reportes" component={ReportesScreen} />
            <Stack.Screen name="PrediccionTruchas" component={PrediccionTruchasScreen} />
            <Stack.Screen name="PrediccionTruchasAvanzada" component={PrediccionTruchasAvanzadaScreen} />
            <Stack.Screen name="PrediccionLechugasAvanzada" component={PrediccionLechugasAvanzadaScreen} />
            <Stack.Screen name="PrediccionTruchasSARIMA" component={PrediccionTruchasSARIMAScreen} />
            <Stack.Screen name="PrediccionLechugasSARIMA" component={PrediccionLechugasSARIMAScreen} />
            <Stack.Screen name="CambiarContrasena" component={CambiarContrasenaScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// Wrapper para manejar el botón de atrás cuando está logueado
function MainTabNavigatorWrapper() {
  const { logout } = useAuth()

  // Prevenir que el usuario regrese al login con el botón de atrás
  useFocusEffect(() => {
    const onBackPress = () => {
      // Mostrar confirmación para salir de la aplicación
      Alert.alert("Salir de la Aplicación", "¿Deseas cerrar sesión y salir de la aplicación?", [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => null,
        },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await logout()
            // En Android, esto cerrará la aplicación
            if (Platform.OS === "android") {
              BackHandler.exitApp()
            }
          },
        },
      ])
      // Retornar true previene la acción por defecto (ir atrás)
      return true
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress)

    return () => subscription.remove()
  })

  return <MainTabNavigator />
}

export default function App() {
  return (
    <AuthProvider>
      {Platform.OS === "android" && <View style={{ height: StatusBar.currentHeight, backgroundColor: "#2E7D32" }} />}
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />
      <AppNavigator />
    </AuthProvider>
  )
}
