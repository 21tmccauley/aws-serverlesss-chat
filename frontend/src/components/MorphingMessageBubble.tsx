import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

interface MorphingMessageBubbleProps {
  username: string;
  message: string;
  timestamp: Date;
  className?: string;
  style?: React.CSSProperties;
}

const MorphingMessageBubble = ({
  username,
  message,
  timestamp,
  className = "",
  style,
}: MorphingMessageBubbleProps) => {
  const [morphState, setMorphState] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const morphStates = [0, 1, 2];
    let currentIndex = 0;

    const updateMorph = () => {
      currentIndex = (currentIndex + 1) % morphStates.length;
      setMorphState(morphStates[currentIndex]);
    };

    // Morph every 4-6 seconds
    const scheduleUpdate = () => {
      const delay = 4000 + Math.random() * 2000;
      intervalRef.current = setTimeout(() => {
        updateMorph();
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
    switch (morphState) {
      case 0:
        return "rounded-2xl";
      case 1:
        return "rounded-3xl";
      case 2:
        return "rounded-xl";
      default:
        return "rounded-2xl";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card
      className={`${getBorderRadius()} p-6 shadow-md hover:shadow-lg transition-all duration-750 ease-in-out border-2 ${className}`}
      style={{
        borderColor: `hsl(var(--morph-purple) / 0.2)`,
        ...style,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div
            className={`h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg animate-morph-slow`}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <h3 className="font-bold text-lg">{username}</h3>
            <span className="text-sm text-muted-foreground">
              {formatTime(timestamp)}
            </span>
          </div>
          <p className="text-foreground leading-relaxed">{message}</p>
        </div>
      </div>
    </Card>
  );
};

export default MorphingMessageBubble;

