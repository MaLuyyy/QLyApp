// app/index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Chuyển hướng về trang home khi app khởi động
    router.replace('/home');
  }, []);

  return null; // Không render gì vì sẽ redirect ngay
}