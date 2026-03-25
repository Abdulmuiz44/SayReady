import { Text, View } from 'react-native';
import type { EvaluationFeedback } from '@/types';
import { Card } from './Card';
import { ScoreBadge, ScoreBar } from './Score';

export function SessionFeedbackCard({ feedback }: { feedback: EvaluationFeedback }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: '#fafafa', fontSize: 18, fontWeight: '800' }}>Session feedback</Text>
          <Text style={{ color: '#a1a1aa', lineHeight: 20 }}>A clean summary of what stood out and what to improve next.</Text>
        </View>
        <ScoreBadge score={feedback.score} />
      </View>
      <ScoreBar score={feedback.score} />
      <Text style={{ color: '#d4d4d8', lineHeight: 22 }}>{feedback.summary}</Text>
    </Card>
  );
}