import type React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialIcons } from "@expo/vector-icons"
import { View } from "react-native"
import CultivosScreen from "../screens/CultivosScreen"
import TanquesScreen from "../screens/TanquesScreen"
import OpcionesScreen from "../screens/OpcionesScreen"
import UserHeader from "../components/UserHeader"

const Tab = createBottomTabNavigator()

// Wrapper para incluir el header de usuario en cada pantalla
function ScreenWithUserHeader({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <UserHeader userEmail={userEmail} />
      {children}
    </View>
  )
}

interface MainTabNavigatorProps {
  userEmail: string
  onLogout: () => void
}

export default function MainTabNavigator({ userEmail, onLogout }: MainTabNavigatorProps) {
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
      <Tab.Screen
        name="Cultivos"
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="eco" size={size} color={color} />,
        }}
      >
        {({ navigation }) => (
          <ScreenWithUserHeader userEmail={userEmail}>
            <CultivosScreen navigation={navigation} />
          </ScreenWithUserHeader>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Tanques/Peces"
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="waves" size={size} color={color} />,
        }}
      >
        {({ navigation }) => (
          <ScreenWithUserHeader userEmail={userEmail}>
            <TanquesScreen navigation={navigation} />
          </ScreenWithUserHeader>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Opciones"
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="more-horiz" size={size} color={color} />,
        }}
      >
        {({ navigation }) => (
          <ScreenWithUserHeader userEmail={userEmail}>
            <OpcionesScreen onLogout={onLogout} navigation={navigation} />
          </ScreenWithUserHeader>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
