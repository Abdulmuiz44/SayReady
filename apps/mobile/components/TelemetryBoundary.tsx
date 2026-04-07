import { Component, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from './Buttons';
import { trackError } from '@/services/telemetry';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class TelemetryBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void trackError('ui_render_error', error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <View style={{ gap: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fafafa', fontWeight: '800', fontSize: 18, textAlign: 'center' }}>Something went wrong</Text>
            <Text style={{ color: '#a1a1aa', textAlign: 'center' }}>{this.state.error.message}</Text>
            <PrimaryButton title="Reload app" onPress={() => globalThis.location?.reload?.()} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
