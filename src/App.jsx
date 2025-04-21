import React from 'react';
import { useAppStore } from './store/appStore'; // To access global state if needed for layout
import ThreeDViewport from './components/ThreeDViewport/ThreeDViewport';
import ControlPanel from './components/ControlPanel/ControlPanel';
import MPRPanel from './components/MPRPanel/MPRPanel';
import LatentCanvas from './components/LatentCanvas/LatentCanvas';
import QuantitativeInfoPanel from './components/QuantitativeInfoPanel/QuantitativeInfoPanel';
import './App.css'; // Styles specific to the App layout

function App() {
  // Example: Use global loading state to overlay a loading indicator
  const isModelLoading = useAppStore((state) => state.isModelLoading);
  const modelLoadError = useAppStore((state) => state.modelLoadError);

  return (
    <div className="appLayout">
      {/* Main 3D View Area */}
      <main className="mainView">
        {isModelLoading && <div className="loadingOverlay">Loading 3D Model...</div>}
        {modelLoadError && <div className="errorOverlay">Error loading model: {modelLoadError}</div>}
        {!isModelLoading && !modelLoadError && <ThreeDViewport />}
      </main>

      {/* Side Panel for Controls and Secondary Views */}
      <aside className="sidePanel">
        <ControlPanel />
        <LatentCanvas />
        <MPRPanel />
        <QuantitativeInfoPanel />
        {/* Add other panels as needed */}
      </aside>
    </div>
  );
}

export default App;