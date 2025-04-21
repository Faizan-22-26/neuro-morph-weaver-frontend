import React from 'react';
import { useAppStore } from '../../store/appStore';
import styles from './MPRPanel.module.css';

// Predefined plane normals for standard views
const standardPlanes = {
  axial: { normal: { x: 0, y: 0, z: 1 }, name: 'Axial' },
  sagittal: { normal: { x: 1, y: 0, z: 0 }, name: 'Sagittal' },
  coronal: { normal: { x: 0, y: 1, z: 0 }, name: 'Coronal' },
};

const MPRPanel = () => {
  // Select state needed for the MPR panel
  const {
    mprPlane,
    setMprPlanePosition, // Example setter (if position is controlled here)
    setMprPlaneNormal,   // Setter for orientation
    generatedMriSlice, // The data/URL for the slice image
    uploadedEegFileName, // To know if we expect a slice
    isProcessingEeg, // To show loading state perhaps
  } = useAppStore(state => ({
    mprPlane: state.mprPlane,
    setMprPlanePosition: state.setMprPlanePosition,
    setMprPlaneNormal: state.setMprPlaneNormal,
    generatedMriSlice: state.generatedMriSlice,
    uploadedEegFileName: state.uploadedEegFileName,
    isProcessingEeg: state.isProcessingEeg,
  }));

  const handleSetStandardView = (viewKey) => {
    if (standardPlanes[viewKey]) {
      setMprPlaneNormal(standardPlanes[viewKey].normal);
      // Optionally reset position or keep current center
      // setMprPlanePosition({ x: 0, y: 0, z: 0 });
    }
  };

  // Determine the current view name based on the normal vector
  const getCurrentViewName = () => {
     const { normal } = mprPlane;
     for (const key in standardPlanes) {
        const planeNormal = standardPlanes[key].normal;
        // Basic check for axis alignment (allow for small floating point inaccuracies)
        if (Math.abs(normal.x - planeNormal.x) < 0.01 &&
            Math.abs(normal.y - planeNormal.y) < 0.01 &&
            Math.abs(normal.z - planeNormal.z) < 0.01) {
            return standardPlanes[key].name;
        }
     }
     return 'Oblique'; // If not aligned with standard axes
  };

  return (
    <div className={`${styles.mprPanel} panel`}>
      <h3 className={styles.title}>Multi-Planar Reformat (MPR) View</h3>
      <div className={styles.viewControls}>
        <span className={styles.currentView}>Current View: {getCurrentViewName()}</span>
        <div className={styles.buttonGroup}>
          {Object.keys(standardPlanes).map((key) => (
            <button
              key={key}
              onClick={() => handleSetStandardView(key)}
              className={styles.viewButton}
              title={`Set to ${standardPlanes[key].name} View`}
            >
              {standardPlanes[key].name.substring(0, 3)} {/* Short label */}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sliceViewer}>
        {isProcessingEeg && (
          <div className={styles.placeholder}>Generating Slice...</div>
        )}
        {!isProcessingEeg && generatedMriSlice && (
          // Assuming generatedMriSlice is an image URL for simplicity
          <img
            src={generatedMriSlice}
            alt={`Generated ${getCurrentViewName()} Slice`}
            className={styles.sliceImage}
          />
          // Alternative: If generatedMriSlice contains pixel data,
          // render it to a <canvas> element here using context2d.putImageData
        )}
         {!isProcessingEeg && !generatedMriSlice && uploadedEegFileName && (
          <div className={styles.placeholder}>Slice data not available. Process EEG again?</div>
         )}
        {!isProcessingEeg && !generatedMriSlice && !uploadedEegFileName && (
          <div className={styles.placeholder}>Upload an EEG file to generate an MPR slice.</div>
        )}
      </div>

      {/* Placeholder for more advanced controls */}
      <div className={styles.advancedControls}>
        {/* Example: Sliders or inputs to control plane position numerically */}
        {/* <label>Position Z:</label> */}
        {/* <input type="range" min="-100" max="100" step="1" value={mprPlane.position.z} onChange={(e) => setMprPlanePosition({...mprPlane.position, z: parseFloat(e.target.value)})} /> */}
        <p className={styles.note}>
          Note: Plane position/orientation is primarily controlled via the 3D view interaction (if implemented).
        </p>
      </div>
    </div>
  );
};

export default MPRPanel;