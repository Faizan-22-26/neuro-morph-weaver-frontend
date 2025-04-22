// src/store/appStore.js (Modified - Additions/Changes indicated)
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { generateMriFromEeg, getRegionMetrics } from '../services/api';

const defaultMprPlane = {
  id: 'axial',
  position: { x: 0, y: 0, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
  visible: true,
};

// Helper function (Example - replace with actual trajectory logic if needed)
const calculateLatentPosFromFactor = (factor, trajectoryStart = {x:0, y:0}, trajectoryEnd = {x:0.5, y:0.5}) => {
 return {
   x: trajectoryStart.x + factor * (trajectoryEnd.x - trajectoryStart.x),
   y: trajectoryStart.y + factor * (trajectoryEnd.y - trajectoryStart.y),
 };
};
const calculateFactorFromLatentPos = (position, trajectoryStart = {x:0, y:0}, trajectoryEnd = {x:0.5, y:0.5}) => {
  const trajVec = { x: trajectoryEnd.x - trajectoryStart.x, y: trajectoryEnd.y - trajectoryStart.y };
  const pointVec = { x: position.x - trajectoryStart.x, y: position.y - trajectoryStart.y };
  const trajLenSq = trajVec.x * trajVec.x + trajVec.y * trajVec.y;
  if (trajLenSq < 1e-9) return 0;
  const dotProduct = pointVec.x * trajVec.x + pointVec.y * trajVec.y;
  const factor = dotProduct / trajLenSq;
  return Math.max(0, Math.min(1, factor));
};


export const useAppStore = create(devtools(subscribeWithSelector((set, get) => ({
  // === STATE ===

  // --- Core Interaction State ---
  // progressionFactor: 0, // Keep or remove depending on final logic
  latentPosition: { x: 0, y: 0 }, // Keep if latent canvas interaction is desired

  // NEW: Spatial Slicing State
  spatialSliceIndex: 0,       // Current slice index (e.g., along Axial)
  maxSpatialSliceIndex: 100,    // Example: Max index for the current view/axis
  currentSliceData: null,     // Data for the 2D slice view (e.g., image URL, pixel data)
  currentInferenceData: null, // Data for the inference overlay

  // NEW: Time Slicing State
  timeIndex: 0,               // Current time point index
  maxTimeIndex: 50,           // Example: Max time index

  // --- 3D Scene State ---
  isModelLoading: true,
  modelLoadError: null,
  hoveredRegion: null,
  showAtlas: false,
  showDifferenceWeave: false, // Keep if difference highlighting is still desired

  // --- EEG State ---
  uploadedEegFileName: null,
  isProcessingEeg: false,
  eegProcessingError: null,
  eegVisualizationData: null, // This might now relate to a specific time point
  eegDisplaySettings: {
    visible: true,
    frequencyBand: 'alpha',
  },

  // --- MPR State ---
  mprPlane: defaultMprPlane, // May become less relevant if focusing on 2D view
  generatedMriSlice: null,   // This might be replaced by currentSliceData

  // --- Quantitative Data State ---
  isFetchingMetrics: false,
  quantitativeMetrics: null,
  metricFetchError: null,

  // === ACTIONS ===

  // --- Core Interaction Actions ---
  // Modify or replace setProgressionFactor if needed
  // setProgressionFactor: (factor) => { ... },

  setLatentPosition: (position) => {
    set({ latentPosition: position }, false, "setLatentPosition");
    // Optional: Update spatial/time index based on latent position
    // const newFactor = calculateFactorFromLatentPos(position);
    // const newSliceIndex = Math.round(newFactor * get().maxSpatialSliceIndex);
    // get().setSpatialSliceIndex(newSliceIndex);
  },

  // NEW: Spatial Slice Actions
  setSpatialSliceIndex: (index) => {
      const maxIndex = get().maxSpatialSliceIndex;
      const newIndex = Math.max(0, Math.min(maxIndex, Math.round(index))); // Clamp and ensure integer
      if (newIndex !== get().spatialSliceIndex) {
          set({ spatialSliceIndex: newIndex }, false, "setSpatialSliceIndex");
          // TODO: Trigger fetching/updating of currentSliceData and currentInferenceData
          // get().fetchSliceAndInferenceData(newIndex, get().timeIndex);
      }
  },

  // NEW: Time Slice Actions
  setTimeIndex: (index) => {
      const maxIndex = get().maxTimeIndex;
      const newIndex = Math.max(0, Math.min(maxIndex, Math.round(index))); // Clamp and ensure integer
      if (newIndex !== get().timeIndex) {
          set({ timeIndex: newIndex }, false, "setTimeIndex");
           // TODO: Trigger fetching/updating of currentSliceData and currentInferenceData
          // get().fetchSliceAndInferenceData(get().spatialSliceIndex, newIndex);
      }
  },

  // TODO: NEW Action to fetch slice/inference data
  fetchSliceAndInferenceData: async (sliceIndex, timeIndex) => {
      console.log(`TODO: Fetch slice/inference for Slice: ${sliceIndex}, Time: ${timeIndex}`);
      // set({ isFetchingSlice: true }); // Add loading state if needed
      try {
          // --- Replace with actual API call ---
          // const sliceResult = await fetchSliceData(sliceIndex, timeIndex);
          // const inferenceResult = await fetchInferenceData(sliceIndex, timeIndex);
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate fetch
          const sliceDataUrl = `https://via.placeholder.com/512x512.png?text=Slice+${sliceIndex}+Time+${timeIndex}`;
          const inferenceDataUrl = `https://via.placeholder.com/512x512/FF0000/FFFFFF/?text=Inference+${sliceIndex}+${timeIndex}`; // Example red overlay

          set({
              currentSliceData: sliceDataUrl, // Update with actual data
              currentInferenceData: inferenceDataUrl, // Update with actual data
              // isFetchingSlice: false,
          }, false, "fetchSliceAndInferenceData_Success");

      } catch (error) {
          console.error("Error fetching slice/inference data:", error);
          set({
              currentSliceData: null,
              currentInferenceData: null,
              // isFetchingSlice: false,
              // sliceFetchError: error.message // Add error state if needed
          }, false, "fetchSliceAndInferenceData_Error");
      }
  },


  // --- 3D Scene Actions ---
  setModelLoadingStatus: (isLoading, error = null) => set({ isModelLoading: isLoading, modelLoadError: error }, false, "setModelLoadingStatus"),
  setHoveredRegion: (region) => {
    if (get().hoveredRegion?.id !== region?.id) {
        set({ hoveredRegion: region }, false, "setHoveredRegion");
        if (region) {
            get().fetchQuantitativeMetrics(region.id); // Fetch metrics based on region ID
        } else {
            set({ quantitativeMetrics: null, metricFetchError: null });
        }
    }
  },
  toggleAtlas: () => set((state) => ({ showAtlas: !state.showAtlas }), false, "toggleAtlas"),
  toggleDifferenceWeave: () => set((state) => ({ showDifferenceWeave: !state.showDifferenceWeave }), false, "toggleDifferenceWeave"),

  // --- EEG Actions ---
  // This might need adjustment - does EEG upload trigger slice generation for *all* time points?
  // Or is it just loading baseline data? Let's assume it loads baseline and maybe triggers first slice fetch.
  uploadEegFile: async (file) => {
      if (!file) return;
      set({ isProcessingEeg: true, eegProcessingError: null, uploadedEegFileName: file.name, currentSliceData: null, currentInferenceData: null }, false, "uploadEegFile_Start");
      try {
          // Simulate processing or call an API endpoint that prepares the data series
          // const result = await processEegData(file); // Example API call
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate
          console.log("API SIMULATION: EEG Processing successful.");

          // Set max slice/time indices based on processed data (example values)
          const maxSlice = 150;
          const maxTime = 75;
          set({
              isProcessingEeg: false,
              maxSpatialSliceIndex: maxSlice,
              maxTimeIndex: maxTime,
              // eegVisualizationData: result.eegVizData // If applicable
          }, false, "uploadEegFile_Success");

          // Trigger fetching the initial slice (e.g., middle slice at time 0)
          get().setSpatialSliceIndex(Math.floor(maxSlice / 2));
          get().setTimeIndex(0);
          get().fetchSliceAndInferenceData(get().spatialSliceIndex, get().timeIndex);


      } catch (error) {
          console.error("EEG Processing API Error:", error);
          set({ isProcessingEeg: false, eegProcessingError: error.message || 'Unknown error occurred' }, false, "uploadEegFile_Error");
      }
  },
  clearEegData: () => set({
      uploadedEegFileName: null, eegProcessingError: null,
      currentSliceData: null, currentInferenceData: null,
      spatialSliceIndex: 0, maxSpatialSliceIndex: 100, // Reset defaults
      timeIndex: 0, maxTimeIndex: 50,                 // Reset defaults
      eegVisualizationData: null, quantitativeMetrics: null,
  }, false, "clearEegData"),
  updateEegDisplaySetting: (setting, value) => set((state) => ({
      eegDisplaySettings: { ...state.eegDisplaySettings, [setting]: value }
  }), false, "updateEegDisplaySetting"),


  // --- MPR Actions --- (Potentially less used now)
  setMprPlanePosition: (position) => set((state) => ({ mprPlane: { ...state.mprPlane, position } }), false, "setMprPlanePosition"),
  setMprPlaneNormal: (normal) => set((state) => ({ mprPlane: { ...state.mprPlane, normal } }), false, "setMprPlaneNormal"),
  setMprPlaneVisibility: (visible) => set((state) => ({ mprPlane: { ...state.mprPlane, visible } }), false, "setMprPlaneVisibility"),

  // --- Quantitative Data Actions ---
  // Fetch metrics based on region and *current slice/time* or progression factor? Adjust as needed.
  // Let's assume it's still based on region ID primarily, maybe factor/indices influence *which* metrics are available.
  fetchQuantitativeMetrics: async (regionId) => {
      if (!regionId) return;
      const currentSlice = get().spatialSliceIndex; // Example dependency
      const currentTime = get().timeIndex;       // Example dependency
      set({ isFetchingMetrics: true, metricFetchError: null }, false, "fetchMetrics_Start");
      try {
          // API might need slice/time context now
          // const metrics = await getRegionMetrics(regionId, currentSlice, currentTime);
          // Using placeholder API which only takes region ID for now:
          const metrics = await getRegionMetrics(regionId, get().progressionFactor); // Using old factor for placeholder
          console.log("API Result (Metrics):", metrics);

           // Check if the hover hasn't changed while fetching
          if(get().hoveredRegion?.id === regionId) {
            set({ isFetchingMetrics: false, quantitativeMetrics: metrics }, false, "fetchMetrics_Success");
          } else {
             set({ isFetchingMetrics: false }, false, "fetchMetrics_Stale"); // Hover changed, discard result
          }
      } catch (error) {
          console.error("Metric Fetching API Error:", error);
           // Check if the hover hasn't changed while fetching
          if(get().hoveredRegion?.id === regionId) {
            set({ isFetchingMetrics: false, quantitativeMetrics: null, metricFetchError: error.message || 'Unknown error occurred' }, false, "fetchMetrics_Error");
          } else {
             set({ isFetchingMetrics: false }, false, "fetchMetrics_StaleError");
          }
      }
  },

}))), { name: "NeuroMorphWeaverStore_V2" }); // Renamed store for clarity

// --- Hooks and Subscriptions remain similar ---
export const useSpatialSliceIndex = () => useAppStore((state) => state.spatialSliceIndex);
export const useTimeIndex = () => useAppStore((state) => state.timeIndex);

// Example subscription remains valid if needed
// useAppStore.subscribe( ... );