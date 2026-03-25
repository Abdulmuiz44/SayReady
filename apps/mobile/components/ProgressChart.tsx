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
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: '100%',
    minHeight: 8,
    borderRadius: 999,
    backgroundColor: '#fafafa',
  },
  label: {
    color: '#a1a1aa',
    fontSize: 12,
  },
});