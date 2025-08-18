import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import { Image, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
          <View style={styles.header}>
            <Image
              source={require('../assets/images/logo_app.png')}
              style={styles.avatar}
            />
            <Text style={styles.username}>Xin chào!</Text>
          </View>

          <DrawerItemList
            {...props}
            state={{
              ...props.state,
              routes: props.state.routes.filter(
                (route) => route.name !== "+not-found" && route.name !== "index" 
              ),
            }}
          />
        </DrawerContentScrollView>
      )}
      screenOptions={{
        drawerStyle: { backgroundColor: "#FFA500", width: 250 },
        headerStyle: { backgroundColor: "#2c3e50" },
        headerTintColor: "#fff",
        drawerLabelStyle: { color: "#fff", fontSize: 18 },
      }}
    >
      {/* <Drawer.Screen name='+not-found' options={{ drawerItemStyle: {display: 'none'}}}/> */}
      <Drawer.Screen name="home" options={{ title: "Trang chủ" }} />
      <Drawer.Screen name="product" options={{ title: "Sản phẩm" }} />
      <Drawer.Screen name="order" options={{ title: "Đơn hàng" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

