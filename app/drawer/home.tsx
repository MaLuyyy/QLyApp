//app/drawer/home.tsx
import  React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "expo-router";


export default function HomeScreen() {

  const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      console.log(" userId:", id);
    };
    getUser();
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
  
      if (user || isLoggedIn === 'true') {
        
      } else {
        router.replace('/signin');
      }
    });
  
    return () => unsubscribe();
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
