import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// TODO: Fetch from Firestore 'programs' collection
const PROGRAMS = [
  { id: '6-minute-english', title: '6 Minute English', description: 'Learn and practise useful English language for everyday situations' },
  { id: 'news-review', title: 'News Review', description: 'The news, explained' },
  { id: 'the-english-we-speak', title: 'The English We Speak', description: 'The latest English words and phrases' },
];

export default function ProgramListScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof PROGRAMS[0] }) => (
    <TouchableOpacity onPress={() => router.push(`/program/${item.id}`)}>
      <ThemedView style={styles.itemContainer}>
        <ThemedText type="subtitle">{item.title}</ThemedText>
        <ThemedText>{item.description}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={PROGRAMS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
});
