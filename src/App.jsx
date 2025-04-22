// src/App.jsx (Modified)
import React from 'react';
import { useAppStore } from './store/appStore';
import ThreeDViewport from './components/ThreeDViewport/ThreeDViewport';
import ControlPanel from './components/ControlPanel/ControlPanel';
// REMOVE: import MPRPanel from './components/MPRPanel/MPRPanel'; // Assuming replaced by 2D view
import LatentCanvas from './components/LatentCanvas/LatentCanvas'; // Keep if needed
import QuantitativeInfoPanel from './components/QuantitativeInfoPanel/QuantitativeInfoPanel'; // Keep if needed

// NEW: Import new components (Create these files next)
import TwoDSliceViewer from './components/TwoDSliceViewer/TwoDSliceViewer';
import SpatialSliceSlider from './components/SpatialSliceSlider/SpatialSliceSlider';
// import TimeControls from './components/TimeControls/TimeControls'; // Import if created

import './App.css';

function App() {
  // Use loading/error states relevant to the main 2D view now
  // const isLoading = useAppStore((state) => state.isFetchingSlice); // Example if slice has loading state
  // const error = useAppStore((state) => state.sliceFetchError); // Example
  const isEegProcessing = useAppStore((state) => state.isProcessingEeg);
  const eegError = useAppStore((state) => state.eegProcessingError);
  const fileUploaded = useAppStore((state) => !!state.uploadedEegFileName);


  return (
    <div className="appLayout">
      {/* Background 3D View */}
      <div className="background3DView">
        {/* Conditionally render 3D view only if needed, could be always present but styled */}
         <ThreeDViewport />
      </div>

      {/* Main 2D View Area + Controls */}
      <main className="mainViewContainer">
         {/* Loading/Error States related to EEG processing or slice fetching */}
         {isEegProcessing && <div className="loadingOverlay">Processing EEG Data...</div>}
         {!isEegProcessing && eegError && <div className="errorOverlay">Error processing EEG: {eegError}</div>}

         {/* Render 2D viewer only if EEG is processed and no error */}
         {!isEegProcessing && !eegError && fileUploaded && (
           <>
            <TwoDSliceViewer />
            <SpatialSliceSlider />
            {/* <TimeControls /> */} {/* Add time controls here or in side panel */}
           </>
         )}
         {!fileUploaded && !isEegProcessing && (
             <div className="loadingOverlay" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }}>
                 Upload an EEG file using the control panel to begin.
             </div>
         )}
      </main>

      {/* Side Panel */}
      <aside className="sidePanel">
        <ControlPanel />
        {/* Keep other panels if they are still relevant */}
         {fileUploaded && <LatentCanvas />}
         {fileUploaded && <QuantitativeInfoPanel />}
        {/* REMOVE: <MPRPanel /> */}
      </aside>
    </div>
  );
}

export default App;