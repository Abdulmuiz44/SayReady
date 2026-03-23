import { AppShell, PaywallCard, ScreenHeader } from '@/components';

export default function PaywallScreen() {
  return (
    <AppShell>
      <ScreenHeader title="Upgrade" subtitle="Get full access" />
      <PaywallCard />
    </AppShell>
  );
}
