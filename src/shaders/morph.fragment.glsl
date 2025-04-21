#version 300 es // Specify GLSL ES 3.00
precision highp float;
precision highp int;

// == Varyings (Input from Vertex Shader) ==
in vec2 vUV;
in vec3 vNormalWorld;
in vec3 vPositionWorld;
in float vDisplacementMag;

// == Uniforms (Input from JavaScript/Babylon) ==
// Base Appearance
uniform sampler2D baseTexture;      // Optional: Base diffuse texture
uniform vec4 baseColorFactor;       // Base color if no texture (or tint)
uniform bool useBaseTexture;        // Flag to indicate if baseTexture is valid

// Lighting (Example: Simple Directional Light)
uniform vec3 lightDirection_world; // Direction *towards* the light in world space
uniform vec3 lightColor;
uniform vec3 cameraPosition_world; // Camera position in world space (for specular)

// Difference Weave Effect
uniform bool showDifferenceWeave;   // Toggle for the effect
uniform vec3 weaveColor;
uniform float weaveIntensityFactor; // Controls blend strength
uniform float weaveThresholdMin;    // Min displacement mag for effect
uniform float weaveThresholdMax;    // Max displacement mag for full effect

// EEG Visualization (Example structure)
uniform bool showEEG;
uniform sampler2D eegDataTexture;   // Texture holding EEG values mapped to UVs
uniform vec3 eegColorHot;
uniform vec3 eegColorCold;
uniform float eegIntensity;
uniform float eegTime;              // For pulsing effects

// == Output ==
layout(location = 0) out vec4 out_FragColor; // Output fragment color

// == Helper Functions (Example) ==
// Basic Lambertian diffuse calculation
float calculateDiffuse(vec3 normal, vec3 lightDir) {
    return max(0.0, dot(normalize(normal), normalize(lightDir)));
}
// Basic Blinn-Phong specular calculation
float calculateSpecular(vec3 normal, vec3 lightDir, vec3 viewDir, float shininess) {
    vec3 halfVec = normalize(lightDir + viewDir);
    return pow(max(0.0, dot(normalize(normal), halfVec)), shininess);
}

void main(void) {
    // 1. Determine Base Color
    vec4 surfaceColor = baseColorFactor;
    if (useBaseTexture) {
       // surfaceColor *= texture(baseTexture, vUV); // Modulate or replace based on texture
       vec4 texColor = texture(baseTexture, vUV);
       // Handle potential sRGB texture - approximate linearize for lighting
       surfaceColor = vec4(pow(texColor.rgb, vec3(2.2)), texColor.a) * baseColorFactor;
    }

    // 2. Calculate Basic Lighting
    vec3 Normal = normalize(vNormalWorld);
    vec3 LightDir = normalize(lightDirection_world);
    vec3 ViewDir = normalize(cameraPosition_world - vPositionWorld);

    float diffuse = calculateDiffuse(Normal, LightDir);
    float specular = calculateSpecular(Normal, LightDir, ViewDir, 32.0); // Example shininess = 32
    vec3 ambient = vec3(0.1); // Simple ambient term

    vec3 litColor = ambient + (diffuse * surfaceColor.rgb * lightColor) + (specular * lightColor * 0.5); // Combine lighting components

    // 3. Apply EEG Visualization (if enabled)
    vec3 finalColor = litColor;
    if (showEEG) {
        // Sample EEG data (needs proper mapping/scaling)
        float eegValue = texture(eegDataTexture, vUV).r; // Assuming EEG value in red channel
        eegValue = smoothstep(0.0, 1.0, eegValue); // Normalize/clamp

        // Example: Simple heatmap blend + pulsing effect
        vec3 eegMappedColor = mix(eegColorCold, eegColorHot, eegValue);
        float pulse = 0.7 + 0.3 * sin(eegTime * 5.0 + vUV.x * 10.0); // Example pulse effect
        finalColor = mix(finalColor, eegMappedColor, eegIntensity * pulse * eegValue); // Blend based on intensity & value
    }

    // 4. Apply Difference Weave (if enabled)
    if (showDifferenceWeave) {
        // Calculate intensity based on displacement magnitude and thresholds
        float weaveIntensity = smoothstep(weaveThresholdMin, weaveThresholdMax, vDisplacementMag);
        // Blend the weave color over the current color
        finalColor = mix(finalColor, weaveColor, weaveIntensity * weaveIntensityFactor);
    }

    // 5. Final Output Color (convert back to sRGB if linearized)
    // out_FragColor = vec4(finalColor, surfaceColor.a);
     out_FragColor = vec4(pow(finalColor, vec3(1.0/2.2)), surfaceColor.a); // Approximate sRGB conversion

}