import { Text, View } from 'react-native';
import type { EvaluationFeedback } from '@/types';
import { Card } from './Card';

export function MistakeList({ mistakes }: { mistakes: EvaluationFeedback['mistakes'] }) {
  return (
    <View style={{ gap: 10 }}>
      {mistakes.map((m, idx) => (
        <Card key={`${m.text}-${idx}`}>
          <Text style={{ color: '#ffb3b3' }}>Mistake: {m.text}</Text>
          <Text style={{ color: '#b6f0c7' }}>Better: {m.correction}</Text>
          <Text style={{ color: '#c9c9d9' }}>{m.reason}</Text>
        </Card>
      ))}
    </View>
  );
}
