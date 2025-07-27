import { User } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef } from "react";

interface UserAvatarProps {
  profileImageUrl?: string | null;
  username?: string;
  className?: string;
  onUpload?: (file: File) => Promise<void>;
}

export default function UserAvatar({
                                     profileImageUrl,
                                     username,
                                     className = "w-20 h-20",
                                     onUpload,
                                   }: UserAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Added relative positioning to this div */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt={username || "User"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized={!profileImageUrl.startsWith("/")}
            priority={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xl font-bold">
            {username?.charAt(0).toUpperCase() || <User className="w-6 h-6" />}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}