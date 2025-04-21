import { create } from 'zustand';
import { devtools } from 'zustand/middleware'; // Optional: For Redux DevTools integration
import { generateMriFromEeg, getRegionMetrics } from '../services/api'; // Import API functions
import { subscribeWithSelector } from 'zustand/middleware' // Allows subscribing to specific slices


// Decide on the structure for complex state like MPR plane or EEG data
// Example: Define a default plane state
const defaultMprPlane = {
  id: 'axial', // 'axial', 'sagittal', 'coronal', 'oblique'
  position: { x: 0, y: 0, z: 0 }, // Center position
  normal: { x: 0, y: 0, z: 1 }, // Normal vector defining orientation
  visible: true,
};

// Use devtools for easier debugging in browser, subscribe for fine-grained reactions
export const useAppStore = create(devtools(subscribeWithSelector((set, get) => ({
  // === STATE ===

  // --- Core Interaction State ---
  progressionFactor: 0,       // Range 0 to 1, drives morphing
  latentPosition: { x: 0, y: 0 }, // 2D position on the latent canvas (might drive progressionFactor)
  timePoint: 0,               // If dealing with time-series data directly

  // --- 3D Scene State ---
  isModelLoading: true,
  modelLoadError: null,
  hoveredRegion: null,        // { id: string, name: string } | null
  showAtlas: false,
  showDifferenceWeave: false,

  // --- EEG State ---
  uploadedEegFileName: null,
  isProcessingEeg: false,
  eegProcessingError: null,
  eegVisualizationData: null, // Structure TBD: could be texture data, vertex attributes, etc.
  eegDisplaySettings: {
    visible: true,
    frequencyBand: 'alpha', // Example setting
    // other settings: colormap, intensity scale...
  },

  // --- MPR State ---
  mprPlane: defaultMprPlane,
  generatedMriSlice: null,    // URL, base64 data, or texture data for the generated slice
  templateMriSlice: null,     // Data for the corresponding slice from the template (if available)
  isMprPlaneInteractive: true, // Allow user interaction with the plane

  // --- Quantitative Data State ---
  isFetchingMetrics: false,
  quantitativeMetrics: null, // { volume: number, thickness: number, ... } | null
  metricFetchError: null,

  // === ACTIONS ===

  // --- Core Interaction Actions ---
  setProgressionFactor: (factor) => {
    const clampedFactor = Math.max(0, Math.min(1, factor));
    set({ progressionFactor: clampedFactor }, false, "setProgressionFactor");
    // Optional: If latent canvas directly controls progression, update it too
    // const newLatentPos = calculateLatentPosFromFactor(clampedFactor);
    // set({ latentPosition: newLatentPos });
  },
  setLatentPosition: (position) => {
    set({ latentPosition: position }, false, "setLatentPosition");
    // Optional: Update progression factor based on position along a trajectory
    // const newFactor = calculateFactorFromLatentPos(position);
    // set({ progressionFactor: newFactor });
  },
  setTimePoint: (time) => set({ timePoint: time }, false, "setTimePoint"),

  // --- 3D Scene Actions ---
  setModelLoadingStatus: (isLoading, error = null) => set({ isModelLoading: isLoading, modelLoadError: error }, false, "setModelLoadingStatus"),
  setHoveredRegion: (region) => {
    // Only update if the region actually changed to prevent excessive updates
    if (get().hoveredRegion?.id !== region?.id) {
        set({ hoveredRegion: region }, false, "setHoveredRegion");
        // Trigger metric fetching when hover changes (if a region is hovered)
        if (region) {
            get().fetchQuantitativeMetrics(region.id);
        } else {
            // Clear metrics when hovering off
            set({ quantitativeMetrics: null, metricFetchError: null });
        }
    }
  },
  toggleAtlas: () => set((state) => ({ showAtlas: !state.showAtlas }), false, "toggleAtlas"),
  toggleDifferenceWeave: () => set((state) => ({ showDifferenceWeave: !state.showDifferenceWeave }), false, "toggleDifferenceWeave"),

  // --- EEG Actions ---
  uploadEegFile: async (file) => {
    if (!file) return;
    set({ isProcessingEeg: true, eegProcessingError: null, uploadedEegFileName: file.name, generatedMriSlice: null }, false, "uploadEegFile_Start");
    try {
      const result = await generateMriFromEeg(file); // Call API service
      console.log("API Result (EEG Upload):", result);
      // Process result - Adapt based on actual API response
      // Example: Assuming API returns URL for the generated slice
      set({ isProcessingEeg: false, generatedMriSlice: result.mriDataUrl || null }, false, "uploadEegFile_Success");
      // You might also receive data needed for the EEG visualization itself here
      // set({ eegVisualizationData: result.eegVizData });
    } catch (error) {
      console.error("EEG Processing API Error:", error);
      set({ isProcessingEeg: false, eegProcessingError: error.message || 'Unknown error occurred' }, false, "uploadEegFile_Error");
    }
  },
  clearEegData: () => set({ uploadedEegFileName: null, eegProcessingError: null, generatedMriSlice: null, eegVisualizationData: null }, false, "clearEegData"),
  updateEegDisplaySetting: (setting, value) => set((state) => ({
    eegDisplaySettings: { ...state.eegDisplaySettings, [setting]: value }
  }), false, "updateEegDisplaySetting"),


  // --- MPR Actions ---
  setMprPlanePosition: (position) => set((state) => ({ mprPlane: { ...state.mprPlane, position } }), false, "setMprPlanePosition"),
  setMprPlaneNormal: (normal) => set((state) => ({ mprPlane: { ...state.mprPlane, normal } }), false, "setMprPlaneNormal"),
  setMprPlaneVisibility: (visible) => set((state) => ({ mprPlane: { ...state.mprPlane, visible } }), false, "setMprPlaneVisibility"),
  // Action to potentially update slice display based on plane changes might be needed,
  // possibly triggered by subscriptions or within the MPRPanel component itself.

  // --- Quantitative Data Actions ---
  fetchQuantitativeMetrics: async (regionId) => {
    if (!regionId) return;
    const currentProgression = get().progressionFactor; // Fetch for current state
    set({ isFetchingMetrics: true, metricFetchError: null }, false, "fetchMetrics_Start");
    try {
      const metrics = await getRegionMetrics(regionId, currentProgression); // Call API service
      console.log("API Result (Metrics):", metrics);
      set({ isFetchingMetrics: false, quantitativeMetrics: metrics }, false, "fetchMetrics_Success");
    } catch (error) {
      console.error("Metric Fetching API Error:", error);
      set({ isFetchingMetrics: false, quantitativeMetrics: null, metricFetchError: error.message || 'Unknown error occurred' }, false, "fetchMetrics_Error");
    }
  },

}))), { name: "NeuroMorphWeaverStore" }); // Name for DevTools

// Example selector hook for performance
export const useProgressionFactor = () => useAppStore((state) => state.progressionFactor);

// Example subscription: Log whenever the hovered region changes
// useAppStore.subscribe(
//   (state) => state.hoveredRegion,
//   (hoveredRegion, previousHoveredRegion) => {
//     if (hoveredRegion?.id !== previousHoveredRegion?.id) {
//       console.log('Hovered region changed:', hoveredRegion);
//     }
//   }
// );