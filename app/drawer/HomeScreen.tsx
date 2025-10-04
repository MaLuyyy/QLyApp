//app/drawer/home.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";


export default function HomeScreen() {

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      console.log(" userId:", id);
    };
    getUser();
  }, []);
    

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Xin chào, đây là Trang chủ!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
});
