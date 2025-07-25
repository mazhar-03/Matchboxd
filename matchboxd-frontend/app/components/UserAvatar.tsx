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

  const isLocalBackendImage = profileImageUrl?.startsWith('http://localhost:5011');

  return (
    <div className={`relative ${className}`}>
      <div
        className="relative w-full h-full rounded-full overflow-hidden border hover:brightness-90 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {profileImageUrl ? (
          <Image
            src={profileImageUrl} // Use the full URL directly from backend
            alt={username || "User"}
            fill
            sizes="100%"
            className="object-cover"
            unoptimized={true} // Keep unoptimized for local backend images
            priority={false} // Optional: set to true if it's above the fold
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = ''; // This will trigger the fallback UI
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