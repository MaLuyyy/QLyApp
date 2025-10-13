// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message';

export default function RootLayout() {

  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="signin"/>
        <Stack.Screen name="drawer" />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      <Toast />
    </>
  );
}