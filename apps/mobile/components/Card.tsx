import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141420', borderRadius: 14, padding: 14, borderColor: '#24243a', borderWidth: 1, gap: 8 },
});
