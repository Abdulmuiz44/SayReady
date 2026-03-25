import { Text, View } from 'react-native';
import type { EvaluationFeedback } from '@/types';
import { Card } from './Card';

export function MistakeList({ mistakes }: { mistakes: EvaluationFeedback['mistakes'] }) {
  return (
    <View style={{ gap: 10 }}>
      {mistakes.map((m, idx) => (
        <Card key={`${m.text}-${idx}`}>
          <Text style={{ color: '#fda4af', fontWeight: '700' }}>{m.text}</Text>
          <Text style={{ color: '#86efac' }}>Better: {m.correction}</Text>
          <Text style={{ color: '#a1a1aa', lineHeight: 20 }}>{m.reason}</Text>
        </Card>
      ))}
    </View>
  );
}