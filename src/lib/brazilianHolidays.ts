// Brazilian National Holidays
// Returns holidays for a given year

interface Holiday {
  date: Date;
  name: string;
}

// Calculate Easter Sunday using Anonymous Gregorian algorithm
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

// Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getBrazilianHolidays(year: number): Holiday[] {
  const easter = getEasterSunday(year);
  
  const holidays: Holiday[] = [
    // Fixed holidays
    { date: new Date(year, 0, 1), name: "Confraternização Universal" },
    { date: new Date(year, 3, 21), name: "Tiradentes" },
    { date: new Date(year, 4, 1), name: "Dia do Trabalho" },
    { date: new Date(year, 8, 7), name: "Independência do Brasil" },
    { date: new Date(year, 9, 12), name: "Nossa Senhora Aparecida" },
    { date: new Date(year, 10, 2), name: "Finados" },
    { date: new Date(year, 10, 15), name: "Proclamação da República" },
    { date: new Date(year, 11, 25), name: "Natal" },
    
    // Mobile holidays (based on Easter)
    { date: addDays(easter, -47), name: "Carnaval" }, // Terça de Carnaval
    { date: addDays(easter, -48), name: "Carnaval" }, // Segunda de Carnaval
    { date: addDays(easter, -2), name: "Sexta-feira Santa" },
    { date: easter, name: "Páscoa" },
    { date: addDays(easter, 60), name: "Corpus Christi" },
  ];
  
  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function isHoliday(date: Date): Holiday | undefined {
  const year = date.getFullYear();
  const holidays = getBrazilianHolidays(year);
  
  return holidays.find(h => 
    h.date.getFullYear() === date.getFullYear() &&
    h.date.getMonth() === date.getMonth() &&
    h.date.getDate() === date.getDate()
  );
}

export function isDateBlocked(
  date: Date, 
  blockedPeriods: { start_date: string; end_date: string }[]
): boolean {
  // Check holidays
  if (isHoliday(date)) return true;
  
  // Check blocked periods
  const dateStr = date.toISOString().split('T')[0];
  return blockedPeriods.some(period => 
    dateStr >= period.start_date && dateStr <= period.end_date
  );
}

export function getBlockedReason(
  date: Date, 
  blockedPeriods: { start_date: string; end_date: string; reason?: string }[]
): string | undefined {
  const holiday = isHoliday(date);
  if (holiday) return `Feriado: ${holiday.name}`;
  
  const dateStr = date.toISOString().split('T')[0];
  const blockedPeriod = blockedPeriods.find(period => 
    dateStr >= period.start_date && dateStr <= period.end_date
  );
  
  if (blockedPeriod) return blockedPeriod.reason || "Período bloqueado pelo mentor";
  
  return undefined;
}
