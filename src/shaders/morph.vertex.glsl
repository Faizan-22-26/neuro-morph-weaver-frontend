#version 300 es // Specify GLSL ES 3.00 for potential newer features if targeting WebGL2/WebGPU
precision highp float;
precision highp int;

// == Attributes (Input from Mesh Data) ==
in vec3 position;           // Base vertex position
in vec3 normal;             // Base vertex normal
in vec2 uv;                 // Base UV coordinates (for texturing)
// CRITICAL: Must be provided per-vertex in your mesh asset
// Represents the vector from base position to fully morphed position
in vec3 displacementVector;

// == Uniforms (Input from JavaScript/Babylon) ==
// Matrices
uniform mat4 worldViewProjection; // Combined MVP matrix
uniform mat4 world;               // Model-to-World matrix (for normal transformation)
// Morphing & Time
uniform float progressionFactor;  // Interpolation factor [0.0, 1.0]
uniform float time;               // Global time for animations (e.g., pulsing effects)

// == Varyings (Output to Fragment Shader) ==
out vec2 vUV;                  // Pass UV coordinates
out vec3 vNormalWorld;         // Pass normal in world space (for lighting)
out vec3 vPositionWorld;       // Pass position in world space (for lighting/effects)
out float vDisplacementMag;    // Pass magnitude of displacement (for difference weave)

void main(void) {
    // 1. Calculate Morphed Position
    vec3 morphedPosition = position + (displacementVector * progressionFactor);

    // 2. Calculate World Position
    vec4 worldPos = world * vec4(morphedPosition, 1.0);
    vPositionWorld = worldPos.xyz;

    // 3. Calculate World Normal
    // NOTE: Simple normal passing. For accurate lighting on morphed surface,
    // recalculate normals based on displacement or use a normal map.
    // For now, transform the base normal.
    mat3 normalMatrix = mat3(transpose(inverse(world))); // Use normal matrix for correct scaling/rotation
    vNormalWorld = normalize(normalMatrix * normal);

    // 4. Calculate Displacement Magnitude
    // Use magnitude of the *applied* displacement for difference weave effect
    vDisplacementMag = length(displacementVector * progressionFactor);

    // 5. Calculate Clip Space Position
    gl_Position = worldViewProjection * vec4(morphedPosition, 1.0);

    // 6. Pass UV coordinates
    vUV = uv;
}