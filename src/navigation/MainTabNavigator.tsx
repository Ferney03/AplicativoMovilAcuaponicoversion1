"use client"

import type React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialIcons } from "@expo/vector-icons"
import { View } from "react-native"
import CultivosScreen from "../screens/CultivosScreen"
import TanquesScreen from "../screens/TanquesScreen"
import OpcionesScreen from "../screens/OpcionesScreen"
import UserHeader from "../components/UserHeader"
import { useAuth } from "../context/authContext"

const Tab = createBottomTabNavigator()

// Wrapper para incluir el header de usuario en cada pantalla
function ScreenWithUserHeader({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return (
    <View style={{ flex: 1 }}>
      <UserHeader userEmail={user?.correo} userName={`${user?.nombre} ${user?.apellido}`} />
      {children}
    </View>
  )
}

export default function MainTabNavigator() {
  const { hasActivity } = useAuth()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#2E7D32",
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#4DB6AC",
        tabBarInactiveTintColor: "white",
        headerStyle: {
          backgroundColor: "#2E7D32",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {hasActivity("Monitoreo Modulo Cultivos") && (
        <Tab.Screen
          name="Cultivos"
          options={{
            tabBarIcon: ({ color, size }) => <MaterialIcons name="eco" size={size} color={color} />,
          }}
        >
          {({ navigation }) => (
            <ScreenWithUserHeader>
              <CultivosScreen navigation={navigation} />
            </ScreenWithUserHeader>
          )}
        </Tab.Screen>
      )}

      {hasActivity("Monitoreo Modulo Tanques") && (
        <Tab.Screen
          name="Tanques/Peces"
          options={{
            tabBarIcon: ({ color, size }) => <MaterialIcons name="waves" size={size} color={color} />,
          }}
        >
          {({ navigation }) => (
            <ScreenWithUserHeader>
              <TanquesScreen navigation={navigation} />
            </ScreenWithUserHeader>
          )}
        </Tab.Screen>
      )}

      <Tab.Screen
        name="Opciones"
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="more-horiz" size={size} color={color} />,
        }}
      >
        {({ navigation }) => (
          <ScreenWithUserHeader>
            <OpcionesScreen navigation={navigation} />
          </ScreenWithUserHeader>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
