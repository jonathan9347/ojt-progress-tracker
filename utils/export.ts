import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, parseISO } from 'date-fns';

import { calculateDashboard, formatDisplayDate } from '@/utils/calculations';
import type { BackupData, DailyLog, UserProfile } from '@/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildSummaryText(profile: UserProfile | null, logs: DailyLog[]): string {
  const summary = calculateDashboard(profile, logs);
  const header = [
    'OJT Progress Tracker Summary',
    `Student: ${profile?.name ?? 'Not set'}`,
    `Target Hours: ${profile?.targetHours ?? 240}`,
    `Start Date: ${profile?.startDate ? formatDisplayDate(profile.startDate) : 'Not set'}`,
    `End Date: ${profile?.endDate ? formatDisplayDate(profile.endDate) : 'Not set'}`,
    `Total Hours Rendered: ${summary.totalHours.toFixed(2)}`,
    `Remaining Hours: ${summary.remainingHours.toFixed(2)}`,
    `Completion: ${summary.completionPercentage.toFixed(1)}%`,
    `Status: ${summary.status}`,
    '',
    'Daily Logs',
  ];

  const rows = logs
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => `${formatDisplayDate(log.date)} | ${log.netHours.toFixed(2)} hrs | ${log.notes || 'No notes'}`);

  return [...header, ...rows].join('\n');
}

export function buildCsv(profile: UserProfile | null, logs: DailyLog[]): string {
  const studentName = profile?.name ?? '';
  const rows = [
    ['Student Name', 'Date', 'Raw Hours', 'Break Minutes', 'Net Hours', 'Notes'],
    ...logs.map((log) => [
      studentName,
      format(parseISO(log.date), 'yyyy-MM-dd'),
      log.hours.toFixed(2),
      String(log.breakMinutes),
      log.netHours.toFixed(2),
      `"${log.notes.replace(/"/g, '""')}"`,
    ]),
  ];

  return rows.map((row) => row.join(',')).join('\n');
}

export function buildReportHtml(profile: UserProfile | null, logs: DailyLog[]): string {
  const summary = calculateDashboard(profile, logs);
  const rows = logs
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(
      (log) => `
        <tr>
          <td>${escapeHtml(formatDisplayDate(log.date))}</td>
          <td>${log.hours.toFixed(2)}</td>
          <td>${log.breakMinutes}</td>
          <td>${log.netHours.toFixed(2)}</td>
          <td>${escapeHtml(log.notes || 'No notes')}</td>
        </tr>`,
    )
    .join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #24343a; }
          h1 { color: #2e5f58; margin-bottom: 8px; }
          .meta { margin-bottom: 20px; line-height: 1.6; }
          .cards { display: flex; gap: 12px; margin: 16px 0 24px; }
          .card { flex: 1; padding: 12px; border-radius: 12px; background: #f7efe5; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d8cdc0; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #d6eadf; }
        </style>
      </head>
      <body>
        <h1>OJT Progress Tracker Report</h1>
        <div class="meta">
          <div><strong>Student:</strong> ${escapeHtml(profile?.name ?? 'Not set')}</div>
          <div><strong>Target Hours:</strong> ${profile?.targetHours ?? 240}</div>
          <div><strong>Start Date:</strong> ${profile?.startDate ? escapeHtml(formatDisplayDate(profile.startDate)) : 'Not set'}</div>
          <div><strong>End Date:</strong> ${profile?.endDate ? escapeHtml(formatDisplayDate(profile.endDate)) : 'Not set'}</div>
          <div><strong>Generated:</strong> ${escapeHtml(format(new Date(), 'MMM d, yyyy h:mm a'))}</div>
        </div>
        <div class="cards">
          <div class="card"><strong>Total Hours</strong><br/>${summary.totalHours.toFixed(2)}</div>
          <div class="card"><strong>Remaining</strong><br/>${summary.remainingHours.toFixed(2)}</div>
          <div class="card"><strong>Completion</strong><br/>${summary.completionPercentage.toFixed(1)}%</div>
          <div class="card"><strong>Status</strong><br/>${summary.status}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Raw Hours</th>
              <th>Break (min)</th>
              <th>Net Hours</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">No logs recorded yet.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export async function createPdfReport(profile: UserProfile | null, logs: DailyLog[]): Promise<string> {
  const html = buildReportHtml(profile, logs);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareFile(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export async function writeTextFile(fileName: string, content: string): Promise<string> {
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('No writable directory is available on this device.');
  }

  const fileUri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

export async function copySummary(profile: UserProfile | null, logs: DailyLog[]): Promise<void> {
  await Clipboard.setStringAsync(buildSummaryText(profile, logs));
}

export function parseImportedBackup(raw: string): BackupData {
  const data = JSON.parse(raw) as BackupData;
  if (!Array.isArray(data.logs)) {
    throw new Error('Backup file is missing a valid logs array.');
  }
  return {
    profile: data.profile ?? null,
    logs: data.logs,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
  };
}
