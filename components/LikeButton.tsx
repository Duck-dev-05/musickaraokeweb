import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useLikedSongs } from '@/lib/hooks/useLikedSongs';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  songId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({ songId, className, size = 'md' }: LikeButtonProps) {
  const { isLiked, isLoading, toggleLike } = useLikedSongs(songId);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleLike();
      }}
      disabled={isLoading}
      className={cn(
        'text-light-secondary hover:text-primary transition-colors relative',
        isLiked && 'text-primary',
        className
      )}
    >
      {isLiked ? (
        <HeartSolid className={sizeClasses[size]} />
      ) : (
        <HeartOutline className={sizeClasses[size]} />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
} 