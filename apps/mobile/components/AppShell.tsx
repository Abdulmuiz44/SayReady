import { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { children: ReactNode; scroll?: boolean };

export function AppShell({ children, scroll = true }: Props) {
  const content = <View style={styles.content}>{children}</View>;

  return (
    <View style={styles.root}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090b',
    overflow: 'hidden',
  },
  safeArea: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    gap: 16,
    alignSelf: 'center',
  },
  blobTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    ...(Platform.OS === 'web' ? ({ filter: 'blur(24px)' } as any) : {}),
  },
  blobBottom: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    ...(Platform.OS === 'web' ? ({ filter: 'blur(28px)' } as any) : {}),
  },
});