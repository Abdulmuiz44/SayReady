import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

type Props = { children: ReactNode; scroll?: boolean };

export function AppShell({ children, scroll = true }: Props) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16 },
  content: { flex: 1, gap: 12 },
});
