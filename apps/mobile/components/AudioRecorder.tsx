import { Audio } from 'expo-av';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from './Buttons';

export function AudioRecorder({ onRecorded }: { onRecorded: (uri: string) => void }) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  async function start() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  }

  async function stop() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const localUri = recording.getURI();
    if (localUri) {
      setUri(localUri);
      onRecorded(localUri);
    }
    setRecording(null);
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#fff' }}>{recording ? 'Recording...' : uri ? 'Recorded.' : 'Ready to record.'}</Text>
      {!recording ? <PrimaryButton title="Start recording" onPress={start} /> : <SecondaryButton title="Stop" onPress={stop} />}
    </View>
  );
}
