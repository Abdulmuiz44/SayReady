import React from 'react';

interface PremiumLessonGateProps {
  subscriptionActive: boolean;
  onShowPaywall: () => void;
}

export const PremiumLessonGate: React.FC<PremiumLessonGateProps> = ({
  subscriptionActive,
  onShowPaywall
}) => {
  if (subscriptionActive) {
    return <div data-testid="premium-content">Premium lesson unlocked</div>;
  }

  return (
    <button type="button" onClick={onShowPaywall} data-testid="show-paywall">
      Upgrade to continue
    </button>
  );
};
