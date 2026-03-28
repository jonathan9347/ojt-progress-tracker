import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import { ActionAnimationOverlay } from '@/components/ActionAnimationOverlay';
import { appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import { calculateHoursFromTimeRange, formatDisplayDate, validateLogDate } from '@/utils/calculations';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '@/utils/haptics';

type LogInputMode = 'manual' | 'direct';
type PickerField = 'date' | 'timeIn' | 'timeOut' | null;

function createDefaultTimeIn(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now;
}

function createDefaultTimeOut(from: Date): Date {
  const nextHour = new Date(from);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function LogScreen() {
  const { logs, addLog } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date().toISOString());
  const [inputMode, setInputMode] = useState<LogInputMode>('manual');
  const [hours, setHours] = useState('8');
  const [minutes, setMinutes] = useState('30');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [notes, setNotes] = useState('');
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const [timeIn, setTimeIn] = useState(() => createDefaultTimeIn());
  const [timeOut, setTimeOut] = useState(() => createDefaultTimeOut(createDefaultTimeIn()));
  const [directInput, setDirectInput] = useState('8.5');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const manualPreview = calculateHoursFromTimeRange(timeIn, timeOut);
  const directHours =
    directInput.trim() !== '' && !Number.isNaN(Number(directInput))
      ? Number(directInput)
      : Number(hours || 0) + Number(minutes || 0) / 60;
  const displayHours = inputMode === 'manual' ? manualPreview.hours : directHours;

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

  const changeDirectHours = async (delta: number) => {
    await triggerSelectionHaptic();
    const nextValue = Math.max(0, directHours + delta);
    setDirectInput(nextValue.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'));
    const nextWholeHours = Math.floor(nextValue);
    const nextMinutes = Math.round((nextValue - nextWholeHours) * 60);
    setHours(String(nextWholeHours));
    setMinutes(String(nextMinutes));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const animationStart = Date.now();
    const parsedBreak = Number(breakMinutes || 0);
    const combinedHours = inputMode === 'manual' ? manualPreview.hours : directHours;

    if (combinedHours <= 0 || combinedHours > 24) {
      setError('Rendered hours must be greater than zero and not more than 24.');
      setIsSaving(false);
      return;
    }
    if (parsedBreak < 0 || parsedBreak > 1440) {
      setError('Break minutes must be between 0 and 1440.');
      setIsSaving(false);
      return;
    }

    const dateError = validateLogDate(date);
    if (dateError) {
      setError(dateError);
      setIsSaving(false);
      return;
    }

    await addLog({
      date,
      hours: combinedHours,
      breakMinutes: parsedBreak,
      notes,
    });

    const elapsed = Date.now() - animationStart;
    const remainingDelay = Math.max(0, 2000 - elapsed);
    if (remainingDelay > 0) {
      await wait(remainingDelay);
    }

    await triggerSuccessHaptic();
    setNotes('');
    setBreakMinutes('0');
    setDirectInput('8.5');
    setError('');
    setIsSaving(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Log Hours
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Add one clean entry using direct hours or time in and time out.
        </Text>
      </View>

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Date Selector
        </Text>
        <Button mode="outlined" onPress={() => setPickerField('date')} contentStyle={styles.buttonContent}>
          {formatDisplayDate(date)}
        </Button>
      </Surface>

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Time Input
        </Text>
        <SegmentedButtons
          value={inputMode}
          onValueChange={(value) => {
            setInputMode(value as LogInputMode);
            setError('');
          }}
          buttons={[
            { value: 'manual', label: 'Time In / Out' },
            { value: 'direct', label: 'H + M' },
          ]}
        />

        {inputMode === 'manual' ? (
          <>
            <View style={styles.timePickerRow}>
              <Button mode="outlined" onPress={() => setPickerField('timeIn')} contentStyle={styles.buttonContent} style={styles.flex}>
                {format(timeIn, 'hh:mm a')}
              </Button>
              <Button mode="outlined" onPress={() => setPickerField('timeOut')} contentStyle={styles.buttonContent} style={styles.flex}>
                {format(timeOut, 'hh:mm a')}
              </Button>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {manualPreview.crossesMidnight ? 'Time out is counted as the next day.' : 'Same-day duty range.'}
            </Text>
          </>
        ) : (
          <View style={styles.directWrap}>
            <TextInput
              mode="outlined"
              label="Hours"
              keyboardType="decimal-pad"
              value={directInput}
              onChangeText={(value) => {
                setDirectInput(value);
                const parsed = Number(value);
                if (!Number.isNaN(parsed)) {
                  const nextWholeHours = Math.floor(parsed);
                  const nextMinutes = Math.round((parsed - nextWholeHours) * 60);
                  setHours(String(nextWholeHours));
                  setMinutes(String(nextMinutes));
                }
              }}
              style={styles.directInput}
            />
            <View style={styles.stepperGroup}>
              <Button mode="contained-tonal" onPress={() => void changeDirectHours(-0.5)} style={styles.stepperButton}>
                -
              </Button>
              <Button mode="contained-tonal" onPress={() => void changeDirectHours(0.5)} style={styles.stepperButton}>
                +
              </Button>
            </View>
          </View>
        )}

        <TextInput
          mode="outlined"
          label="Break deduction (minutes)"
          keyboardType="number-pad"
          value={breakMinutes}
          onChangeText={setBreakMinutes}
        />
      </Surface>

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Notes
        </Text>
        <TextInput
          mode="outlined"
          label="What did you work on today?"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          style={styles.notes}
        />
        <Text variant="bodySmall" style={styles.characterCount}>
          {notes.length}/280
        </Text>
      </Surface>

      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>

      <Button mode="contained" onPress={() => void handleSave()} style={styles.saveButton} contentStyle={styles.saveButtonContent}>
        Save Log
      </Button>

      <View style={styles.recentHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Logs
        </Text>
      </View>
      {logs.length ? (
        logs.slice(0, 3).map((log) => <LogItem key={log.id} log={log} />)
      ) : (
        <EmptyState title="No logs yet" description="Your latest duty logs will appear here after you save one." />
      )}

      {pickerField ? (
        <DateTimePicker
          mode={pickerField === 'date' ? 'date' : 'time'}
          value={pickerField === 'date' ? new Date(date) : pickerField === 'timeIn' ? timeIn : timeOut}
          display={Platform.OS === 'android' ? 'default' : pickerField === 'date' ? 'inline' : 'spinner'}
          onChange={onPickerChange}
        />
      ) : null}

      <ActionAnimationOverlay visible={isSaving} title="Saving Log" description="Syncing your latest duty entry..." />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    gap: 6,
  },
  title: {
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  buttonContent: {
    minHeight: 46,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  directWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  directInput: {
    flex: 1,
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperButton: {
    minWidth: 64,
  },
  notes: {
    minHeight: 110,
  },
  characterCount: {
    textAlign: 'right',
    color: '#8E8E93',
  },
  saveButton: {
    borderRadius: 14,
  },
  saveButtonContent: {
    minHeight: 52,
  },
  recentHeader: {
    marginTop: 8,
  },
  flex: {
    flex: 1,
  },
});
