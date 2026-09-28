export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type Section = {
  id: string;
  label: string;
  year: string;
  room: string;
  accent: string;
  slots: Record<Weekday, number>;
};

export const SEMESTER_START = '2026-08-29';
export const SEMESTER_END = '2026-11-29';

// Slot counts transcribed from the provided odd-semester timetable sheets.
export const sections: Section[] = [
  { id: 'i-seee', label: 'I Year · SEEE', year: 'I YEAR', room: 'IST 105', accent: 'cyan', slots: { monday: 6, tuesday: 6, wednesday: 5, thursday: 6, friday: 5 } },
  { id: 'ii-bme', label: 'II BME', year: 'II YEAR', room: 'IST 215', accent: 'amber', slots: { monday: 5, tuesday: 6, wednesday: 5, thursday: 6, friday: 5 } },
  { id: 'ii-ece-ds-a', label: 'II ECE DS · A', year: 'II YEAR', room: 'IST 312', accent: 'green', slots: { monday: 6, tuesday: 5, wednesday: 6, thursday: 5, friday: 6 } },
  { id: 'ii-ece-ds-b', label: 'II ECE DS · B', year: 'II YEAR', room: 'IST 314', accent: 'green', slots: { monday: 5, tuesday: 6, wednesday: 5, thursday: 6, friday: 5 } },
  { id: 'iii-bme', label: 'III BME', year: 'III YEAR', room: 'IST 421', accent: 'pink', slots: { monday: 6, tuesday: 5, wednesday: 6, thursday: 5, friday: 5 } },
  { id: 'iii-ece-a', label: 'III ECE · A', year: 'III YEAR', room: 'IST 518 / FN', accent: 'cyan', slots: { monday: 6, tuesday: 6, wednesday: 5, thursday: 6, friday: 6 } },
  { id: 'iii-ece-b', label: 'III ECE · B', year: 'III YEAR', room: 'IST 518 / AN', accent: 'cyan', slots: { monday: 5, tuesday: 5, wednesday: 6, thursday: 6, friday: 6 } },
  { id: 'iii-ece-ds', label: 'III ECE DS', year: 'III YEAR', room: 'IST 519 / FN', accent: 'green', slots: { monday: 6, tuesday: 7, wednesday: 6, thursday: 6, friday: 7 } },
  { id: 'iv-ece-a', label: 'IV ECE · A', year: 'IV YEAR', room: 'IST 225', accent: 'amber', slots: { monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4 } },
  { id: 'iv-ece-b', label: 'IV ECE · B', year: 'IV YEAR', room: 'IST 227', accent: 'amber', slots: { monday: 5, tuesday: 4, wednesday: 4, thursday: 4, friday: 4 } },
];

const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export function countRemainingSlots(section: Section, fromDate: string, toDate = SEMESTER_END): number {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  let total = 0;
  for (const cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
    const key = weekdayKeys[cursor.getDay()];
    if (key in section.slots) total += section.slots[key as Weekday];
  }
  return total;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function clampDate(date: string): string {
  return date < SEMESTER_START ? SEMESTER_START : date > SEMESTER_END ? SEMESTER_END : date;
}
