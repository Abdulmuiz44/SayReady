import { Link } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

export default function SignInScreen() {
  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Welcome back</Text>
        <Text>Sign in placeholder screen.</Text>
        <Link href="/(onboarding)/welcome">Go to onboarding</Link>
        <Link href="/(app)/home">Enter app</Link>
      </View>
    </SafeAreaView>
  );
}
