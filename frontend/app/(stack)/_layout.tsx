import { Stack, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function StackLayout() {
  const navigation = useNavigation();
  const iconColor = useThemeColor({}, 'text');

  const DrawerToggle = () => (
    <TouchableOpacity 
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={{ marginLeft: 8, marginRight: 8 }}
    >
      <Ionicons name="menu" size={24} color={iconColor} />
    </TouchableOpacity>
  );

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Programs',
          headerLeft: () => <DrawerToggle />
        }} 
      />
      <Stack.Screen 
        name="program/[id]" 
        options={{ 
          title: 'Episodes',
          headerLeft: () => <DrawerToggle />
        }} 
      />
      <Stack.Screen name="episode/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
