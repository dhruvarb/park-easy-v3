import "../global.css";
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inUserGroup = segments[0] === '(user)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!user) {
      // If not logged in and not in auth group, redirect to landing
      // Actually landing is app/index.tsx which is public.
      // Protected routes are (user) and (admin).
      if (inUserGroup || inAdminGroup) {
        router.replace('/auth');
      }
    } else {
      // If logged in
      if (segments[0] === 'auth' || segments[0] === undefined) {
        if (user.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(user)');
        }
      }
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="parking/[id]" options={{ presentation: 'card', headerShown: true, title: 'Lot Details', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }} />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
