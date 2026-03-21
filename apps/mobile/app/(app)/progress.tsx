import { SafeAreaView, Text, View } from 'react-native';

export default function ProgressScreen() {
  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Progress</Text>

        <View style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>Weekly review</Text>
          <Text>Minutes practiced: 86</Text>
          <Text>Top repeated mistakes: filler_words, weak_opening, rushed_close</Text>
          <Text>Best category: discovery (88.4)</Text>
          <Text>Weakest category: objection_handling (64.2)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
