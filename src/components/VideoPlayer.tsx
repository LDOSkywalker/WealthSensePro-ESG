import React, { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  darkMode?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, darkMode = true }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    setError("La vidéo n'a pas pu être chargée. Veuillez vérifier le lien ou réessayer plus tard.");
    setIsLoading(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="my-4 first:mt-0 last:mb-0">
      <div className={`relative rounded-lg overflow-hidden ${
        darkMode ? 'bg-dark-card' : 'bg-gray-100'
      }`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {error ? (
          <div className="flex items-center gap-2 p-4 text-red-400 bg-red-500/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full aspect-video"
            controls
            preload="metadata"
            onError={handleError}
            onLoadedData={handleLoadedData}
          >
            <source src={url} type="video/mp4" />
            Votre navigateur ne prend pas en charge la lecture de vidéos.
          </video>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;