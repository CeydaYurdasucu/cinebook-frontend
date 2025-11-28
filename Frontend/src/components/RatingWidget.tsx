
import { useState } from "react";
import { Star } from "lucide-react";

interface RatingWidgetProps {
  currentRating?: number;
  onRate?: (rating: number) => void;
}

export default function RatingWidget({ currentRating, onRate }: RatingWidgetProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(currentRating || 0);

  const handleClick = (rating: number) => {
    setSelectedRating(rating);
    if (onRate) {
      onRate(rating);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            key={rating}
            onMouseEnter={() => setHoverRating(rating)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => handleClick(rating)}
            className="group relative"
          >
            <Star
              className={`w-6 h-6 transition-all ${
                rating <= (hoverRating || selectedRating)
                  ? "text-[#FFD65A] fill-[#FFD65A] scale-110"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {rating}
            </span>
          </button>
        ))}
      </div>
      {selectedRating > 0 && (
        <span className="text-[#FFD65A] ml-2">{selectedRating}/10</span>
      )}
    </div>
  );
}
