import { Text } from 'react-native';
import { Card } from './Card';
import { PrimaryButton } from './Buttons';

export function PaywallCard() {
  return (
    <Card>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Unlock Pro scenarios</Text>
      <Text style={{ color: '#c2c2d4' }}>Get advanced roleplays, deep analysis, and unlimited retries.</Text>
      <PrimaryButton title="Upgrade to Pro" onPress={() => {}} />
    </Card>
  );
}
