"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import { useRef } from "react"
import { AuthProvider, useAuth } from "./src/context/authContext"
import { AlertProvider, useAlert } from "./src/context/AlertContext"
import LoginScreen from "./src/screens/LoginScreen"
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen"
import AlertasScreen from "./src/screens/AlertasScreen"
import UsuariosScreen from "./src/screens/UsuariosScreen"
import ReportesScreen from "./src/screens/ReportesScreen"
import PrediccionTruchasSARIMAScreen from "./src/screens/PrediccionTruchasSARIMAScreen"
import PrediccionLechugasSARIMAScreen from "./src/screens/PrediccionLechugasSARIMAScreen"
import PrediccionTruchasAvanzadaScreen from "./src/screens/PrediccionTruchasAvanzadaScreen"
import PrediccionLechugasAvanzadaScreen from "./src/screens/PrediccionLechugasAvanzadaScreen"
import MainTabNavigator from "./src/navigation/MainTabNavigator"
import AlertOverlay from "./src/components/AlertOverlay"
import type { NavigationContainerRef } from "@react-navigation/native"

const Stack = createStackNavigator()

function AppContent() {
  const { user } = useAuth()
  const { alertaActual, marcarComoVista, ignorarAlerta } = useAlert()
  const navigationRef = useRef<NavigationContainerRef<any>>(null)

  const handleNavigateToAlerts = () => {
    if (navigationRef.current) {
      navigationRef.current.navigate("Alertas")
    }
    if (alertaActual) {
      marcarComoVista(alertaActual.id)
    }
  }

  const handleIgnoreAlert = () => {
    if (alertaActual) {
      ignorarAlerta(alertaActual.id)
    }
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" backgroundColor="#2E7D32" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {user ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="Alertas" component={AlertasScreen} />
              <Stack.Screen name="Usuarios" component={UsuariosScreen} />
              <Stack.Screen name="Reportes" component={ReportesScreen} />
              <Stack.Screen name="PrediccionTruchasSARIMA" component={PrediccionTruchasSARIMAScreen} />
              <Stack.Screen name="PrediccionLechugasSARIMA" component={PrediccionLechugasSARIMAScreen} />
              <Stack.Screen name="PrediccionTruchasAvanzada" component={PrediccionTruchasAvanzadaScreen} />
              <Stack.Screen name="PrediccionLechugasAvanzada" component={PrediccionLechugasAvanzadaScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Overlay de alertas */}
      {alertaActual && (
        <AlertOverlay alerta={alertaActual} onVerAlerta={handleNavigateToAlerts} onIgnorar={handleIgnoreAlert} />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </AuthProvider>
  )
}
