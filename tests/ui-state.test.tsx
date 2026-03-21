import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PremiumLessonGate } from '../src/components/PremiumLessonGate';

describe('PremiumLessonGate', () => {
  it('shows premium content when subscribed', () => {
    render(<PremiumLessonGate subscriptionActive onShowPaywall={() => {}} />);
    expect(screen.getByTestId('premium-content')).toBeTruthy();
  });

  it('shows paywall action when not subscribed', () => {
    const onShowPaywall = vi.fn();
    render(<PremiumLessonGate subscriptionActive={false} onShowPaywall={onShowPaywall} />);

    fireEvent.click(screen.getByTestId('show-paywall'));
    expect(onShowPaywall).toHaveBeenCalledTimes(1);
  });
});
