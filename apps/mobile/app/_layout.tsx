import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { TelemetryBoundary } from '@/components';
import { trackEvent, trackScreenView } from '@/services/telemetry';

function TelemetryObserver() {
  const pathname = usePathname();

  useEffect(() => {
    void trackEvent({ eventName: 'app_opened' });
  }, []);

  useEffect(() => {
    if (!pathname) return;
    void trackScreenView(pathname);
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  return (
    <TelemetryBoundary>
      <AuthProvider>
        <TelemetryObserver />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </TelemetryBoundary>
  );
}
