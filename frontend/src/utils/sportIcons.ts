export const SPORT_ICONS: Record<string, string> = {
  BASEBALL: '⚾',
  SOFTBALL: '🥎',
  BASKETBALL: '🏀',
  SOCCER: '⚽',
  FLAG_FOOTBALL: '🏈',
  OTHER: '🏅',
};

export function getSportIcon(sport: string): string {
  return SPORT_ICONS[sport?.toUpperCase()] || '⚽';
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    BASEBALL: 'Baseball',
    SOFTBALL: 'Softball',
    BASKETBALL: 'Basketball',
    SOCCER: 'Soccer',
    FLAG_FOOTBALL: 'Flag Football',
    OTHER: 'Other',
  };
  return labels[sport?.toUpperCase()] || sport;
}
