import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js'; // Import the Plotly component
import { useAppStore } from '../../store/appStore';
import styles from './LatentCanvas.module.css';

// Placeholder: Function to calculate progression factor based on position along trajectory
// This needs to be implemented based on how your trajectory is defined.
const calculateFactorFromLatentPos = (position, trajectoryStart, trajectoryEnd) => {
  // Example: Simple linear projection onto the trajectory vector
  if (!trajectoryStart || !trajectoryEnd) return 0;
  const trajVec = { x: trajectoryEnd.x - trajectoryStart.x, y: trajectoryEnd.y - trajectoryStart.y };
  const pointVec = { x: position.x - trajectoryStart.x, y: position.y - trajectoryStart.y };
  const trajLenSq = trajVec.x * trajVec.x + trajVec.y * trajVec.y;
  if (trajLenSq < 1e-6) return 0; // Avoid division by zero

  const dotProduct = pointVec.x * trajVec.x + pointVec.y * trajVec.y;
  const factor = dotProduct / trajLenSq;
  return Math.max(0, Math.min(1, factor)); // Clamp between 0 and 1
};

// Placeholder: Function to calculate latent position from progression factor
const calculateLatentPosFromFactor = (factor, trajectoryStart, trajectoryEnd) => {
   if (!trajectoryStart || !trajectoryEnd) return { x: 0, y: 0 };
   return {
     x: trajectoryStart.x + factor * (trajectoryEnd.x - trajectoryStart.x),
     y: trajectoryStart.y + factor * (trajectoryEnd.y - trajectoryStart.y),
   };
};


const LatentCanvas = () => {
  // Get necessary state and actions
  const {
    latentPosition, setLatentPosition,
    progressionFactor, setProgressionFactor,
    // Add state here for subject data points, trajectory definitions etc.
  } = useAppStore(state => ({
    latentPosition: state.latentPosition,
    setLatentPosition: state.setLatentPosition,
    progressionFactor: state.progressionFactor,
    setProgressionFactor: state.setProgressionFactor,
    // subjects: state.subjects, // Example: load subject positions
    // trajectory: state.trajectory, // Example: load trajectory points
  }));

  // --- Placeholder Data (Replace with data loaded from store/API) ---
  const subjects = [
    { x: 0.1, y: 0.2, name: 'Subject HC-01', group: 'HC' },
    { x: 0.8, y: 0.7, name: 'Subject AD-01', group: 'AD' },
    { x: 0.7, y: 0.9, name: 'Subject AD-02', group: 'AD' },
    // ... more subjects
  ];
  const trajectory = {
    start: { x: 0.1, y: 0.2 }, // Example HC centroid
    end: { x: 0.75, y: 0.8 }, // Example AD centroid
  };
  // --- End Placeholder Data ---


  // Local state to manage the dragged point visually before updating store
  const [draggedPoint, setDraggedPoint] = useState(latentPosition);

  // Update local dragged point when global latentPosition changes (e.g., from slider)
  useEffect(() => {
      // Only update if not currently dragging (to avoid loop)
      // Add a local 'isDragging' state if needed for more complex logic
      setDraggedPoint(calculateLatentPosFromFactor(progressionFactor, trajectory.start, trajectory.end));
  }, [progressionFactor, trajectory]);

  // Plotly layout configuration
  const layout = {
    title: 'Latent Space Projection',
    xaxis: { title: 'Latent Dim 1', range: [0, 1] }, // Adjust ranges as needed
    yaxis: { title: 'Latent Dim 2', range: [0, 1] },
    margin: { l: 40, r: 20, b: 40, t: 40 }, // Adjust margins
    paper_bgcolor: 'rgba(0,0,0,0)', // Transparent background
    plot_bgcolor: 'rgba(0,0,0,0.2)',
    font: { color: 'var(--text-secondary)' },
    showlegend: true,
    legend: { x: 1, y: 1, bgcolor: 'rgba(0,0,0,0.5)' },
    hovermode: 'closest',
    // Make plot responsive
    autosize: true,
  };

  // Plotly data configuration
  const plotData = [
    // Subject points (example: one trace per group)
    {
      x: subjects.filter(s => s.group === 'HC').map(s => s.x),
      y: subjects.filter(s => s.group === 'HC').map(s => s.y),
      mode: 'markers',
      type: 'scatter',
      name: 'HC Subjects',
      marker: { color: 'var(--success-color)', size: 8 },
      text: subjects.filter(s => s.group === 'HC').map(s => s.name), // Show name on hover
      hoverinfo: 'text',
    },
    {
      x: subjects.filter(s => s.group === 'AD').map(s => s.x),
      y: subjects.filter(s => s.group === 'AD').map(s => s.y),
      mode: 'markers',
      type: 'scatter',
      name: 'AD Subjects',
      marker: { color: 'var(--error-color)', size: 8 },
      text: subjects.filter(s => s.group === 'AD').map(s => s.name),
      hoverinfo: 'text',
    },
    // Trajectory line
    {
      x: [trajectory.start.x, trajectory.end.x],
      y: [trajectory.start.y, trajectory.end.y],
      mode: 'lines',
      type: 'scatter',
      name: 'HC->AD Trajectory',
      line: { color: 'var(--accent-secondary)', width: 2, dash: 'dash' },
      hoverinfo: 'none',
    },
    // Interactive handle/point showing current progression
    {
      x: [draggedPoint.x],
      y: [draggedPoint.y],
      mode: 'markers',
      type: 'scatter',
      name: 'Current State',
      marker: {
        color: 'var(--accent-primary)',
        size: 14,
        symbol: 'cross', // Use a distinct marker
        line: { color: 'white', width: 1 },
      },
      hoverinfo: 'text',
      text: [`Progression: ${progressionFactor.toFixed(2)}`],
    },
  ];


  // Handle Plotly click/drag events (simplified example)
  // Note: Plotly's event handling for direct point dragging can be complex.
  // This example uses 'plotly_click' to reposition the handle along the trajectory.
  // A more robust solution might involve 'plotly_relayout' or custom shapes.
  const handlePlotInteraction = (eventData) => {
    if (eventData?.points?.length > 0) {
        // Get clicked point coordinates
        const clickedPoint = { x: eventData.points[0].x, y: eventData.points[0].y };

        // Calculate the progression factor based on projecting the click onto the trajectory
        const newFactor = calculateFactorFromLatentPos(clickedPoint, trajectory.start, trajectory.end);

        // Update the global progression factor state
        setProgressionFactor(newFactor);

        // Update local state for immediate visual feedback on the plot
        // setDraggedPoint(calculateLatentPosFromFactor(newFactor, trajectory.start, trajectory.end));
        // ^ This is now handled by the useEffect listening to progressionFactor
    }
  };


  return (
    <div className={`${styles.latentCanvasPanel} panel`}>
      <h3 className={styles.title}>Latent Space & Progression</h3>
      <div className={styles.plotContainer}>
         {/* Use Plotly component */}
         <Plot
           data={plotData}
           layout={layout}
           onClick={handlePlotInteraction} // Use click event for simplicity
           // onRelayout={handlePlotDrag} // More complex drag handling
           config={{
             displayModeBar: false, // Hide Plotly mode bar
             // editable: true // Might allow dragging, needs specific setup
           }}
           useResizeHandler={true} // Let Plotly handle resize
           style={{ width: '100%', height: '100%' }} // Ensure plot fills container
         />
      </div>
       <p className={styles.note}>
           Click on the plot to set progression state along the trajectory.
           {/* (Dragging the crosshair might be added later). */}
       </p>
    </div>
  );
};

export default LatentCanvas;