export type UserProfile = {
  name: string;
  targetHours: number;
  startDate: string;
  endDate: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
};

export type DailyLog = {
  id: string;
  date: string;
  hours: number;
  breakMinutes: number;
  netHours: number;
  notes: string;
  createdAt: string;
};

export type HistoryFilter = 'all' | 'week' | 'month';

export type BackupData = {
  profile: UserProfile | null;
  logs: DailyLog[];
  exportedAt: string;
};

export type DashboardSummary = {
  totalHours: number;
  remainingHours: number;
  completionPercentage: number;
  averageDailyHours: number;
  estimatedDaysRemaining: number | null;
  requiredDailyAverage: number;
  projectedFinishDate: string | null;
  daysUntilDeadline: number;
  status: 'On Track' | 'Need to Catch Up' | 'Completed';
};
