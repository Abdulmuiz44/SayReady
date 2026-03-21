import { fireEvent, render } from '@testing-library/react-native';

import { UploadActionPanel } from '../UploadActionPanel';

describe('UploadActionPanel states', () => {
  it('renders loading labels', () => {
    const screen = render(
      <UploadActionPanel
        isOffline={false}
        isLocked={false}
        uploadStatus="loading"
        evaluationStatus="loading"
        guidanceMessage={null}
        pendingCount={0}
        onUploadPress={jest.fn()}
        onEvaluatePress={jest.fn()}
        onRetryPendingPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Uploading…')).toBeTruthy();
    expect(screen.getByText('Evaluating…')).toBeTruthy();
  });

  it('renders error labels', () => {
    const screen = render(
      <UploadActionPanel
        isOffline={false}
        isLocked={false}
        uploadStatus="error"
        evaluationStatus="error"
        guidanceMessage={null}
        pendingCount={0}
        onUploadPress={jest.fn()}
        onEvaluatePress={jest.fn()}
        onRetryPendingPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Retry Upload')).toBeTruthy();
    expect(screen.getByText('Retry Evaluation')).toBeTruthy();
  });

  it('renders offline banner and disables evaluation action', () => {
    const onEvaluatePress = jest.fn();
    const screen = render(
      <UploadActionPanel
        isOffline
        isLocked={false}
        uploadStatus="idle"
        evaluationStatus="idle"
        guidanceMessage={null}
        pendingCount={1}
        onUploadPress={jest.fn()}
        onEvaluatePress={onEvaluatePress}
        onRetryPendingPress={jest.fn()}
      />,
    );

    expect(screen.getByText(/You are offline/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Evaluate recording'));
    expect(onEvaluatePress).not.toHaveBeenCalled();
  });

  it('shows locked message and disables action buttons', () => {
    const onUploadPress = jest.fn();
    const screen = render(
      <UploadActionPanel
        isOffline={false}
        isLocked
        uploadStatus="idle"
        evaluationStatus="idle"
        guidanceMessage={null}
        pendingCount={1}
        onUploadPress={onUploadPress}
        onEvaluatePress={jest.fn()}
        onRetryPendingPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Action in progress. Please wait.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Upload recording'));
    expect(onUploadPress).not.toHaveBeenCalled();
  });
});
