import { Link } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>App Home</Text>
        <Text>Core app placeholder screen.</Text>
        <Link href="/(auth)/sign-in">Sign out</Link>
      </View>
    </SafeAreaView>
  );
}
