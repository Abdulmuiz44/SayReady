import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ActionStatus = 'idle' | 'loading' | 'error';

type Props = {
  isOffline: boolean;
  isLocked: boolean;
  uploadStatus: ActionStatus;
  evaluationStatus: ActionStatus;
  guidanceMessage: string | null;
  pendingCount: number;
  onUploadPress: () => void;
  onEvaluatePress: () => void;
  onRetryPendingPress: () => void;
};

export function UploadActionPanel({
  isOffline,
  isLocked,
  uploadStatus,
  evaluationStatus,
  guidanceMessage,
  pendingCount,
  onUploadPress,
  onEvaluatePress,
  onRetryPendingPress,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Session</Text>
      {guidanceMessage ? <Text style={styles.guidance}>{guidanceMessage}</Text> : null}

      {isOffline ? (
        <Text accessibilityRole="alert" style={styles.offlineBanner}>
          You are offline. Uploads are queued and evaluations are unavailable.
        </Text>
      ) : null}

      {isLocked ? <Text style={styles.lockedMessage}>Action in progress. Please wait.</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Upload recording"
        onPress={onUploadPress}
        disabled={isLocked}
        style={[styles.button, isLocked && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {uploadStatus === 'loading' ? 'Uploading…' : uploadStatus === 'error' ? 'Retry Upload' : 'Upload Recording'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Evaluate recording"
        onPress={onEvaluatePress}
        disabled={isLocked || isOffline}
        style={[styles.button, (isLocked || isOffline) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {evaluationStatus === 'loading'
            ? 'Evaluating…'
            : evaluationStatus === 'error'
              ? 'Retry Evaluation'
              : 'Evaluate Recording'}
        </Text>
      </Pressable>

      {pendingCount > 0 ? (
        <View style={styles.pendingWrap}>
          <Text style={styles.pendingText}>{pendingCount} pending upload{pendingCount > 1 ? 's' : ''}.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry pending upload"
            onPress={onRetryPendingPress}
            disabled={isLocked || isOffline}
            style={[styles.secondaryButton, (isLocked || isOffline) && styles.buttonDisabled]}
          >
            <Text style={styles.secondaryButtonText}>Retry pending upload</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  guidance: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 22,
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    color: '#7c2d12',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  lockedMessage: {
    color: '#92400e',
    fontSize: 14,
  },
  button: {
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingWrap: {
    marginTop: 8,
    gap: 8,
  },
  pendingText: {
    fontSize: 15,
    color: '#111827',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4b5563',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
