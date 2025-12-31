import { Stack, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EpisodeLayout() {
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
          title: 'Episode Topics',
          headerLeft: () => <DrawerToggle />
        }} 
      />
      <Stack.Screen name="vocabulary" options={{ title: 'Vocabulary' }} />
      <Stack.Screen name="transcript" options={{ title: 'Transcript' }} />
      <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
    </Stack>
  );
}
