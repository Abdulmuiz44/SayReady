import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './Buttons';

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.state}><Text style={styles.title}>{title}</Text><Text style={styles.desc}>{description}</Text></View>
);

export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => (
  <View style={styles.state}><ActivityIndicator /><Text style={styles.desc}>{message}</Text></View>
);

export const ErrorState = ({ message, retry }: { message: string; retry?: () => void }) => (
  <View style={styles.state}><Text style={styles.title}>Something went wrong</Text><Text style={styles.desc}>{message}</Text>{retry ? <PrimaryButton title="Retry" onPress={retry} /> : null}</View>
);

const styles = StyleSheet.create({
  state: { borderWidth: 1, borderColor: '#2f2f45', borderRadius: 12, padding: 18, gap: 10, alignItems: 'center' },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  desc: { color: '#b8b8c9', textAlign: 'center' },
});
