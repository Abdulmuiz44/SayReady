import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = { title: string; onPress: () => void; disabled?: boolean };

export function PrimaryButton({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable style={[styles.base, styles.primary, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable style={[styles.base, styles.secondary, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: '#6d5efc' },
  secondary: { backgroundColor: '#1b1b28', borderWidth: 1, borderColor: '#2b2b3f' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryText: { color: '#d3d3de', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
