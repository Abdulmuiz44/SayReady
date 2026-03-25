import { AppShell, PaywallCard, ScreenHeader } from '@/components';

export default function PaywallScreen() {
  return (
    <AppShell>
      <ScreenHeader title="Upgrade" subtitle="Full access, cleaner flow, and stronger practice features." />
      <PaywallCard />
    </AppShell>
  );
}