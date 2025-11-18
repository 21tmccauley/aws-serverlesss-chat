import { useEffect, useRef, useState } from "react";

interface MorphingAvatarProps {
  username: string;
  size?: number;
  className?: string;
}

// Generate a consistent color from username
const getColorFromUsername = (username: string): string => {
  const colors = [
    "bg-morph-purple",
    "bg-morph-pink",
    "bg-morph-yellow",
    "bg-morph-cyan",
    "bg-morph-teal",
    "bg-morph-blue-gray",
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const MorphingAvatar = ({ username, size = 48, className = "" }: MorphingAvatarProps) => {
  const [roundness, setRoundness] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout>();
  const colorClass = getColorFromUsername(username);
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    const roundnessValues = [1, 2, 3, 4];
    let currentIndex = 0;

    const updateRoundness = () => {
      currentIndex = (currentIndex + 1) % roundnessValues.length;
      setRoundness(roundnessValues[currentIndex]);
    };

    // Change roundness every 2-4 seconds randomly
    const scheduleUpdate = () => {
      const delay = 2000 + Math.random() * 2000;
      intervalRef.current = setTimeout(() => {
        updateRoundness();
        scheduleUpdate();
      }, delay);
    };

    scheduleUpdate();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  const getBorderRadius = () => {
    switch (roundness) {
      case 1:
        return "rounded-2xl"; // 1.5rem
      case 2:
        return "rounded-none";
      case 3:
        return "rounded-full";
      case 4:
        return "rounded-3xl"; // 1.875rem
      default:
        return "rounded-2xl";
    }
  };

  return (
    <div
      className={`${colorClass} ${getBorderRadius()} flex items-center justify-center text-white font-bold transition-all duration-750 ease-in-out ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.4}px`,
      }}
    >
      {initial}
    </div>
  );
};

export default MorphingAvatar;

