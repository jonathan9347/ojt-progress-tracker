import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, Text, useTheme } from 'react-native-paper';

import { appPalette, appRadius } from '@/constants/theme';

type ChartProps = {
  labels: string[];
  values: number[];
};

export function Chart({ labels, values }: ChartProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.max(Math.min(screenWidth - 72, 520), 260);

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Last 30 Days
        </Text>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels,
              datasets: [{ data: values.length ? values : [0] }],
            }}
            width={width}
            height={220}
            bezier
            yAxisSuffix="h"
            withInnerLines={false}
            withOuterLines={false}
            chartConfig={{
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(152, 212, 148, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(102, 112, 133, ${opacity})`,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: appPalette.accent,
              },
            }}
            style={styles.chart}
            fromZero
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appRadius.lg,
  },
  title: {
    fontWeight: '700',
  },
  chartWrap: {
    marginTop: 12,
    marginLeft: -22,
  },
  chart: {
    borderRadius: appRadius.md,
  },
});
