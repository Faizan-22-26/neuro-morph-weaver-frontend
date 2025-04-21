import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    SceneLoader,
    StandardMaterial,
    Color3,
    Mesh,
    ShaderMaterial,
    PointerEventTypes,
    Texture,
    CubeTexture,
    Nullable, // For type hints
    PickingInfo // For type hints
  } from '@babylonjs/core';
  // Import necessary loaders
  import '@babylonjs/loaders/glTF';
  // Optional: For debugging
  // import "@babylonjs/inspector";
  
  // Shader source placeholders (replace with actual imports or strings)
  const morphVertexShader = `
    // Placeholder: See detailed shader in Part 4
    precision highp float;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    attribute vec3 displacementVector; // Crucial for morphing
    uniform mat4 worldViewProjection;
    uniform float progressionFactor;
    varying vec2 vUV;
    varying vec3 vNormal;
    varying float vDisplacementMag;
    void main(void) {
        vec3 morphedPosition = position + (displacementVector * progressionFactor);
        vDisplacementMag = length(displacementVector * progressionFactor);
        gl_Position = worldViewProjection * vec4(morphedPosition, 1.0);
        vNormal = normalize(normal); // Simplistic normal update
        vUV = uv;
    }`;
  const morphFragmentShader = `
    // Placeholder: See detailed shader in Part 4
    precision highp float;
    varying vec2 vUV;
    varying vec3 vNormal;
    varying float vDisplacementMag;
    uniform sampler2D baseTexture; // Placeholder texture
    uniform vec3 baseColor; // Fallback color
    uniform float showDifferenceWeave;
    uniform vec3 weaveColor;
    // Add uniforms for EEG data/texture/settings
    void main(void) {
        vec3 color = texture2D(baseTexture, vUV).rgb; // Use texture if available
        // vec3 color = baseColor; // Use fallback color otherwise
  
        // Placeholder PBR lighting can be added here
        float diffuse = max(0.0, dot(normalize(vNormal), vec3(0,1,0))); // Simple top light
        color *= diffuse;
  
        // Weave effect
        if (showDifferenceWeave > 0.5) {
             float weaveIntensity = smoothstep(0.01, 0.5, vDisplacementMag);
             color = mix(color, weaveColor, weaveIntensity * 0.8);
        }
        // EEG effect placeholder
        // color = mix(color, eegColor, eegIntensity);
  
        gl_FragColor = vec4(color, 1.0);
    }`;
  
  // --- Atlas Data Structure (Placeholder) ---
  // In a real app, load this from a file or API
  // Maps mesh vertex indices (or potentially face indices/barycentric coords) to region info
  const atlasMapping = {
      // Example: vertexIndex: { id: 'region_id', name: 'Region Name' }
      100: { id: 'hip_l', name: 'Left Hippocampus' },
      500: { id: 'pre_c', name: 'Precentral Gyrus' },
      // ... many more entries
  };
  
  
  /**
   * Sets up the Babylon.js engine, scene, loads assets, and returns update helpers.
   * @param {HTMLCanvasElement} canvas - The canvas element to render on.
   * @param {(loading: boolean, error?: string | null) => void} setModelLoadingStatus - Callback to update React state.
   * @param {(region: { id: string, name: string } | null) => void} setHoveredRegion - Callback to update React state.
   * @returns {Promise<{engine: Engine, scene: Scene, sceneHelpers: object}>}
   */
  export const setupBabylonScene = async (canvas, setModelLoadingStatus, setHoveredRegion) => {
    setModelLoadingStatus(true); // Signal start of loading
  
    // --- Engine and Scene ---
    const engine = new Engine(canvas, true, {
       preserveDrawingBuffer: true, // Needed for screenshots, potentially impacts performance
       stencil: true, // Often needed for advanced effects/selection
       antialias: true // Enable MSAA
    }, true); // Use Hardware Scaling
    const scene = new Scene(engine);
    // scene.clearColor = new Color4(0.1, 0.11, 0.12, 1); // Set background color (matches CSS dark theme)
  
    // --- Camera ---
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 200, Vector3.Zero(), scene); // Adjust radius based on model size
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 50;
    camera.minZ = 1; // Adjust near clip plane based on model size
    camera.maxZ = 1000; // Adjust far clip plane
    camera.lowerRadiusLimit = 50; // Prevent zooming too close
    camera.upperRadiusLimit = 500; // Prevent zooming too far
  
    // --- Lighting ---
    // Use Image-Based Lighting (IBL) for better realism if possible
    // Example using a simple Hemispheric light as fallback
    const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    light.groundColor = new Color3(0.4, 0.4, 0.5); // Subtle ground bounce color
  
    // Optional: Add environment texture for reflections/IBL
    // const environmentTex = CubeTexture.CreateFromPrefilteredData("path/to/environment.env", scene);
    // scene.environmentTexture = environmentTex;
  
    // --- Load Brain Model ---
    let brainMesh = null;
    let morphMaterial = null;
    try {
      console.log("Attempting to load GLTF model...");
      const result = await SceneLoader.ImportMeshAsync(
          "", // Mesh names (empty to load all)
          "/models/", // Root URL
          "placeholder_brain.glb", // Scene file name (ensure this exists!)
          scene,
          (event) => {
              // Progress callback (optional)
              const percent = event.lengthComputable ? (event.loaded * 100 / event.total).toFixed(0) : 'N/A';
              console.log(`Model loading progress: ${percent}%`);
          }
      );
  
      if (result.meshes.length === 0) {
         throw new Error("No meshes found in the loaded GLTF file.");
      }
  
      brainMesh = result.meshes.find(m => m.getTotalVertices() > 0) || result.meshes[0]; // Find the main mesh
      brainMesh.position = Vector3.Zero(); // Center the mesh if needed
      console.log(`Brain model loaded: ${brainMesh.name}, Vertices: ${brainMesh.getTotalVertices()}`);
  
      // --- Material Setup ---
      // Replace default material with ShaderMaterial for morphing etc.
      morphMaterial = new ShaderMaterial("morphShader", scene, {
          // Provide shader path or source code object
          vertexSource: morphVertexShader,
          fragmentSource: morphFragmentShader,
      }, {
          attributes: ["position", "normal", "uv", "displacementVector"], // CRUCIAL: Ensure displacementVector attribute exists on your GLTF/mesh
          uniforms: [
              "worldViewProjection", "world", // Standard matrices
              "progressionFactor", // Custom uniform for morphing
              "showDifferenceWeave", "weaveColor", // Custom uniforms for effects
              "time", // For potential animations
              "baseTexture", "baseColor" // For base appearance
              // Add uniforms for EEG data/texture references/settings
          ],
          defines: [] // Optional: #define directives for conditional shader logic
      });
  
       // Check if the loaded mesh has the required attributes
      if (!brainMesh.isVerticesDataPresent("displacementVector")) {
          console.warn(`Mesh '${brainMesh.name}' is missing the 'displacementVector' vertex attribute required for morphing. Morphing may not work.`);
          // Add placeholder data if needed for testing, but ideally, it comes from the asset pipeline
           // brainMesh.setVerticesData("displacementVector", new Float32Array(brainMesh.getTotalVertices() * 3).fill(0));
      }
       if (!brainMesh.isVerticesDataPresent("uv")) {
          console.warn(`Mesh '${brainMesh.name}' is missing 'uv' vertex attribute. Texturing might not work correctly.`);
      }
  
  
      // Apply the shader material
      brainMesh.material = morphMaterial;
  
      // Set initial uniform values
      morphMaterial.setFloat("progressionFactor", 0.0);
      morphMaterial.setFloat("showDifferenceWeave", 0.0); // Off by default
      morphMaterial.setColor3("weaveColor", new Color3(0.8, 0.2, 0.2)); // Example weave color (reddish)
      morphMaterial.setColor3("baseColor", new Color3(0.8, 0.8, 0.8)); // Fallback base color if no texture
  
      // Load base texture (optional)
      // const baseTex = new Texture("/path/to/brain_texture.png", scene);
      // morphMaterial.setTexture("baseTexture", baseTex);
  
      // Load EEG Data Texture (placeholder - update this in updateEEGVisualization)
      // const eegTex = new Texture(...) // Create/load EEG data texture
      // morphMaterial.setTexture("eegTexture", eegTex);
  
  
      setModelLoadingStatus(false); // Signal successful loading
  
    } catch (error) {
      console.error("Error loading brain model:", error);
      setModelLoadingStatus(false, error.message || "Failed to load model.");
      // Don't proceed if model loading failed catastrophically
      throw error; // Re-throw to be caught by the component's effect
    }
  
    // --- Interaction: Hover/Picking ---
    let lastHoveredVertexIndex = -1;
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === brainMesh); // Only pick the brain mesh
  
            if (pickResult && pickResult.hit && pickResult.faceId !== undefined) {
                // Get vertex indices of the picked face
                const indices = brainMesh.getIndices();
                const vertex1_idx = indices[pickResult.faceId * 3];
                // const vertex2_idx = indices[pickResult.faceId * 3 + 1];
                // const vertex3_idx = indices[pickResult.faceId * 3 + 2];
  
                // Simplistic: Use the first vertex index of the face for lookup
                const currentVertexIndex = vertex1_idx;
  
                if (currentVertexIndex !== lastHoveredVertexIndex) {
                    const regionInfo = atlasMapping[currentVertexIndex]; // Lookup in your atlas data
                    if (regionInfo) {
                        // console.log("Hovering over region:", regionInfo.name, "Vertex:", currentVertexIndex);
                        setHoveredRegion(regionInfo); // Update global state
                    } else {
                        // console.log("Hovering over unmapped area. Vertex:", currentVertexIndex);
                        setHoveredRegion(null); // Clear if no region found
                    }
                    lastHoveredVertexIndex = currentVertexIndex;
                }
            } else {
                // Pointer is not over the mesh or no hit
                if (lastHoveredVertexIndex !== -1) {
                    setHoveredRegion(null); // Clear hover state
                    lastHoveredVertexIndex = -1;
                }
            }
        }
    });
  
    // --- MPR Plane Visualization (Placeholder) ---
    let mprPlaneMesh = null;
    const createOrUpdateMPRPlaneMesh = (planeState) => {
        if (!mprPlaneMesh) {
            // Create a simple plane mesh to visualize the MPR plane
            mprPlaneMesh = MeshBuilder.CreatePlane("mprPlaneViz", { size: 200 }, scene); // Adjust size
            const mat = new StandardMaterial("mprPlaneMat", scene);
            mat.diffuseColor = new Color3(0.2, 0.6, 0.9); // Example color (blueish)
            mat.alpha = 0.3; // Make it transparent
            mprPlaneMesh.material = mat;
        }
        mprPlaneMesh.position = new Vector3(planeState.position.x, planeState.position.y, planeState.position.z);
        // Align plane normal (more complex: might need lookAt or rotationFromNormal)
        // Simple alignment assumes normal is primarily along one axis for now
        mprPlaneMesh.lookAt(mprPlaneMesh.position.add(new Vector3(planeState.normal.x, planeState.normal.y, planeState.normal.z)));
        mprPlaneMesh.isVisible = planeState.visible;
    };
  
    // --- Atlas Overlay Visualization (Placeholder) ---
    let atlasOverlayMesh = null;
    const createOrUpdateAtlasOverlay = (show) => {
        if (show && !atlasOverlayMesh) {
           console.log("Creating atlas overlay (placeholder)...");
           // Logic to load/create atlas boundary lines or meshes
           // Example: Create wireframe clone
           // atlasOverlayMesh = brainMesh.clone("atlasOverlay");
           // const wireframeMat = new StandardMaterial("wireframeMat", scene);
           // wireframeMat.wireframe = true;
           // wireframeMat.emissiveColor = Color3.Yellow();
           // atlasOverlayMesh.material = wireframeMat;
        }
        if (atlasOverlayMesh) {
            atlasOverlayMesh.isVisible = show;
        }
    };
  
    // --- Optional: Inspector ---
    // For debugging: Press CTRL+SHIFT+ALT+I to toggle
    // scene.debugLayer.show({ embedMode: true });
  
    // =============================================
    // === Helper Functions for React Updates ===
    // =============================================
    const sceneHelpers = {
        updateMorph: (progressionFactor) => {
            if (morphMaterial) {
                morphMaterial.setFloat("progressionFactor", progressionFactor);
            }
        },
        updateAtlasVisibility: (show) => {
           // createOrUpdateAtlasOverlay(show); // Implement actual atlas viz logic
           console.log("BabylonManager: Update Atlas Visibility (Placeholder):", show);
        },
        updateDifferenceWeave: (show) => {
             if (morphMaterial) {
                morphMaterial.setFloat("showDifferenceWeave", show ? 1.0 : 0.0);
             }
        },
        updateEEGVisualization: (data, settings) => {
            if (!morphMaterial || !settings.visible) {
                // Turn off EEG effect if not visible or no material
                // morphMaterial?.setFloat("eegIntensity", 0.0);
                return;
            }
            // console.log("BabylonManager: Updating EEG Viz (Placeholder)", data, settings);
            // --- Logic to update EEG visualization ---
            // 1. Update EEG Data Texture (if using texture approach)
            //    - Create/update a Texture object with 'data'
            //    - morphMaterial.setTexture("eegTexture", updatedTexture);
            // 2. Update Uniforms based on 'settings'
            //    - morphMaterial.setColor3("eegColorMapStart", ...);
            //    - morphMaterial.setFloat("eegIntensityScale", ...);
            //    - morphMaterial.setFloat("eegFrequencyBand", ...); // Or pass data directly
        },
        updateMPRPlane: (planeState) => {
            // createOrUpdateMPRPlaneMesh(planeState); // Update visual representation
            // Potentially update shader uniforms if slicing is done in shader
            // console.log("BabylonManager: Updating MPR Plane Viz (Placeholder)", planeState);
        }
    };
  
    return { engine, scene, sceneHelpers };
  };
  
  
  /**
   * Cleans up Babylon resources.
   * @param {Nullable<Engine>} engine
   * @param {Nullable<Scene>} scene
   */
  export const cleanupBabylonScene = (engine, scene) => {
      if (scene) {
          scene.dispose();
      }
      if (engine) {
          engine.dispose();
      }
  };