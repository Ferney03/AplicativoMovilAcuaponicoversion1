"use client"

import { useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { View, StatusBar, Platform, BackHandler } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import LoginScreen from "./src/screens/LoginScreen"
import MainTabNavigator from "./src/navigation/MainTabNavigator"
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen"
import UsuariosScreen from "./src/screens/UsuariosScreen"
import AlertasScreen from "./src/screens/AlertasScreen"
import ReportesScreen from "./src/screens/ReportesScreen"
import PrediccionTruchasScreen from "./src/screens/PrediccionTruchasScreen"
import PrediccionLechugasScreen from "./src/screens/PrediccionLechugasScreen"
import PrediccionTruchasAvanzadaScreen from "./src/screens/PrediccionTruchasAvanzadaScreen"
import PrediccionLechugasAvanzadaScreen from "./src/screens/PrediccionLechugasAvanzadaScreen"

const Stack = createStackNavigator()

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState("")

  const handleLogin = (email: string) => {
    setCurrentUserEmail(email)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUserEmail("")
  }

  return (
    <>
      {Platform.OS === "android" && <View style={{ height: StatusBar.currentHeight, backgroundColor: "#2E7D32" }} />}
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <>
              <Stack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={handleLogin} />}</Stack.Screen>
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main">
                {(props) => <MainTabNavigatorWrapper {...props} userEmail={currentUserEmail} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen name="Usuarios" component={UsuariosScreen} />
              <Stack.Screen name="Alertas" component={AlertasScreen} />
              <Stack.Screen name="Reportes" component={ReportesScreen} />
              <Stack.Screen name="PrediccionTruchas" component={PrediccionTruchasScreen} />
              <Stack.Screen name="PrediccionLechugas" component={PrediccionLechugasScreen} />
              <Stack.Screen name="PrediccionTruchasAvanzada" component={PrediccionTruchasAvanzadaScreen} />
              <Stack.Screen name="PrediccionLechugasAvanzada" component={PrediccionLechugasAvanzadaScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}

// Wrapper para manejar el botón de atrás cuando está logueado
function MainTabNavigatorWrapper({ userEmail, onLogout }: { userEmail: string; onLogout: () => void }) {
  // Prevenir que el usuario regrese al login con el botón de atrás
  useFocusEffect(() => {
    const onBackPress = () => {
      // Retornar true previene la acción por defecto (ir atrás)
      return true
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress)

    return () => subscription.remove()
  })

  return <MainTabNavigator userEmail={userEmail} onLogout={onLogout} />
}
