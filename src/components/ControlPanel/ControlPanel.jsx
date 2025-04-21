import React, { useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import styles from './ControlPanel.module.css'; // Import component-specific styles

const ControlPanel = () => {
  // Select necessary state and actions from the store
  const {
    progressionFactor, setProgressionFactor,
    uploadedEegFileName, uploadEegFile, clearEegData, isProcessingEeg, eegProcessingError,
    showAtlas, toggleAtlas,
    showDifferenceWeave, toggleDifferenceWeave,
    // Add other state/actions if needed (e.g., EEG settings)
  } = useAppStore(state => ({
    // Use selector for better performance if component re-renders often
    progressionFactor: state.progressionFactor,
    setProgressionFactor: state.setProgressionFactor,
    uploadedEegFileName: state.uploadedEegFileName,
    uploadEegFile: state.uploadEegFile,
    clearEegData: state.clearEegData,
    isProcessingEeg: state.isProcessingEeg,
    eegProcessingError: state.eegProcessingError,
    showAtlas: state.showAtlas,
    toggleAtlas: state.toggleAtlas,
    showDifferenceWeave: state.showDifferenceWeave,
    toggleDifferenceWeave: state.toggleDifferenceWeave,
  }));

  // Ref for the file input to programmatically clear it
  const fileInputRef = useRef(null);

  const handleSliderChange = (event) => {
    setProgressionFactor(parseFloat(event.target.value));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadEegFile(file); // Trigger the async action in the store
    }
  };

  const handleClearEeg = () => {
      clearEegData();
      // Reset the file input visually
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  return (
    <div className={`${styles.controlPanel} panel`}> {/* Combine module and global styles */}
      <h3 className={styles.title}>Controls</h3>

      {/* EEG Upload Section */}
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
            accept=".edf,.bdf,.fif,application/octet-stream" // Specify accepted types
            onChange={handleFileUpload}
            disabled={isProcessingEeg} // Disable while processing
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

       {/* Morphing Control Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Morphing / Progression</h4>
        <div className={styles.controlGroup}>
          <label htmlFor="progressionSlider" className={styles.label}>
             Progression State: {progressionFactor.toFixed(2)}
          </label>
          <input
            className={styles.slider}
            type="range"
            id="progressionSlider"
            min="0"
            max="1"
            step="0.01"
            value={progressionFactor}
            onChange={handleSliderChange}
            aria-label="Progression State Slider"
          />
        </div>
      </div>

      {/* Visualization Toggles Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Visualization Options</h4>
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
        {/* Add more toggles here (e.g., EEG pattern visibility) */}
      </div>

      {/* Add other control sections as needed (e.g., EEG Frequency Band selector) */}

    </div>
  );
};

export default ControlPanel;