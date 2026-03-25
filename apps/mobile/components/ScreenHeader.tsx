import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>SayReady</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    alignItems: 'center',
  },
  copy: {
    gap: 8,
    alignItems: 'center',
  },
  eyebrow: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: '#fafafa',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 460,
  },
  right: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});