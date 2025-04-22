// Create file: src/components/SpatialSliceSlider/SpatialSliceSlider.jsx
import React from 'react';
import { useAppStore } from '../../store/appStore';
import styles from './SpatialSliceSlider.module.css';

const SpatialSliceSlider = () => {
  const {
    spatialSliceIndex,
    maxSpatialSliceIndex,
    setSpatialSliceIndex,
  } = useAppStore(state => ({
    spatialSliceIndex: state.spatialSliceIndex,
    maxSpatialSliceIndex: state.maxSpatialSliceIndex,
    setSpatialSliceIndex: state.setSpatialSliceIndex,
  }));

  const handleSliderChange = (event) => {
    setSpatialSliceIndex(parseInt(event.target.value, 10));
  };

  return (
    <div className={styles.sliderContainer}>
      <label htmlFor="spatialSlider" className={styles.sliderLabel}>
        Slice: {spatialSliceIndex}
      </label>
      <input
        type="range"
        id="spatialSlider"
        min="0"
        max={maxSpatialSliceIndex}
        step="1"
        value={spatialSliceIndex}
        onChange={handleSliderChange}
        className={styles.slider}
        aria-label="Spatial Slice Slider"
      />
    </div>
  );
};

export default SpatialSliceSlider;