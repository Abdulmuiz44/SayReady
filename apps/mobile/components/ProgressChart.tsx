import { StyleSheet, Text, View } from 'react-native';

export function ProgressChart({ points }: { points: number[] }) {
  const max = Math.max(...points, 100);
  return (
    <View style={styles.row}>
      {points.map((p, i) => (
        <View key={i} style={styles.column}>
          <View style={[styles.bar, { height: `${(p / max) * 100}%` }]} />
          <Text style={styles.label}>{i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 120 },
  column: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', backgroundColor: '#6d5efc', borderRadius: 8, minHeight: 4 },
  label: { color: '#aaa' },
});
