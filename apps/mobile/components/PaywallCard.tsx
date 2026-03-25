import { Text, View } from 'react-native';
import { Card } from './Card';
import { PrimaryButton } from './Buttons';

export function PaywallCard() {
  return (
    <Card>
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Text style={{ color: '#fafafa', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>Unlock Pro scenarios</Text>
        <Text style={{ color: '#a1a1aa', textAlign: 'center', lineHeight: 21 }}>Get advanced roleplays, deeper analysis, and unlimited retries with a cleaner practice flow.</Text>
      </View>
      <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#27272a', padding: 16, backgroundColor: '#09090b' }}>
        <Text style={{ color: '#fafafa', fontWeight: '700' }}>Designed for focused practice</Text>
        <Text style={{ color: '#a1a1aa', marginTop: 4, lineHeight: 20 }}>Centered layout, stronger contrast, and a simpler path to the next session.</Text>
      </View>
      <PrimaryButton title="Upgrade to Pro" onPress={() => {}} />
    </Card>
  );
}