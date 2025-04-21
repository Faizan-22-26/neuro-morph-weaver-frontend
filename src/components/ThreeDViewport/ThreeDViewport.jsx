import React, { useRef, useEffect, memo } from 'react';
import { useAppStore } from '../../store/appStore';
import { setupBabylonScene, cleanupBabylonScene } from './babylonManager'; // Import setup and cleanup logic
import styles from './ThreeDViewport.module.css';

// Memoize the component to prevent unnecessary re-renders if props don't change
// Although this component doesn't take props, its internal state relies on the store,
// and useEffect handles those updates efficiently. Memoization is good practice.
const ThreeDViewport = memo(() => {
  const reactCanvas = useRef(null);
  // Store Babylon engine, scene, and any helper functions/objects returned by setup
  const babylonContext = useRef({ engine: null, scene: null, sceneHelpers: null });

  // --- State Selection from Zustand ---
  // Select only the state values needed for updates within this component's effects
  const progressionFactor = useAppStore((state) => state.progressionFactor);
  const showAtlas = useAppStore((state) => state.showAtlas);
  const showDifferenceWeave = useAppStore((state) => state.showDifferenceWeave);
  const eegVisualizationData = useAppStore((state) => state.eegVisualizationData); // Get data for EEG viz
  const eegDisplaySettings = useAppStore((state) => state.eegDisplaySettings); // Get EEG display settings
  const mprPlane = useAppStore((state) => state.mprPlane); // Get MPR plane state
  const setModelLoadingStatus = useAppStore((state) => state.setModelLoadingStatus); // Action to update loading state
  const setHoveredRegion = useAppStore((state) => state.setHoveredRegion); // Action to update hovered region

  // --- Effect for Initialization and Cleanup ---
  useEffect(() => {
    const { current: canvas } = reactCanvas;
    if (!canvas) {
        console.error("Canvas element not available for Babylon initialization.");
        return;
    }

    let isMounted = true; // Flag to prevent updates after unmount

    // Async function to initialize Babylon
    const initializeBabylon = async () => {
        try {
            // Pass necessary setters to babylonManager so it can update global state
            const { engine, scene, sceneHelpers } = await setupBabylonScene(
                canvas,
                setModelLoadingStatus, // Pass action to report loading progress/errors
                setHoveredRegion // Pass action to report hovered region from picking
            );

            if (!isMounted) { // Check if component unmounted during async setup
                 cleanupBabylonScene(engine, scene);
                 return;
            }

            // Store context
            babylonContext.current = { engine, scene, sceneHelpers };

            // Start render loop
            engine.runRenderLoop(() => {
                if (scene && scene.activeCamera) {
                    scene.render();
                }
            });

            // Add resize listener
             const resize = () => engine.resize();
             window.addEventListener('resize', resize);

             // Store cleanup function for unmount
             babylonContext.current.cleanup = () => {
                console.log("Cleaning up Babylon scene...");
                window.removeEventListener('resize', resize);
                cleanupBabylonScene(engine, scene);
             };

        } catch (error) {
            console.error("Babylon Initialization Failed:", error);
            setModelLoadingStatus(false, error.message || "Unknown initialization error");
             if (!isMounted) return; // Check again before setting error state
        }
    };

    initializeBabylon();

    // Cleanup function runs on component unmount
    return () => {
        isMounted = false;
        // Call the stored cleanup function if it exists
        babylonContext.current.cleanup?.();
        babylonContext.current = { engine: null, scene: null, sceneHelpers: null, cleanup: null };
    };
    // Dependencies: Actions passed to setup. If they are stable (defined outside render),
    // this effect runs once on mount. If actions change identity, add them here.
  }, [setModelLoadingStatus, setHoveredRegion]);

  // --- Effect for Updating Scene based on State Changes ---
  useEffect(() => {
     const { sceneHelpers } = babylonContext.current;
     // Ensure helpers are available (scene is initialized)
     if (!sceneHelpers) return;

     // Call specific update functions exposed by babylonManager
     sceneHelpers.updateMorph?.(progressionFactor);
     sceneHelpers.updateAtlasVisibility?.(showAtlas);
     sceneHelpers.updateDifferenceWeave?.(showDifferenceWeave);
     sceneHelpers.updateEEGVisualization?.(eegVisualizationData, eegDisplaySettings);
     sceneHelpers.updateMPRPlane?.(mprPlane);

     // Add dependencies for all state variables that should trigger updates
  }, [
      progressionFactor,
      showAtlas,
      showDifferenceWeave,
      eegVisualizationData,
      eegDisplaySettings,
      mprPlane
      // Note: sceneHelpers itself is not a dependency as it's tied to the setup effect
  ]);

  return (
    // Use the module CSS class for styling
    <canvas ref={reactCanvas} className={styles.renderCanvas} touch-action="none" />
  );
});

export default ThreeDViewport; // Export the memoized component