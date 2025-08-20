import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from 'react-native-toast-message';
import InputField from '../components/InputField';
import { signIn } from '../lib/auth';
import { auth } from '../lib/firebaseConfig';

export default function SignInScreen(){
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricType, setBiometricType] = useState<null | 'finger' | 'face'>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadBiometricSetting = async () => {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      setBiometricEnabled(enabled === 'true');
    };
    loadBiometricSetting();
  }, []);

  useEffect(() => {
    const loadSavedEmail = async () => {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    };
    loadSavedEmail();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
  
      if (user && isLoggedIn === 'true') {
        if (pathname !== '/home') {
          router.replace('/drawer/home');
        }
      } else {
        await AsyncStorage.removeItem('isLoggedIn');
        await AsyncStorage.removeItem('userId');
  
        if (pathname !== '/signin') {
          router.replace('/signin');
        }
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [pathname]);

  const handleBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Thiết bị không hỗ trợ sinh trắc học');
        return;
      }
  
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Chưa cài Face ID hoặc vân tay');
        return;
      }
  
      // Lấy danh sách loại sinh trắc học hỗ trợ
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  
      // Chuyển thành tên hiển thị
      const options = supportedTypes.map((type) => {
        if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Vân tay';
        if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'Face ID';
        if (type === LocalAuthentication.AuthenticationType.IRIS) return 'Quét mống mắt';
        return 'Khác';
      });
  
      if (options.length > 1) {
        Alert.alert(
          'Chọn phương thức',
          'Bạn muốn đăng nhập bằng?',
          options.map((opt) => ({
            text: opt,
            onPress: () => authenticateWithBiometrics(opt),
          }))
        );
      } else {
        authenticateWithBiometrics(options[0]);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const authenticateWithBiometrics = async (method: string) => {
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: `Xác thực bằng ${method}`,
      fallbackLabel: 'Nhập mật khẩu',
    });
  
    if (auth.success) {
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      if (!savedPassword) {
        Alert.alert('Không tìm thấy mật khẩu, vui lòng đăng nhập thủ công');
        return;
      }
      handleSignIn(savedPassword);
    }
  };

  useEffect(() => {
    const checkBiometricType = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return; 
        // Ss
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        if (!savedEmail || savedEmail !== email) {
          setBiometricType(null);
          return;
        }

        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('finger');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        }
      } catch (err) {
        console.log('Lỗi:', err);
      }
    };

    checkBiometricType();
  }, [email]);

  const handleSignIn = async (pass?: string) => {
      try {
        const userCredential = await signIn(email, pass || password);
        const user = userCredential;
    
        // Lấy token để check claim
        const tokenResult = await user.getIdTokenResult(true);
        const isAdmin = tokenResult.claims.admin === true;
    
        if (!isAdmin) {
          // ❌ Nếu không phải admin -> cấm đăng nhập
          Alert.alert("Lỗi", "Tài khoản này không có quyền admin");
          await AsyncStorage.removeItem("isLoggedIn");
          await AsyncStorage.removeItem("userId");
          await AsyncStorage.removeItem("role");
          return;
        }
    
        // ✅ Nếu là admin
        console.log("👉 Đây là admin, cho phép đăng nhập");
        await AsyncStorage.setItem("isLoggedIn", "true");
        await AsyncStorage.setItem("userId", user.uid);
        await AsyncStorage.setItem("role", "admin");
    
        Toast.show({
          type: "success",
          text1: "Đăng nhập thành công (Admin)",
          position: "bottom",
        });
    
        router.replace("/drawer/home"); // 👉 vào trang quản lý
      } catch (error: any) {
        Alert.alert("Lỗi", error.message);
      }
    };

      


    return (
        <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Đăng Nhập</Text>

        <InputField icon="mail" placeholder="Email" value={email} onChangeText={setEmail} />
        <InputField icon="lock" placeholder="Mật Khẩu" secureTextEntry value={password} onChangeText={setPassword} />
        <View style={styles.Row}>
            <TouchableOpacity onPress={() => router.replace('/' as any)}>
            <Text style={styles.forgot}>Quên mật khẩu?</Text>
            </TouchableOpacity>
            {biometricEnabled && biometricType === 'finger' && (
            <TouchableOpacity onPress={handleBiometricLogin}>
                <Ionicons name="finger-print-outline" size={28} />
            </TouchableOpacity>
            )}

            {biometricEnabled && biometricType === 'face' && (
            <TouchableOpacity onPress={handleBiometricLogin}>
                <Ionicons name="scan-outline" size={28} /> 
            </TouchableOpacity>
            )}
            
        </View>
        <TouchableOpacity style={styles.button} onPress={() => {
            AsyncStorage.setItem('savedPassword', password);
            handleSignIn();
            }}>
            <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
    color: '#593C1F',
  },
  forgot: {
    textAlign: 'left',
    fontSize:14,
    color: 'blue',
  },
  button: {
    backgroundColor: '#FDB813',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FDB813',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  Row:{
    justifyContent:'space-between',
    flexDirection:'row',
    paddingHorizontal:17,
    marginTop:17,
  }
})