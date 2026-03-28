import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Button, Dialog, HelperText, Portal, Searchbar, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import { ActionAnimationOverlay } from '@/components/ActionAnimationOverlay';
import { appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import { calculateHoursFromTimeRange, formatDisplayDate, getFilteredLogs, validateLogDate } from '@/utils/calculations';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '@/utils/haptics';
import type { DailyLog, HistoryFilter } from '@/types';

type LogInputMode = 'manual' | 'direct';
type PickerField = 'date' | 'timeIn' | 'timeOut' | null;

function createTimeFromHourValue(hourValue: number): { timeIn: Date; timeOut: Date } {
  const base = new Date();
  base.setHours(8, 0, 0, 0);
  const timeIn = new Date(base);
  const totalMinutes = Math.round(hourValue * 60);
  const timeOut = new Date(timeIn.getTime() + totalMinutes * 60 * 1000);

  return { timeIn, timeOut };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function HistoryScreen() {
  const { logs, deleteLog, updateLog, refreshData } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [query, setQuery] = useState('');
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [inputMode, setInputMode] = useState<LogInputMode>('direct');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('8');
  const [minutes, setMinutes] = useState('0');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [notes, setNotes] = useState('');
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [timeIn, setTimeIn] = useState(() => createTimeFromHourValue(1).timeIn);
  const [timeOut, setTimeOut] = useState(() => createTimeFromHourValue(1).timeOut);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [error, setError] = useState('');
  const manualPreview = calculateHoursFromTimeRange(timeIn, timeOut);

  const visibleLogs = useMemo(() => {
    const filtered = getFilteredLogs(logs, filter);
    if (!query.trim()) {
      return filtered;
    }

    const lowered = query.trim().toLowerCase();
    return filtered.filter(
      (log) =>
        log.notes.toLowerCase().includes(lowered) ||
        formatDisplayDate(log.date).toLowerCase().includes(lowered) ||
        log.netHours.toFixed(1).includes(lowered),
    );
  }, [filter, logs, query]);

  const sections = useMemo(() => {
    const groups = new Map<string, DailyLog[]>();

    visibleLogs.forEach((log) => {
      const key = format(parseISO(log.date), 'MMMM yyyy');
      const bucket = groups.get(key) ?? [];
      bucket.push(log);
      groups.set(key, bucket);
    });

    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [visibleLogs]);

  const startEdit = (log: DailyLog) => {
    setEditingLog(log);
    setInputMode('direct');
    setDate(log.date);
    const wholeHours = Math.floor(log.hours);
    const remainingMinutes = Math.round((log.hours - wholeHours) * 60);
    setHours(String(wholeHours));
    setMinutes(String(remainingMinutes));
    const range = createTimeFromHourValue(log.hours);
    setTimeIn(range.timeIn);
    setTimeOut(range.timeOut);
    setBreakMinutes(String(log.breakMinutes));
    setNotes(log.notes);
    setError('');
  };

  const handleDelete = async (id: string) => {
    await triggerSelectionHaptic();
    Alert.alert('Delete log?', 'This entry will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteLog(id) },
    ]);
  };

  const handleUpdate = async () => {
    if (!editingLog) {
      return;
    }

    const currentLog = editingLog;
    setIsSavingEdit(true);
    const animationStart = Date.now();

    let parsedHours = 0;
    const parsedBreak = Number(breakMinutes || 0);

    if (inputMode === 'direct') {
      parsedHours = Number(hours || 0) + Number(minutes || 0) / 60;
      if (parsedHours <= 0) {
        setError('Enter hours or minutes greater than zero.');
        setIsSavingEdit(false);
        return;
      }
    } else {
      parsedHours = manualPreview.hours;
    }

    if (parsedHours <= 0 || parsedHours > 24) {
      setError('Hours must be greater than zero and not more than 24.');
      setIsSavingEdit(false);
      return;
    }
    if (parsedBreak < 0 || parsedBreak > 1440) {
      setError('Break minutes must be between 0 and 1440.');
      setIsSavingEdit(false);
      return;
    }
    const dateError = validateLogDate(date);
    if (dateError) {
      setError(dateError);
      setIsSavingEdit(false);
      return;
    }

    setEditingLog(null);

    await updateLog(currentLog.id, {
      date,
      hours: parsedHours,
      breakMinutes: parsedBreak,
      notes,
    });

    const elapsed = Date.now() - animationStart;
    const remainingDelay = Math.max(0, 2000 - elapsed);
    if (remainingDelay > 0) {
      await wait(remainingDelay);
    }

    await triggerSuccessHaptic();
    setIsSavingEdit(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const renderRightActions = (id: string) => (
    <View style={styles.deleteAction}>
      <Button mode="contained" buttonColor={theme.colors.error} onPress={() => void handleDelete(id)}>
        Delete
      </Button>
    </View>
  );

  const onPickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setPickerField(null);
    }
    if (!selectedDate || !pickerField) {
      return;
    }

    if (pickerField === 'date') {
      setDate(selectedDate.toISOString());
      return;
    }
    if (pickerField === 'timeIn') {
      setTimeIn(selectedDate);
      return;
    }
    setTimeOut(selectedDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text variant="headlineLarge" style={styles.title}>
              History
            </Text>
            <SegmentedButtons
              value={filter}
              onValueChange={(value) => setFilter(value as HistoryFilter)}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
              ]}
            />
            <Searchbar
              placeholder="Search logs"
              value={query}
              onChangeText={setQuery}
              style={styles.search}
              inputStyle={styles.searchInput}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text variant="titleMedium" style={styles.sectionHeader}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <LogItem log={item} onPress={() => startEdit(item)} />
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState title="No matching logs" description="Try another filter or search term." />}
      />

      <Portal>
        <Dialog visible={Boolean(editingLog)} onDismiss={() => setEditingLog(null)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Edit Entry</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView contentContainerStyle={styles.dialogContent} showsVerticalScrollIndicator={false}>
              <SegmentedButtons
                value={inputMode}
                onValueChange={(value) => {
                  setInputMode(value as LogInputMode);
                  setError('');
                }}
                buttons={[
                  { value: 'manual', label: 'Time In / Out' },
                  { value: 'direct', label: 'Hours / Minutes' },
                ]}
              />
              <Button
                mode="outlined"
                onPress={() => setPickerField('date')}
                contentStyle={styles.dialogButtonContent}
                textColor="#FFFFFF"
                style={styles.dateButton}
              >
                Date: {date ? formatDisplayDate(date) : 'Select date'}
              </Button>

              {inputMode === 'manual' ? (
                <Surface style={[styles.formSection, styles.whiteSection]} elevation={0}>
                  <Button mode="outlined" onPress={() => setPickerField('timeIn')} contentStyle={styles.dialogButtonContent}>
                    Time In: {format(timeIn, 'hh:mm a')}
                  </Button>
                  <Button mode="outlined" onPress={() => setPickerField('timeOut')} contentStyle={styles.dialogButtonContent}>
                    Time Out: {format(timeOut, 'hh:mm a')}
                  </Button>
                  <Text variant="titleLarge" style={styles.previewNumber}>
                    {manualPreview.hours.toFixed(2)} hrs
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {manualPreview.crossesMidnight ? 'Time out counts as the next day.' : 'Same-day duty range.'}
                  </Text>
                </Surface>
              ) : (
                <Surface style={[styles.formSection, styles.whiteSection]} elevation={0}>
                  <TextInput mode="outlined" label="Hours" keyboardType="decimal-pad" value={hours} onChangeText={setHours} />
                  <TextInput mode="outlined" label="Minutes" keyboardType="number-pad" value={minutes} onChangeText={setMinutes} />
                </Surface>
              )}

              <Surface style={[styles.formSection, styles.whiteSection]} elevation={0}>
                <TextInput
                  mode="outlined"
                  label="Break deduction (minutes)"
                  keyboardType="number-pad"
                  value={breakMinutes}
                  onChangeText={setBreakMinutes}
                />
                <TextInput mode="outlined" label="Notes" multiline numberOfLines={4} value={notes} onChangeText={setNotes} />
              </Surface>

              <HelperText type="error" visible={Boolean(error)}>
                {error}
              </HelperText>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.dialogActions}>
            <Button textColor="#FFFFFF" onPress={() => setEditingLog(null)}>
              Cancel
            </Button>
            <Button textColor="#FFFFFF" onPress={() => void handleUpdate()}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {pickerField ? (
        <DateTimePicker
          mode={pickerField === 'date' ? 'date' : 'time'}
          value={pickerField === 'date' ? (date ? new Date(date) : new Date()) : pickerField === 'timeIn' ? timeIn : timeOut}
          display={Platform.OS === 'android' ? 'default' : pickerField === 'date' ? 'inline' : 'spinner'}
          onChange={onPickerChange}
        />
      ) : null}

      <ActionAnimationOverlay visible={isSavingEdit} title="Saving Changes" description="Updating your duty log..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  headerArea: {
    gap: 14,
    marginBottom: 18,
  },
  title: {
    fontWeight: '800',
  },
  search: {
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
  },
  searchInput: {
    minHeight: 40,
    color: '#3A3A3C',
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6,
    fontWeight: '800',
  },
  separator: {
    height: 10,
  },
  deleteAction: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  dialog: {
    width: '92%',
    alignSelf: 'center',
    maxWidth: 440,
    maxHeight: '82%',
    backgroundColor: '#1F5B46',
    borderRadius: 24,
    overflow: 'hidden',
  },
  dialogTitle: {
    color: '#FFFFFF',
  },
  dialogScrollArea: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    backgroundColor: '#1F5B46',
  },
  dialogContent: {
    gap: 12,
    paddingBottom: 10,
    backgroundColor: '#1F5B46',
  },
  dialogButtonContent: {
    minHeight: 48,
  },
  dateButton: {
    borderColor: 'rgba(255,255,255,0.65)',
  },
  formSection: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  whiteSection: {
    backgroundColor: '#FFFFFF',
  },
  previewNumber: {
    fontWeight: '800',
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 10,
    backgroundColor: '#1F5B46',
  },
});
