"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  indexNumber: string;
  size?: "sm" | "md" | "lg" | "2xl";
}

export function StudentAvatar({
  name,
  photoUrl,
  indexNumber,
  size = "md",
}: StudentAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    "2xl": "h-32 w-32 text-4xl",
  };

  // Generate initials from name
  const getInitials = () => {
    if (name && name !== "Top Links") {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    // Use index number as fallback
    return indexNumber.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {photoUrl && photoUrl !== "https://uom.lk/./Batch 18 Students" && (
        <AvatarImage src={photoUrl} alt={name || indexNumber} />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
