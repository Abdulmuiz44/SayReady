import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { PrimaryButton, SecondaryButton } from './Buttons';

export function AudioRecorder({ onRecorded }: { onRecorded: (uri: string) => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        if (active) setError('Microphone permission denied.');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  async function start() {
    setError(null);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start recording.');
    }
  }

  async function stop() {
    try {
      await recorder.stop();
      if (recorder.uri) {
        onRecorded(recorder.uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to stop recording.');
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#fff' }}>{error ?? (recorderState.isRecording ? 'Recording...' : recorder.uri ? 'Recorded.' : 'Ready to record.')}</Text>
      {!recorderState.isRecording ? <PrimaryButton title="Start recording" onPress={start} /> : <SecondaryButton title="Stop" onPress={stop} />}
    </View>
  );
}
