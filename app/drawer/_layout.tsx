//app/drawer/_layout.tsx
import { auth } from "@/lib/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { Switch } from "react-native";

export default function DrawerLayout() {

  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
    
  useEffect(() => {
    const loadSetting = async () => {
      const saved = await AsyncStorage.getItem('biometricEnabled');
      setBiometricEnabled(saved === 'true');
    };
    loadSetting();
  }, []);

  const toggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    await AsyncStorage.setItem('biometricEnabled', value.toString());
  };




  const handleLogout = async () => {
    try {
      await signOut(auth); // đăng xuất khỏi Firebase
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userId');
      Toast.show({
        type: 'success',
        text1: 'Đăng xuất thành công',
        position: 'bottom',
        visibilityTime: 3000,
      });
      router.replace('/signin');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };


  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} style={{ flex: 1 }}>
            <View style={styles.header}>
              <Image source={require("../../assets/images/logo_app.png")} style={styles.avatar} />
              <Text style={styles.username}>Xin chào!</Text>
            </View>

            <DrawerItemList {...props} />


            <View style={styles.biometricContainer}>
              <Text style={styles.biometricText}>Sinh trắc học</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                thumbColor={biometricEnabled ? "#fff" : "#f4f3f4"}
                trackColor={{ false: "#767577", true: "#8A2F2C" }}
              />
            </View>


            <View style={styles.logoutContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
        </DrawerContentScrollView>

      )}
      screenOptions={{
        drawerStyle: { backgroundColor: "#FFB200", width: 250 },
        headerStyle: { backgroundColor: "#8A2F2C" },
        headerTintColor: "#fff",
        drawerLabelStyle: { color: "#fff", fontSize: 18 },
      }}
    >
      <Drawer.Screen name="home" options={{ title: "Trang chủ" }} />
      <Drawer.Screen name="product" options={{ title: "Sản phẩm" }} />
      <Drawer.Screen name="order" options={{ title: "Đơn hàng" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  username: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  logoutContainer: {
    marginTop: "auto", 
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  biometricContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  biometricText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  
});
