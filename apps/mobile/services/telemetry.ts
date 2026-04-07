import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

type EventSeverity = 'info' | 'warning' | 'error';

type TrackEventParams = {
  eventName: string;
  screen?: string | null;
  severity?: EventSeverity;
  metadata?: Record<string, unknown>;
};

const buildMetadata = (metadata?: Record<string, unknown>) => ({
  ...metadata,
  platform: Platform.OS,
  appVersion: Constants.expoConfig?.version ?? null,
});

export async function trackEvent({ eventName, screen = null, severity = 'info', metadata }: TrackEventParams) {
  try {
    const { error } = await supabase.rpc('log_app_event', {
      event_name: eventName,
      screen,
      severity,
      metadata: buildMetadata(metadata),
    });

    if (error) {
      if (__DEV__) console.debug('Telemetry event failed', eventName, error.message);
      return;
    }
  } catch (error) {
    if (__DEV__) console.debug('Telemetry event failed', eventName, error);
  }
}

export async function trackError(eventName: string, error: unknown, metadata?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  await trackEvent({
    eventName,
    severity: 'error',
    metadata: { ...metadata, message },
  });
}

export async function trackScreenView(screen: string, metadata?: Record<string, unknown>) {
  await trackEvent({
    eventName: 'screen_view',
    screen,
    metadata,
  });
}
