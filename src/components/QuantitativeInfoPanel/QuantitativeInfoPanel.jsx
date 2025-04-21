import React from 'react';
import { useAppStore } from '../../store/appStore';
import styles from './QuantitativeInfoPanel.module.css';

// Helper to format metric values
const formatMetric = (value, precision = 2) => {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(precision);
};

const QuantitativeInfoPanel = () => {
  // Select state related to hovered region and metrics
  const {
    hoveredRegion,
    quantitativeMetrics,
    isFetchingMetrics,
    metricFetchError,
    progressionFactor, // To show context for the metrics
  } = useAppStore(state => ({
    hoveredRegion: state.hoveredRegion,
    quantitativeMetrics: state.quantitativeMetrics,
    isFetchingMetrics: state.isFetchingMetrics,
    metricFetchError: state.metricFetchError,
    progressionFactor: state.progressionFactor,
  }));

  return (
    <div className={`${styles.infoPanel} panel`}>
      <h3 className={styles.title}>Quantitative Info</h3>

      <div className={styles.regionInfo}>
        <span className={styles.label}>Hovered Region:</span>
        <span className={styles.valueRegion}>
          {hoveredRegion ? `${hoveredRegion.name} (${hoveredRegion.id})` : 'None'}
        </span>
      </div>

      <div className={styles.metricsContainer}>
        {isFetchingMetrics && (
          <div className={styles.statusLoading}>Loading metrics...</div>
        )}
        {metricFetchError && !isFetchingMetrics && (
          <div className={styles.statusError}>Error: {metricFetchError}</div>
        )}
        {!isFetchingMetrics && !metricFetchError && hoveredRegion && quantitativeMetrics && (
          <>
            <div className={styles.metricItem}>
              <span className={styles.label}>Progression State:</span>
              <span className={styles.value}>{formatMetric(progressionFactor)}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.label}>Predicted Volume (mm³):</span>
              <span className={styles.value}>{formatMetric(quantitativeMetrics.volume, 0)}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.label}>Predicted Thickness (mm):</span>
              <span className={styles.value}>{formatMetric(quantitativeMetrics.thickness, 3)}</span>
            </div>
            {/* Add more metrics as available */}
            {/* Example: */}
            {/* <div className={styles.metricItem}>
              <span className={styles.label}>EEG Power (Alpha):</span>
              <span className={styles.value}>{formatMetric(quantitativeMetrics.eegAlphaPower, 4)}</span>
            </div> */}
          </>
        )}
        {!isFetchingMetrics && !metricFetchError && hoveredRegion && !quantitativeMetrics && (
           <div className={styles.placeholder}>No quantitative data available for this region at this state.</div>
        )}
         {!isFetchingMetrics && !hoveredRegion && (
           <div className={styles.placeholder}>Hover over a brain region in the 3D view to see details.</div>
         )}
      </div>

      {/* Placeholder for embedded charts */}
      <div className={styles.chartsPlaceholder}>
        {/* <h4 className={styles.chartTitle}>Biomarker Trajectory</h4> */}
        {/* Integrate charting library here (e.g., Recharts, Visx) */}
        {/* Pass data related to the hoveredRegion's metrics over the progressionFactor range */}
        {/* <p className={styles.note}>(Sparkline charts showing metric changes over progression will appear here)</p> */}
      </div>
    </div>
  );
};

export default QuantitativeInfoPanel;