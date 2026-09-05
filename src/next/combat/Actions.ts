export const actionTiming: Record<string, { duration: number; release?: number }> = {
  bow_fire: { duration: 1.15, release: 0.66 },
  bow_release: { duration: 0.32, release: 0.06 },
  lance_fire: { duration: 0.65, release: 0.08 },
  lance_release: { duration: 0.9, release: 0.24 },
  weapon_stow: { duration: 0.6 },
  weapon_equip: { duration: 0.6 },
  bow_cancel: { duration: 0.45 },
  recover: { duration: 1.3 },
  interact: { duration: 1.8 },
  hit: { duration: 0.4 },
};
