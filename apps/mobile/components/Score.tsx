import { StyleSheet, Text, View } from 'react-native';

export function ScoreBadge({ score }: { score: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>Score</Text>
      <Text style={styles.badgeText}>{score}</Text>
    </View>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const width = `${Math.max(0, Math.min(100, score))}%` as const;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    gap: 2,
  },
  badgeLabel: {
    color: '#52525b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeText: {
    color: '#09090b',
    fontWeight: '800',
    fontSize: 20,
  },
  track: {
    height: 10,
    backgroundColor: '#27272a',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#ffffff',
    height: '100%',
  },
});