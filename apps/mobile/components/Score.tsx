import { StyleSheet, Text, View } from 'react-native';

export function ScoreBadge({ score }: { score: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{score}</Text>
    </View>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const width = `${Math.max(0, Math.min(100, score))}%`;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#6d5efc', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  track: { height: 10, backgroundColor: '#2c2c3f', borderRadius: 999, overflow: 'hidden' },
  fill: { backgroundColor: '#7cd992', height: '100%' },
});
