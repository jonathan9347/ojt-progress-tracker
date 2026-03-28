import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, Text, useTheme } from 'react-native-paper';

import { appPalette, appRadius } from '@/constants/theme';

type ChartProps = {
  labels: string[];
  values: number[];
};

export function Chart({ labels, values }: ChartProps) {
  const theme = useTheme();
  const [cardWidth, setCardWidth] = useState(0);
  const chartWidth = Math.max(cardWidth - 40, 220);
  const chartHeight = Math.min(Math.max(chartWidth * 0.62, 180), 230);

  const handleLayout = (event: LayoutChangeEvent) => {
    setCardWidth(event.nativeEvent.layout.width);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content onLayout={handleLayout} style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          Last 30 Days
        </Text>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels,
              datasets: [{ data: values.length ? values : [0] }],
            }}
            width={chartWidth}
            height={chartHeight}
            bezier
            yAxisSuffix="h"
            withVerticalLines={false}
            withHorizontalLines
            withInnerLines={false}
            withOuterLines={false}
            segments={4}
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
  content: {
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  chartWrap: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chart: {
    borderRadius: appRadius.md,
  },
});
