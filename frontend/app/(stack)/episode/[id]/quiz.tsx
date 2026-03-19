import { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEpisode } from '@/contexts/episode-context';

export default function QuizScreen() {
  const episode = useEpisode();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

  if (!episode) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  const questions = episode.quizContent;

  if (questions.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>クイズデータがありません</ThemedText>
      </ThemedView>
    );
  }

  if (finished) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="title" style={styles.scoreTitle}>結果</ThemedText>
        <ThemedText type="subtitle" style={styles.scoreText}>
          {score} / {questions.length}
        </ThemedText>
        <TouchableOpacity
          onPress={() => {
            setCurrentIndex(0);
            setSelectedIndex(null);
            setScore(0);
            setFinished(false);
          }}
          style={[styles.retryButton, { borderColor: tintColor }]}
        >
          <ThemedText style={{ color: tintColor }}>もう一度</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const question = questions[currentIndex];

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return; // 既に回答済み
    setSelectedIndex(index);
    if (index === question.answerIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.progress}>
          問 {currentIndex + 1} / {questions.length}
        </ThemedText>

        <ThemedText type="subtitle" style={styles.question}>
          {question.question}
        </ThemedText>

        <View style={styles.options}>
          {question.options.map((option, index) => (
            <QuizOption
              key={index}
              label={option.label}
              index={index}
              selectedIndex={selectedIndex}
              correctIndex={question.answerIndex}
              onPress={() => handleSelect(index)}
            />
          ))}
        </View>

        {selectedIndex !== null && (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: tintColor }]}
          >
            <ThemedText style={styles.nextButtonText}>
              {currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function QuizOption({
  label,
  index,
  selectedIndex,
  correctIndex,
  onPress,
}: {
  label: string;
  index: number;
  selectedIndex: number | null;
  correctIndex: number;
  onPress: () => void;
}) {
  const isSelected = selectedIndex === index;
  const isCorrect = index === correctIndex;
  const hasAnswered = selectedIndex !== null;

  let bgColor = 'transparent';
  let borderColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'icon');

  if (hasAnswered) {
    if (isCorrect) {
      bgColor = '#d4edda';
      borderColor = '#28a745';
    } else if (isSelected && !isCorrect) {
      bgColor = '#f8d7da';
      borderColor = '#dc3545';
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={hasAnswered}
      style={[styles.option, { backgroundColor: bgColor, borderColor }]}
    >
      <ThemedText>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  progress: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 16,
  },
  question: {
    marginBottom: 24,
    lineHeight: 28,
  },
  options: {
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
  nextButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreTitle: {
    marginBottom: 12,
  },
  scoreText: {
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
