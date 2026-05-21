import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';


export function clampHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateNetHours(hours: number, breakMinutes: number): number {
  return clampHours(Math.max(0, hours - breakMinutes / 60));
}

export function sortLogsNewest(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFilteredLogs(logs: DailyLog[], filter: HistoryFilter): DailyLog[] {
  const sorted = sortLogsNewest(logs);
  if (filter === 'all') {
    return sorted;
  }

  const today = startOfDay(new Date());
  const threshold = filter === 'week' ? subDays(today, 6) : subDays(today, 29);
  return sorted.filter((log) => !isBefore(startOfDay(parseISO(log.date)), threshold));
}

export function calculateDashboard(profile: UserProfile | null, logs: DailyLog[]): DashboardSummary {
  const totalHours = clampHours(logs.reduce((sum, log) => sum + log.netHours, 0));
  const targetHours = profile?.targetHours ?? 240;
  const remainingHours = clampHours(Math.max(targetHours - totalHours, 0));
  const completionPercentage = targetHours > 0 ? Math.min((totalHours / targetHours) * 100, 100) : 0;

  const today = startOfDay(new Date());
  const recentThreshold = subDays(today, 13);
  const recentHours = logs
    .filter((log) => !isBefore(startOfDay(parseISO(log.date)), recentThreshold))
    .reduce((sum, log) => sum + log.netHours, 0);
  const averageDailyHours = clampHours(recentHours / 14);

  const deadline = profile?.endDate ? endOfDay(parseISO(profile.endDate)) : today;
  const daysUntilDeadline = Math.max(differenceInCalendarDays(deadline, today), 0);
  const requiredDailyAverage = daysUntilDeadline > 0 ? clampHours(remainingHours / daysUntilDeadline) : remainingHours;
  const estimatedDaysRemaining =
    averageDailyHours > 0 && remainingHours > 0 ? Math.ceil(remainingHours / averageDailyHours) : remainingHours === 0 ? 0 : null;
  const projectedFinishDate =
    averageDailyHours > 0 ? format(addDays(today, Math.ceil(remainingHours / averageDailyHours)), 'yyyy-MM-dd') : null;

  let status: DashboardSummary['status'] = 'Need to Catch Up';
  if (remainingHours === 0) {
    status = 'Completed';
  } else if (estimatedDaysRemaining !== null && estimatedDaysRemaining <= daysUntilDeadline) {
    status = 'On Track';
  }

  return {
    totalHours,
    remainingHours,
    completionPercentage: clampHours(completionPercentage),
    averageDailyHours,
    estimatedDaysRemaining,
    requiredDailyAverage,
    projectedFinishDate,
    daysUntilDeadline,
    status,
  };
}

export function getLastNDaysChartData(logs: DailyLog[], days: number): { labels: string[]; values: number[] } {
  const today = startOfDay(new Date());
  const start = subDays(today, days - 1);
  const dates = eachDayOfInterval({ start, end: today });

  const values = dates.map((date) => {
    const total = logs
      .filter((log) => isSameDay(parseISO(log.date), date))
      .reduce((sum, log) => sum + log.netHours, 0);
    return clampHours(total);
  });

  const labels = dates.map((date, index) => (index % 5 === 0 ? format(date, 'MMM d') : ''));

  return { labels, values };
}

export function formatDisplayDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function validateLogDate(dateISO: string): string | null {
  const selectedDate = startOfDay(parseISO(dateISO));
  const today = startOfDay(new Date());
  if (isAfter(selectedDate, today)) {
    return 'Future dates are not allowed.';
  }
  return null;
}

export function validateProfileDates(startDateISO: string, endDateISO: string): string | null {
  const start = startOfDay(parseISO(startDateISO));
  const end = startOfDay(parseISO(endDateISO));
  if (isAfter(start, end)) {
    return 'End date must be after the start date.';
  }
  return null;
}
