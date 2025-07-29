import {StarIcon} from "@heroicons/react/24/solid";

export default function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = score >= star;
        const isHalfFilled = !isFilled && score >= star - 0.5;

        return (
          <div key={star} className="relative w-5 h-5">
            {/* Boş yıldız */}
            <StarIcon
              className={`absolute w-5 h-5 ${
                isFilled || isHalfFilled ? "text-gray-300" : "text-gray-400"
              }`}
            />
            {/* Dolu yıldız kısmı */}
            <div
              className={`absolute top-0 left-0 overflow-hidden ${
                isFilled ? "w-full" : isHalfFilled ? "w-1/2" : "w-0"
              }`}
            >
              <StarIcon className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        );
      })}
      <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
        {score.toFixed(1)}
      </span>
    </div>
  );
}