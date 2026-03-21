import { Link } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>App Home</Text>
        <Text>Core app placeholder screen.</Text>

        <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>Today&apos;s recommended session</Text>
          <Text style={{ fontWeight: '600' }}>Difficult customer follow-up</Text>
          <Text style={{ color: '#4B5563' }}>
            Focus: closing confidence · bonus for objection handling · tied to filler words.
          </Text>
        </View>

        <Link href="/(app)/progress">View weekly review</Link>
        <Link href="/(auth)/sign-in">Sign out</Link>
      </View>
    </SafeAreaView>
  );
}
