export const getRetentionNudges = (sessionsThisWeek: number): string[] => {
  const nudges: string[] = [];

  if (sessionsThisWeek === 3) {
    nudges.push("You're one session away from weekly goal");
  }

  nudges.push("Retry today's scenario for better clarity");

  return nudges;
};
