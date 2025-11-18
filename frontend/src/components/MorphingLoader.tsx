import { useEffect, useRef, useState } from "react";

interface MorphingLoaderProps {
  size?: number;
  className?: string;
}

const MorphingLoader = ({ size = 64, className = "" }: MorphingLoaderProps) => {
  const [configuration, setConfiguration] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const configurations = [1, 2, 3];
    let currentIndex = 0;

    const updateConfiguration = () => {
      currentIndex = (currentIndex + 1) % configurations.length;
      setConfiguration(configurations[currentIndex]);
    };

    intervalRef.current = setInterval(updateConfiguration, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getShapeStyles = (index: number) => {
    const baseSize = size / 3;
    const configs: Record<number, Record<number, React.CSSProperties>> = {
      1: {
        1: { left: "0%", top: "0%", width: "33%", height: "33%" },
        2: { left: "33%", top: "0%", width: "33%", height: "33%" },
        3: { left: "66%", top: "0%", width: "34%", height: "100%" },
      },
      2: {
        1: { left: "0%", top: "33%", width: "33%", height: "33%" },
        2: { left: "33%", top: "33%", width: "33%", height: "33%" },
        3: { left: "66%", top: "0%", width: "34%", height: "100%" },
      },
      3: {
        1: { left: "0%", top: "66%", width: "33%", height: "33%" },
        2: { left: "33%", top: "66%", width: "33%", height: "33%" },
        3: { left: "66%", top: "0%", width: "34%", height: "100%" },
      },
    };

    return configs[configuration]?.[index] || {};
  };

  const colors = [
    "bg-morph-purple",
    "bg-morph-pink",
    "bg-morph-cyan",
  ];

  return (
    <div
      className={`relative ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className={`absolute ${colors[index - 1]} rounded-2xl transition-all duration-1000 ease-in-out`}
          style={getShapeStyles(index)}
        />
      ))}
    </div>
  );
};

export default MorphingLoader;

