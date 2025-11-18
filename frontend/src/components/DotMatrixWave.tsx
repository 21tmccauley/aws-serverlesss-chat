import { useEffect, useRef } from "react";

interface DotMatrixWaveProps {
  dotSize?: number;
  dotSpacing?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  dotColor?: string;
  opacity?: number;
}

const DotMatrixWave = ({
  dotSize = 2,
  dotSpacing = 20,
  waveSpeed = 0.02,
  waveAmplitude = 15,
  dotColor,
  opacity = 0.6,
}: DotMatrixWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Auto-detect dot color based on theme if not provided
    const getDotColor = () => {
      if (dotColor) return dotColor;
      // Check if dark mode
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 0.3)";
    };

    const effectiveDotColor = getDotColor();

    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);


    // Calculate grid dimensions
    const getGridDimensions = () => {
      const cols = Math.ceil(canvas.width / dotSpacing) + 1;
      const rows = Math.ceil(canvas.height / dotSpacing) + 1;
      return { cols, rows };
    };

    // 3D Perspective projection parameters - top-down view with depth
    const perspectiveDistance = 1500; // Distance from viewer
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.3; // Start waves higher up to show distance

    // Animation loop
    const animate = () => {
      if (!ctx) return;

      const { cols, rows } = getGridDimensions();
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update time
      timeRef.current += waveSpeed;

      // Store dots with their depth for sorting (optional - for better rendering)
      const dots: Array<{x: number, y: number, z: number, size: number, opacity: number, color: string}> = [];

      // Draw dots with wave animation and 3D perspective
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          // 3D coordinates
          const x3d = (col - cols / 2) * dotSpacing;
          const y3d = (row - rows / 2) * dotSpacing;

          // Create wave effect using sine waves (this is the Z coordinate - height)
          const wave1 = Math.sin((x3d * 0.01) + (timeRef.current * 2));
          const wave2 = Math.sin((y3d * 0.01) + (timeRef.current * 1.5));
          const wave3 = Math.sin(((x3d + y3d) * 0.008) + (timeRef.current * 1.8));
          
          // Combine waves for more organic movement
          const waveOffset = (wave1 + wave2 + wave3) / 3;
          const z3d = waveOffset * waveAmplitude; // Height of the wave

          // Top-down view: camera is straight above, looking down
          // Y axis goes into the distance (depth), Z is wave height
          // No rotation needed - just perspective projection based on Y (depth)
          
          // Calculate depth based on Y position (how far into the distance)
          // Positive Y goes into the distance
          const depth = y3d;
          
          // Perspective projection - scale based on distance
          const scale = perspectiveDistance / (perspectiveDistance + depth);
          
          // Project to 2D (top-down view)
          const x2d = centerX + x3d * scale;
          const y2d = centerY + depth * scale; // Y goes into the distance
          
          // Store the actual Z depth for sorting
          const rotatedZ = depth;

          // Calculate dot size and opacity based on depth
          // Dots further into the distance are smaller and more transparent
          const depthFactor = Math.max(0.2, scale); // Scale factor for depth (more aggressive fade)
          const dotSizeScaled = dotSize * depthFactor;
          
          // Opacity based on wave position and depth
          // Wave height affects visibility - peaks are more visible
          const normalizedWave = (waveOffset + 1) / 2; // Normalize to 0-1
          // More aggressive fade with distance - dots far away fade more
          const depthOpacity = Math.max(0.1, Math.pow(depthFactor, 1.5)); // Exponential fade
          const dotOpacity = normalizedWave * opacity * depthOpacity;
          
          // Also adjust opacity based on wave height - higher waves are more visible
          const heightVisibility = 0.5 + (normalizedWave * 0.5); // Peaks are brighter
          const finalOpacity = dotOpacity * heightVisibility;

          // Update color with final opacity
          let finalColorWithOpacity = effectiveDotColor;
          if (effectiveDotColor.startsWith("rgba")) {
            const rgbMatch = effectiveDotColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbMatch) {
              finalColorWithOpacity = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${finalOpacity})`;
            }
          } else if (effectiveDotColor.startsWith("#")) {
            const hex = effectiveDotColor.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            finalColorWithOpacity = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
          }

          // Store dot for rendering
          dots.push({
            x: x2d,
            y: y2d,
            z: rotatedZ,
            size: dotSizeScaled,
            opacity: finalOpacity,
            color: finalColorWithOpacity
          });
        }
      }

      // Sort dots by depth (back to front) for proper rendering
      dots.sort((a, b) => b.z - a.z);

      // Draw all dots
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dotSize, dotSpacing, waveSpeed, waveAmplitude, dotColor, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default DotMatrixWave;

