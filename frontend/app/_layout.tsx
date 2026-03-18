import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Plantae', headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="add" options={{ title: 'Add Plant', presentation: 'modal', headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="edit/[id]" options={{ title: 'Edit Plant', presentation: 'modal', headerStyle: { backgroundColor: '#242424' }, headerTintColor: '#fff' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
