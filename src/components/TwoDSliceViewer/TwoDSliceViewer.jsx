// Create file: src/components/TwoDSliceViewer/TwoDSliceViewer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import styles from './TwoDSliceViewer.module.css';

const TwoDSliceViewer = () => {
  const viewerRef = useRef(null);
  const {
    currentSliceData,
    currentInferenceData,
    spatialSliceIndex,
    setSpatialSliceIndex,
    maxSpatialSliceIndex,
    fetchSliceAndInferenceData, // Action to get data
    timeIndex, // Need time index to fetch correct slice
  } = useAppStore(state => ({
    currentSliceData: state.currentSliceData,
    currentInferenceData: state.currentInferenceData,
    spatialSliceIndex: state.spatialSliceIndex,
    setSpatialSliceIndex: state.setSpatialSliceIndex,
    maxSpatialSliceIndex: state.maxSpatialSliceIndex,
    fetchSliceAndInferenceData: state.fetchSliceAndInferenceData,
    timeIndex: state.timeIndex,
  }));

  // Fetch data when slice or time index changes internally
  // Note: Initial fetch is triggered in appStore after EEG processing
  useEffect(() => {
    // Avoid fetching if data is already present for the current indices
    // (This check might need refinement based on how data is stored/cleared)
    // if (!currentSliceData || !currentInferenceData) {
         fetchSliceAndInferenceData(spatialSliceIndex, timeIndex);
    // }
  }, [spatialSliceIndex, timeIndex, fetchSliceAndInferenceData]);


  // Handle mouse wheel scrolling for slice navigation
  const handleWheelScroll = useCallback((event) => {
    event.preventDefault(); // Prevent page scroll
    const delta = Math.sign(event.deltaY); // -1 for up, 1 for down
    setSpatialSliceIndex(spatialSliceIndex + delta);
  }, [spatialSliceIndex, setSpatialSliceIndex]);

  useEffect(() => {
    const viewerElement = viewerRef.current;
    if (viewerElement) {
      viewerElement.addEventListener('wheel', handleWheelScroll, { passive: false });
      return () => {
        viewerElement.removeEventListener('wheel', handleWheelScroll);
      };
    }
  }, [handleWheelScroll]);


  return (
    <div ref={viewerRef} className={styles.viewerContainer}>
      {currentSliceData ? (
        <>
          <img
            src={currentSliceData}
            alt={`Slice ${spatialSliceIndex}`}
            className={styles.sliceImageBase}
          />
          {currentInferenceData && (
            <img
              src={currentInferenceData}
              alt={`Inference ${spatialSliceIndex}`}
              className={styles.sliceImageOverlay}
            />
          )}
           {/* Display Slice Index */}
          <div className={styles.sliceInfoOverlay}>
            Slice: {spatialSliceIndex} / {maxSpatialSliceIndex} | Time: {timeIndex}
          </div>
        </>
      ) : (
        <div className={styles.placeholder}>Loading slice data...</div>
      )}
    </div>
  );
};

export default TwoDSliceViewer;