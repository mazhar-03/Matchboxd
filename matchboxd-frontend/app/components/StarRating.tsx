"use client";
import { Star } from "lucide-react";
import { useState } from "react";

interface InteractiveStarRatingProps {
  value: number;
  onChange: (newValue: number) => void;
  editable?: boolean; // Yeni prop, default false
}

export default function InteractiveStarRating({
                                                value,
                                                onChange,
                                                editable = false,
                                              }: InteractiveStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  if (!editable) {
    // Sadece gösterim amaçlıysa, hover ve click disable
    const stars = [...Array(5)].map((_, i) => {
      const starValue = i + 1;
      const filled =
        value >= starValue
          ? "text-yellow-400"
          : value >= i + 0.5
            ? "text-yellow-400 opacity-70"
            : "text-gray-300";
      return <Star key={i} className={`w-6 h-6 ${filled}`} />;
    });
    return <div className="flex gap-1">{stars}</div>;
  }

  // editable ise normal davranış
  const handleClick = (index: number, isHalf: boolean) => {
    const newRating = isHalf ? index + 0.5 : index + 1;
    onChange(newRating);
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const { left, width } = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - left;
    const isHalf = x < width / 2;
    setHoverValue(isHalf ? index + 0.5 : index + 1);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className="flex gap-1 text-yellow-400 cursor-pointer">
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        const filled =
          displayValue >= starValue
            ? "text-yellow-400"
            : displayValue >= i + 0.5
              ? "text-yellow-400 opacity-70"
              : "text-gray-300";

        return (
          <div
            key={i}
            className="relative"
            onClick={(e) => {
              const { left, width } = (e.target as HTMLElement).getBoundingClientRect();
              const isHalf = e.clientX - left < width / 2;
              handleClick(i, isHalf);
            }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={handleMouseLeave}
          >
            <Star className={`w-6 h-6 ${filled}`} />
          </div>
        );
      })}
    </div>
  );
}
