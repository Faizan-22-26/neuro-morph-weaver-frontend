// Base URL of your Flask backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log(`API Base URL: ${API_BASE_URL}`);


/**
 * Helper function to handle fetch responses and errors.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<any>} - Parsed JSON data.
 * @throws {Error} - Throws an error with message if response is not ok.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      // Try to parse error message from backend response body
      errorData = await response.json();
    } catch (e) {
      // Fallback if response body is not JSON or empty
      errorData = { message: `HTTP error ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
  }
  // Handle cases where response might be empty (e.g., 204 No Content)
  const contentType = response.headers.get("content-type");
   if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json(); // Parse JSON if content type indicates it
   } else {
      // Handle other types or empty body appropriately
      // For example, return text or blob, or null if empty
      return response.text(); // Or response.blob(), etc.
   }
};

/**
 * Uploads an EEG file to the backend for processing.
 * @param {File} eegFile - The EEG file object.
 * @returns {Promise<object>} - Promise resolving to the backend response (e.g., { mriDataUrl: string, eegVizData?: any }).
 */
export const generateMriFromEeg = async (eegFile) => {
  const formData = new FormData();
  formData.append('eeg_file', eegFile); // Ensure 'eeg_file' matches Flask backend expectation

  console.log(`API CALL: POST ${API_BASE_URL}/generate-mri with file ${eegFile.name}`);

  // *** REPLACE WITH ACTUAL FETCH ***
  // const response = await fetch(`${API_BASE_URL}/generate-mri`, {
  //   method: 'POST',
  //   body: formData,
  //   // Add headers if needed, e.g., 'Accept': 'application/json'
  // });
  // return handleResponse(response);

  // *** PLACEHOLDER SIMULATION ***
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // Simulate network delay
  // Simulate potential error
  // if (Math.random() > 0.8) {
  //   throw new Error("Simulated backend processing error.");
  // }
  console.log("API SIMULATION: generateMriFromEeg successful.");
  // Return dummy data structure matching expected success response
  return { mriDataUrl: `https://via.placeholder.com/256x256.png?text=Generated+MRI+Slice+for+${eegFile.name.substring(0,10)}`, eegVizData: { message: "dummy EEG viz data" } };
};

/**
 * Fetches quantitative metrics for a given brain region and progression factor.
 * @param {string} regionId - The identifier of the brain region (e.g., 'hippocampus_L').
 * @param {number} progressionFactor - The current progression state (0 to 1).
 * @returns {Promise<object>} - Promise resolving to the metrics object (e.g., { volume: number, thickness: number }).
 */
export const getRegionMetrics = async (regionId, progressionFactor) => {
   const params = new URLSearchParams({
      region: regionId,
      progression: progressionFactor.toFixed(4), // Send with reasonable precision
   });
   console.log(`API CALL: GET ${API_BASE_URL}/metrics?${params.toString()}`);

   // *** REPLACE WITH ACTUAL FETCH ***
   // const response = await fetch(`${API_BASE_URL}/metrics?${params.toString()}`);
   // return handleResponse(response);


   // *** PLACEHOLDER SIMULATION ***
   await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200)); // Simulate faster fetch
   // Simulate error
   // if (regionId === 'error_region') {
   //   throw new Error(`Simulated metrics fetch error for ${regionId}`);
   // }
   console.log("API SIMULATION: getRegionMetrics successful for", regionId);
   // Return dummy metrics varying with progression
   return {
      region: regionId,
      progression: progressionFactor,
      volume: parseFloat(((1 - progressionFactor) * 2000 + Math.random() * 100).toFixed(2)),
      thickness: parseFloat(((1 - progressionFactor) * 2.5 + Math.random() * 0.2).toFixed(3)),
      timestamp: Date.now(),
   };
};

/**
 * Placeholder to fetch initial application data if needed (e.g., list of subjects, default atlas).
 */
export const getInitialData = async () => {
   console.log(`API CALL: GET ${API_BASE_URL}/initial-data (Placeholder)`);
   // const response = await fetch(`${API_BASE_URL}/initial-data`);
   // return handleResponse(response);

   // *** PLACEHOLDER SIMULATION ***
   await new Promise(resolve => setTimeout(resolve, 300));
   return { defaultAtlas: 'Desikan-Killiany', subjects: [{id: 'sub-01'}, {id: 'sub-02'}] };
};

// Add other API functions as needed (e.g., fetch full EEG data, save/load state).