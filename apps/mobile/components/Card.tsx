import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111113',
    borderRadius: 24,
    padding: 18,
    borderColor: '#27272a',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
});