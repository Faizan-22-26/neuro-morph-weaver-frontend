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
 * Processes EEG data (e.g., prepares time series, extracts features).
 * Backend determines max slices/times.
 * @param {File} eegFile - The EEG file object.
 * @returns {Promise<object>} - e.g., { success: true, maxSliceIndex: 150, maxTimeIndex: 75, message: "Processed" }
 */
export const processEegData = async (eegFile) => {
  const formData = new FormData();
  formData.append('eeg_file', eegFile);
  console.log(`API CALL: POST ${API_BASE_URL}/process-eeg with file ${eegFile.name}`);

  // *** REPLACE WITH ACTUAL FETCH ***
  // const response = await fetch(`${API_BASE_URL}/process-eeg`, {
  //   method: 'POST',
  //   body: formData,
  // });
  // return handleResponse(response);

  // *** PLACEHOLDER SIMULATION ***
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("API SIMULATION: processEegData successful.");
  return { success: true, maxSliceIndex: 150, maxTimeIndex: 75, message: "Simulated EEG Processing Complete" };
};


/**
 * Fetches the base slice image data for a given index and time.
 * @param {number} sliceIndex
 * @param {number} timeIndex
 * @returns {Promise<string>} - Promise resolving to image data URL or base64 string.
 */
export const fetchSliceData = async (sliceIndex, timeIndex) => {
    const params = new URLSearchParams({ slice: sliceIndex, time: timeIndex });
    console.log(`API CALL: GET ${API_BASE_URL}/slice-data?${params.toString()}`);

    // *** REPLACE WITH ACTUAL FETCH ***
    // const response = await fetch(`${API_BASE_URL}/slice-data?${params.toString()}`);
    // const blob = await response.blob(); // Assuming image data
    // if (!response.ok) throw new Error('Failed to fetch slice data');
    // return URL.createObjectURL(blob); // Convert blob to URL

    // *** PLACEHOLDER SIMULATION ***
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate fast fetch
    return `https://via.placeholder.com/512x512/CCCCCC/000000?text=Slice+${sliceIndex}+T=${timeIndex}`; // Grey placeholder
};

/**
 * Fetches the inference overlay data for a given index and time.
 * @param {number} sliceIndex
 * @param {number} timeIndex
 * @returns {Promise<string>} - Promise resolving to image data URL or base64 string for the overlay.
 */
export const fetchInferenceData = async (sliceIndex, timeIndex) => {
    const params = new URLSearchParams({ slice: sliceIndex, time: timeIndex });
    console.log(`API CALL: GET ${API_BASE_URL}/inference-data?${params.toString()}`);

    // *** REPLACE WITH ACTUAL FETCH ***
    // const response = await fetch(`${API_BASE_URL}/inference-data?${params.toString()}`);
    // const blob = await response.blob(); // Assuming image data
    // if (!response.ok) throw new Error('Failed to fetch inference data');
    // return URL.createObjectURL(blob); // Convert blob to URL

     // *** PLACEHOLDER SIMULATION ***
     await new Promise(resolve => setTimeout(resolve, 30)); // Simulate fast fetch
     // Simple color overlay placeholder
     const intensity = Math.abs(sliceIndex - 75) / 75; // Example: intensity varies with slice index
     const colorHex = intensity > 0.5 ? 'FF0000' : '00FF00'; // Red if far from center, Green if close
     const alphaHex = Math.round(intensity * 150).toString(16).padStart(2, '0'); // Opacity varies
     return `https://via.placeholder.com/512x512/${colorHex}${alphaHex}/FFFFFF?text=Infer+${sliceIndex}+T=${timeIndex}`;
};


// getRegionMetrics and getInitialData remain structurally similar,
// ensure they use the correct endpoints and handle responses.
export const getRegionMetrics = async (regionId) => {
   const params = new URLSearchParams({ region: regionId });
   console.log(`API CALL: GET ${API_BASE_URL}/metrics?${params.toString()}`);
   // *** REPLACE WITH ACTUAL FETCH ***
   // const response = await fetch(`${API_BASE_URL}/metrics?${params.toString()}`);
   // return handleResponse(response);

   // *** PLACEHOLDER SIMULATION ***
   await new Promise(resolve => setTimeout(resolve, 50));
   return {
      region: regionId,
      volume: parseFloat((Math.random() * 2000 + 500).toFixed(2)),
      thickness: parseFloat((Math.random() * 1.5 + 1.0).toFixed(3)),
      timestamp: Date.now(),
   };
};

// getInitialData placeholder remains useful if needed
export const getInitialData = async () => { /* ... keep placeholder or implement ... */ };