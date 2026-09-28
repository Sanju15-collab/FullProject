export type AttendanceMetrics = {
  currentPercent: number;
  remaining: number;
  possiblePercent: number;
  safeAttend: number;
  targetAttend: number;
  maxBunk: number;
  detention: boolean;
  projectedPercent: number;
};

const ceilRequired = (threshold: number, attended: number, conducted: number, remaining: number) =>
  Math.max(0, Math.ceil(threshold * (conducted + remaining) - attended));

export function calculateMetrics(attended: number, conducted: number, remaining: number, simulatedSkips = 0): AttendanceMetrics {
  const safeAttend = ceilRequired(0.75, attended, conducted, remaining);
  const targetAttend = ceilRequired(0.9, attended, conducted, remaining);
  const possiblePercent = conducted + remaining === 0 ? 0 : ((attended + remaining) / (conducted + remaining)) * 100;
  const maxBunk = Math.max(0, Math.min(remaining, Math.floor(attended + remaining - 0.75 * (conducted + remaining))));
  const projectedPercent = conducted + remaining === 0 ? 0 : ((attended + remaining - Math.min(simulatedSkips, remaining)) / (conducted + remaining)) * 100;

  return {
    currentPercent: conducted === 0 ? 0 : (attended / conducted) * 100,
    remaining,
    possiblePercent,
    safeAttend,
    targetAttend,
    maxBunk,
    detention: possiblePercent < 75,
    projectedPercent,
  };
}

export function statusFor(percent: number): 'safe' | 'caution' | 'detention' {
  if (percent < 75) return 'detention';
  if (percent < 90) return 'caution';
  return 'safe';
}
