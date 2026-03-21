import { Link } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Onboarding</Text>
        <Text>Welcome flow placeholder screen.</Text>
        <Link href="/(auth)/sign-in">Back to auth</Link>
      </View>
    </SafeAreaView>
  );
}
