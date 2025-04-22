// src/components/ControlPanel/ControlPanel.jsx (Modified - Add Time Slider)
import React, { useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import styles from './ControlPanel.module.css';

const ControlPanel = () => {
  const {
    uploadedEegFileName, uploadEegFile, clearEegData, isProcessingEeg, eegProcessingError,
    showAtlas, toggleAtlas,
    showDifferenceWeave, toggleDifferenceWeave,
    // Get time state/actions
    timeIndex, maxTimeIndex, setTimeIndex, // <-- Added
    fileUploaded // Added to conditionally show time slider
  } = useAppStore(state => ({
    uploadedEegFileName: state.uploadedEegFileName,
    uploadEegFile: state.uploadEegFile,
    clearEegData: state.clearEegData,
    isProcessingEeg: state.isProcessingEeg,
    eegProcessingError: state.eegProcessingError,
    showAtlas: state.showAtlas,
    toggleAtlas: state.toggleAtlas,
    showDifferenceWeave: state.showDifferenceWeave,
    toggleDifferenceWeave: state.toggleDifferenceWeave,
    timeIndex: state.timeIndex,             // <-- Added
    maxTimeIndex: state.maxTimeIndex,       // <-- Added
    setTimeIndex: state.setTimeIndex,         // <-- Added
    fileUploaded: !!state.uploadedEegFileName // <-- Added
  }));

  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadEegFile(file);
    }
  };

  const handleClearEeg = () => {
      clearEegData();
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  // Handler for time slider
  const handleTimeSliderChange = (event) => {
    setTimeIndex(parseInt(event.target.value, 10));
  };

  return (
    <div className={`${styles.controlPanel} panel`}>
      <h3 className={styles.title}>Controls</h3>

      {/* EEG Upload Section (No changes here) */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>EEG Input</h4>
        <div className={styles.controlGroup}>
          <label htmlFor="eegFile" className={styles.label}>
            Upload EEG File (.edf, .bdf, etc.)
          </label>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            id="eegFile"
            accept=".edf,.bdf,.fif,application/octet-stream"
            onChange={handleFileUpload}
            disabled={isProcessingEeg}
          />
           {uploadedEegFileName && !isProcessingEeg && !eegProcessingError && (
             <div className={styles.fileInfo}>
               <span>{uploadedEegFileName}</span>
               <button onClick={handleClearEeg} className={styles.clearButton} title="Clear EEG data">×</button>
             </div>
           )}
          {isProcessingEeg && <div className={styles.statusLoading}>Processing EEG...</div>}
          {eegProcessingError && <div className={styles.statusError}>Error: {eegProcessingError}</div>}
        </div>
      </div>

      {/* Time Control Section - Conditionally Rendered */}
      {fileUploaded && !eegProcessingError && ( // Only show if EEG is loaded successfully
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Time Navigation</h4>
            <div className={styles.controlGroup}>
            <label htmlFor="timeSlider" className={styles.label}>
                Time Point: {timeIndex} / {maxTimeIndex}
            </label>
            <input
                className={styles.slider} // Reuse slider style
                type="range"
                id="timeSlider"
                min="0"
                max={maxTimeIndex}
                step="1"
                value={timeIndex}
                onChange={handleTimeSliderChange}
                aria-label="Time Point Slider"
            />
            </div>
        </div>
      )}


      {/* Visualization Toggles Section (No changes here) */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Visualization Options (3D)</h4>
        <div className={styles.controlGroup}>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={showAtlas} onChange={toggleAtlas} />
            <span>Show Brain Atlas Overlay</span>
          </label>
        </div>
         <div className={styles.controlGroup}>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={showDifferenceWeave} onChange={toggleDifferenceWeave} />
            <span>Highlight Morph Difference</span>
          </label>
        </div>
        {/* Add more toggles here */}
      </div>

    </div>
  );
};

export default ControlPanel;