import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './Buttons';

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.screen}>
    <View style={styles.state}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  </View>
);

export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => (
  <View style={styles.screen}>
    <View style={styles.state}>
      <ActivityIndicator color="#f8fafc" />
      <Text style={styles.desc}>{message}</Text>
    </View>
  </View>
);

export const ErrorState = ({ message, retry }: { message: string; retry?: () => void }) => (
  <View style={styles.screen}>
    <View style={styles.state}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.desc}>{message}</Text>
      {retry ? <PrimaryButton title="Retry" onPress={retry} /> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  state: {
    width: '100%',
    maxWidth: 560,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272a',
    borderRadius: 24,
    padding: 22,
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#111113',
  },
  title: {
    color: '#fafafa',
    fontWeight: '800',
    fontSize: 17,
    textAlign: 'center',
  },
  desc: {
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 21,
  },
});