//app/drawer/_layout.tsx
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { View, Text, Image, StyleSheet } from "react-native";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} style={{ flex: 1 }}>
            <View style={styles.header}>
              <Image source={require("../../assets/images/logo_app.png")} style={styles.avatar} />
              <Text style={styles.username}>Xin chào!</Text>
            </View>
              <DrawerItemList {...props} />
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
      <Drawer.Screen name="user" options={{ title: "Người dùng"}} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  username: { fontSize: 18, fontWeight: "bold", color: "#fff" },

});
