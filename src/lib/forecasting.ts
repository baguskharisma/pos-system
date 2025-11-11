/**
 * Sales Forecasting Library
 * Implements time series forecasting using moving averages and trend analysis
 */

interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

interface ForecastResult {
  date: string;
  predicted: number;
  lower: number; // Lower confidence bound
  upper: number; // Upper confidence bound
  confidence: number;
}

interface TrendAnalysis {
  direction: "up" | "down" | "stable";
  strength: number; // 0-1
  changePercentage: number;
}

/**
 * Calculate moving average
 */
function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
}

/**
 * Calculate exponential moving average (EMA)
 */
function exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

/**
 * Calculate linear regression
 */
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * data[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Analyze trend direction and strength
 */
export function analyzeTrend(data: number[]): TrendAnalysis {
  if (data.length < 2) {
    return { direction: "stable", strength: 0, changePercentage: 0 };
  }

  const { slope } = linearRegression(data);
  const avgValue = data.reduce((a, b) => a + b, 0) / data.length;

  // Normalize slope by average value to get percentage change per period
  const changePercentage = (slope / avgValue) * 100;

  // Determine direction
  let direction: "up" | "down" | "stable";
  if (Math.abs(changePercentage) < 1) {
    direction = "stable";
  } else if (changePercentage > 0) {
    direction = "up";
  } else {
    direction = "down";
  }

  // Calculate strength (0-1)
  const strength = Math.min(Math.abs(changePercentage) / 10, 1);

  return { direction, strength, changePercentage };
}

/**
 * Calculate standard deviation
 */
function standardDeviation(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance =
    data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Forecast future sales using exponential smoothing with trend
 */
export function forecastSales(
  historicalData: SalesDataPoint[],
  daysToForecast: number = 7,
  alpha: number = 0.3,
  beta: number = 0.3
): ForecastResult[] {
  if (historicalData.length < 7) {
    throw new Error("Need at least 7 days of historical data for forecasting");
  }

  const salesValues = historicalData.map((d) => d.sales);

  // Initialize level and trend
  let level = salesValues[0];
  let trend = salesValues[1] - salesValues[0];

  const forecasts: ForecastResult[] = [];
  const errors: number[] = [];

  // Holt's linear trend method (exponential smoothing with trend)
  for (let i = 1; i < salesValues.length; i++) {
    const prevLevel = level;
    const prevTrend = trend;

    level = alpha * salesValues[i] + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;

    // Calculate error for confidence intervals
    const predicted = prevLevel + prevTrend;
    errors.push(Math.abs(salesValues[i] - predicted));
  }

  // Calculate confidence interval based on historical errors
  const stdError = standardDeviation(errors);
  const confidenceMultiplier = 1.96; // 95% confidence interval

  // Generate forecasts
  const lastDate = new Date(historicalData[historicalData.length - 1].date);

  for (let i = 1; i <= daysToForecast; i++) {
    const forecast = level + trend * i;
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    // Confidence intervals widen with time
    const intervalWidth = stdError * confidenceMultiplier * Math.sqrt(i);

    forecasts.push({
      date: forecastDate.toISOString().split("T")[0],
      predicted: Math.max(0, forecast),
      lower: Math.max(0, forecast - intervalWidth),
      upper: forecast + intervalWidth,
      confidence: Math.max(0.5, 1 - i * 0.05), // Confidence decreases over time
    });
  }

  return forecasts;
}

/**
 * Forecast sales using simple moving average
 */
export function forecastSalesSimple(
  historicalData: SalesDataPoint[],
  daysToForecast: number = 7,
  window: number = 7
): ForecastResult[] {
  if (historicalData.length < window) {
    throw new Error(
      `Need at least ${window} days of historical data for forecasting`
    );
  }

  const salesValues = historicalData.map((d) => d.sales);

  // Calculate moving average for recent period
  const recentData = salesValues.slice(-window);
  const average = recentData.reduce((a, b) => a + b, 0) / window;
  const stdDev = standardDeviation(recentData);

  const forecasts: ForecastResult[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);

  for (let i = 1; i <= daysToForecast; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    forecasts.push({
      date: forecastDate.toISOString().split("T")[0],
      predicted: average,
      lower: Math.max(0, average - stdDev * 1.96),
      upper: average + stdDev * 1.96,
      confidence: 0.8, // Fixed confidence for simple method
    });
  }

  return forecasts;
}

/**
 * Detect seasonality in sales data
 */
export function detectSeasonality(
  historicalData: SalesDataPoint[],
  period: number = 7 // Weekly seasonality by default
): {
  hasSeasonality: boolean;
  pattern: number[];
  strength: number;
} {
  if (historicalData.length < period * 2) {
    return { hasSeasonality: false, pattern: [], strength: 0 };
  }

  const salesValues = historicalData.map((d) => d.sales);

  // Calculate average for each day of the period
  const pattern: number[] = [];
  for (let i = 0; i < period; i++) {
    const dayValues: number[] = [];
    for (let j = i; j < salesValues.length; j += period) {
      dayValues.push(salesValues[j]);
    }
    pattern.push(dayValues.reduce((a, b) => a + b, 0) / dayValues.length);
  }

  // Calculate seasonality strength
  const overallAverage = salesValues.reduce((a, b) => a + b, 0) / salesValues.length;
  const variance =
    pattern.reduce((sum, val) => sum + Math.pow(val - overallAverage, 2), 0) /
    period;
  const strength = Math.sqrt(variance) / overallAverage;

  const hasSeasonality = strength > 0.1; // 10% variation threshold

  return { hasSeasonality, pattern, strength };
}

/**
 * Calculate forecast accuracy metrics
 */
export function calculateAccuracy(
  actual: number[],
  predicted: number[]
): {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
} {
  if (actual.length !== predicted.length) {
    throw new Error("Actual and predicted arrays must have the same length");
  }

  const n = actual.length;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumPercentError = 0;

  for (let i = 0; i < n; i++) {
    const error = actual[i] - predicted[i];
    sumAbsError += Math.abs(error);
    sumSquaredError += error * error;
    if (actual[i] !== 0) {
      sumPercentError += Math.abs(error / actual[i]);
    }
  }

  return {
    mae: sumAbsError / n,
    rmse: Math.sqrt(sumSquaredError / n),
    mape: (sumPercentError / n) * 100,
  };
}
