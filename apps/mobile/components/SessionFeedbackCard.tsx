import { Text, View } from 'react-native';
import type { EvaluationFeedback } from '@/types';
import { Card } from './Card';
import { ScoreBadge, ScoreBar } from './Score';

export function SessionFeedbackCard({ feedback }: { feedback: EvaluationFeedback }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Session feedback</Text>
        <ScoreBadge score={feedback.score} />
      </View>
      <Text style={{ color: '#ddd' }}>{feedback.summary}</Text>
      <ScoreBar score={feedback.score} />
    </Card>
  );
}
