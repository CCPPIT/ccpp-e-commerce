import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="category/[id]" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="search" />
        <Stack.Screen name="visual-search" />
        <Stack.Screen name="voice-search" options={{ presentation: 'modal' }} />
        <Stack.Screen name="product/review/[id]" />
        <Stack.Screen name="live/index" />
        <Stack.Screen name="live/[id]" />
        <Stack.Screen name="feed/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="challenges/index" />
        <Stack.Screen name="spin-wheel" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
