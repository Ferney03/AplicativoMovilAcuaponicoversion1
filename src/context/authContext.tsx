"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Usuario, ListaActividades } from "../config/authApi"

interface AuthContextType {
  user: Usuario | null
  userActivities: ListaActividades[]
  isLoggedIn: boolean
  login: (user: Usuario, activities: ListaActividades[]) => Promise<void>
  logout: () => Promise<void>
  hasActivity: (activityName: string) => boolean
  updateUser: (user: Usuario) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [userActivities, setUserActivities] = useState<ListaActividades[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Cargar datos del almacenamiento al iniciar
  useEffect(() => {
    loadStoredAuth()
  }, [])

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user")
      const storedActivities = await AsyncStorage.getItem("userActivities")

      if (storedUser && storedActivities) {
        setUser(JSON.parse(storedUser))
        setUserActivities(JSON.parse(storedActivities))
        setIsLoggedIn(true)
        console.log("✅ Sesión restaurada desde almacenamiento")
      }
    } catch (error) {
      console.error("Error loading stored auth:", error)
    }
  }

  const login = async (user: Usuario, activities: ListaActividades[]) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user))
      await AsyncStorage.setItem("userActivities", JSON.stringify(activities))

      setUser(user)
      setUserActivities(activities)
      setIsLoggedIn(true)

      console.log(`✅ Login exitoso: ${user.nombre} ${user.apellido}`)
      console.log(`🎯 Actividades guardadas: ${activities.length}`)
    } catch (error) {
      console.error("Error storing auth:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user")
      await AsyncStorage.removeItem("userActivities")

      setUser(null)
      setUserActivities([])
      setIsLoggedIn(false)

      console.log("🚪 Sesión cerrada exitosamente")
    } catch (error) {
      console.error("Error clearing auth:", error)
    }
  }

  const updateUser = async (updatedUser: Usuario) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      console.log("✅ Usuario actualizado")
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  const hasActivity = (activityName: string): boolean => {
    const hasAccess = userActivities.some((activity) => activity.nombreActividad === activityName)
    console.log(`🔍 Verificando acceso a "${activityName}": ${hasAccess}`)
    return hasAccess
  }

  const value: AuthContextType = {
    user,
    userActivities,
    isLoggedIn,
    login,
    logout,
    hasActivity,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
