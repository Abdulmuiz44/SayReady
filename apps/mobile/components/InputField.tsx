import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export type InputFieldProps = ComponentPropsWithoutRef<typeof TextInput> & {
  label: string;
  hint?: string;
};

export const InputField = forwardRef<TextInput, InputFieldProps>(function InputField({ label, hint, style, ...props }, ref) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput ref={ref} placeholderTextColor="#71717a" style={[styles.input, style]} {...props} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#09090b',
    color: '#fafafa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272a',
    fontSize: 15,
  },
  hint: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
});