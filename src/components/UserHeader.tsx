import { View, Text, StyleSheet, Image } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

interface UserHeaderProps {
  userEmail?: string
  userName?: string
}

export default function UserHeader({
  userEmail = "usuario@ucundinamarca.edu.co",
  userName = "Usuario Actual",
}: UserHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {/* Escudo de la Universidad */}
        <View style={styles.logoSection}>
          <Image
            source={{
              uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ESCUDO%20BLANCO-lq2HlvrBo4JQUpo2S0PMPOOi8KpuPa.png",
            }}
            style={styles.universityLogo}
            resizeMode="contain"
          />
        </View>

        {/* Información del Usuario */}
        <View style={styles.userSection}>
          <View style={styles.userIcon}>
            <MaterialIcons name="account-circle" size={32} color="#2E7D32" />
          </View>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#2E7D32",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoSection: {
    flex: 1,
  },
  universityLogo: {
    width: 50,
    height: 50,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
    justifyContent: "flex-end",
  },
  userIcon: {
    marginRight: 8,
  },
  userEmail: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
})
