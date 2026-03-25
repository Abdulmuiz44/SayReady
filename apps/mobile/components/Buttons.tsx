import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = { title: string; onPress: () => void; disabled?: boolean };

export function PrimaryButton({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.base, styles.primary, pressed && !disabled && styles.pressed, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.base, styles.secondary, pressed && !disabled && styles.pressed, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.base, styles.ghost, pressed && !disabled && styles.pressed, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: '#f8fafc',
    borderColor: '#f8fafc',
  },
  secondary: {
    backgroundColor: '#111827',
    borderColor: '#27272a',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: '#27272a',
  },
  primaryText: {
    color: '#09090b',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryText: {
    color: '#f4f4f5',
    fontWeight: '600',
    fontSize: 15,
  },
  ghostText: {
    color: '#d4d4d8',
    fontWeight: '600',
    fontSize: 15,
  },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
});