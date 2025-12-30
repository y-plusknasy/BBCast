import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';

type Program = {
  id: string;
  title: string;
};

export default function CustomDrawerContent(props: any) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'programs'));
        const programsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Program[];
        setPrograms(programsData);
      } catch (error) {
        console.error("Error fetching programs for drawer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Programs</ThemedText>
      </View>
      
      {loading ? (
        <ActivityIndicator size="small" style={{ margin: 20 }} />
      ) : (
        programs.map((program) => (
          <DrawerItem
            key={program.id}
            label={program.title}
            onPress={() => {
              router.push(`/program/${program.id}`);
              props.navigation.closeDrawer();
            }}
            icon={({ color, size }) => (
              <Ionicons name="radio-outline" size={size} color={color} />
            )}
          />
        ))
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 8,
  },
});
