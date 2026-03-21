import { Link } from 'expo-router';
import * as Network from 'expo-network';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { UploadActionPanel } from '@/src/components/UploadActionPanel';
import {
  getPendingUploads,
  queueFailedUploadIntent,
  removePendingUpload,
  type PendingUploadIntent,
} from '@/src/lib/uploadQueue';

const MIN_DURATION_SECONDS = 5;

async function fakeServerCall(shouldFail = false) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (shouldFail) {
    throw new Error('Server unavailable');
  }
}

export default function HomeScreen() {
  const [isOffline, setIsOffline] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [durationInput, setDurationInput] = useState('0');
  const [pendingUploads, setPendingUploads] = useState<PendingUploadIntent[]>([]);

  const isLocked = uploadStatus === 'loading' || evaluationStatus === 'loading';

  const guidanceMessage = useMemo(() => {
    const duration = Number(durationInput);
    if (!Number.isFinite(duration) || durationInput.trim() === '' || duration <= 0) {
      return 'No recording detected. Record your response before uploading or evaluating.';
    }

    if (duration < MIN_DURATION_SECONDS) {
      return `Recording is too short (${duration}s). Please record at least ${MIN_DURATION_SECONDS} seconds so feedback is meaningful.`;
    }

    return null;
  }, [durationInput]);

  const loadPendingQueue = useCallback(async () => {
    const queue = await getPendingUploads();
    setPendingUploads(queue);
  }, []);

  useEffect(() => {
    void loadPendingQueue();

    let mounted = true;
    void Network.getNetworkStateAsync().then((state) => {
      if (!mounted) {
        return;
      }
      setIsOffline(!state.isConnected || !state.isInternetReachable);
    });

    const sub = Network.addNetworkStateListener((state) => {
      setIsOffline(!state.isConnected || !state.isInternetReachable);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [loadPendingQueue]);

  const canSubmit = guidanceMessage === null;

  const onUpload = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    const durationSeconds = Number(durationInput);

    setUploadStatus('loading');

    try {
      if (isOffline) {
        throw new Error('offline');
      }
      await fakeServerCall();
      setUploadStatus('idle');
    } catch {
      await queueFailedUploadIntent({ durationSeconds, reason: isOffline ? 'offline' : 'server_error' });
      await loadPendingQueue();
      setUploadStatus('error');
    }
  }, [canSubmit, durationInput, isOffline, loadPendingQueue]);

  const onEvaluate = useCallback(async () => {
    if (!canSubmit || isOffline) {
      return;
    }

    setEvaluationStatus('loading');

    try {
      await fakeServerCall();
      setEvaluationStatus('idle');
    } catch {
      setEvaluationStatus('error');
    }
  }, [canSubmit, isOffline]);

  const onRetryPendingUpload = useCallback(async () => {
    if (isOffline || pendingUploads.length === 0) {
      return;
    }

    const first = pendingUploads[0];
    setUploadStatus('loading');

    try {
      await fakeServerCall();
      await removePendingUpload(first.id);
      await loadPendingQueue();
      setUploadStatus('idle');
    } catch {
      setUploadStatus('error');
    }
  }, [isOffline, loadPendingQueue, pendingUploads]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>App Home</Text>
        <Text style={styles.body}>Set your recording length and test upload/evaluation states.</Text>

        <Text style={styles.label}>Recording length (seconds)</Text>
        <TextInput
          accessibilityLabel="Recording duration in seconds"
          keyboardType="numeric"
          value={durationInput}
          onChangeText={setDurationInput}
          style={styles.input}
        />

        <UploadActionPanel
          isOffline={isOffline}
          isLocked={isLocked}
          uploadStatus={uploadStatus}
          evaluationStatus={evaluationStatus}
          guidanceMessage={guidanceMessage}
          pendingCount={pendingUploads.length}
          onUploadPress={onUpload}
          onEvaluatePress={onEvaluate}
          onRetryPendingPress={onRetryPendingUpload}
        />

        <Link href="/(auth)/sign-in" style={styles.signOutLink}>
          Sign out
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    color: '#1f2937',
    fontSize: 16,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  signOutLink: {
    marginTop: 8,
    fontSize: 16,
    color: '#1d4ed8',
  },
});
