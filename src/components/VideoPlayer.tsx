import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  darkMode?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, darkMode = true }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Masquer les contrôles après 3 secondes d'inactivité
  useEffect(() => {
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    const videoElement = e.currentTarget;
    const error = videoElement.error;
    
    let errorMessage = "La vidéo n'a pas pu être chargée.";
    
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Le chargement de la vidéo a été interrompu.";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Erreur réseau lors du chargement de la vidéo.";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = "Format vidéo non supporté par votre navigateur.";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Format vidéo non supporté. Essayez un autre format.";
          break;
        default:
          errorMessage = "Erreur lors du chargement de la vidéo.";
      }
    }
    
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setError(null);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Erreur lors de la lecture:', err);
          setError("Impossible de lire la vidéo. Essayez de cliquer à nouveau.");
        });
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      setShowControls(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setShowControls(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="my-4 first:mt-0 last:mb-0">
      <div className={`relative rounded-lg overflow-hidden ${
        darkMode ? 'bg-dark-card' : 'bg-gray-100'
      }`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {error ? (
          <div className="flex items-center gap-2 p-4 text-red-400 bg-red-500/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="relative group">
            <video
              ref={videoRef}
              className="w-full aspect-video cursor-pointer"
              playsInline
              webkit-playsinline="true"
              muted={isMuted}
              preload="metadata"
              onError={handleError}
              onLoadedData={handleLoadedData}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={handleVideoClick}
            >
              <source src={url} type="video/mp4" />
              <source src={url} type="video/webm" />
              Votre navigateur ne prend pas en charge la lecture de vidéos.
            </video>

            {/* Contrôles personnalisés */}
            <div className={`absolute inset-0 video-overlay bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Barre de progression */}
                <div 
                  className="w-full h-2 video-progress bg-gray-600 bg-opacity-50 rounded-full cursor-pointer mb-3"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Contrôles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className={`p-2 rounded-full transition-colors video-controls ${
                        darkMode ? 'hover:bg-white hover:bg-opacity-20' : 'hover:bg-black hover:bg-opacity-20'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 text-white" />
                      ) : (
                        <Play className="h-5 w-5 text-white" />
                      )}
                    </button>

                    <button
                      onClick={handleMuteToggle}
                      className={`p-2 rounded-full transition-colors video-controls ${
                        darkMode ? 'hover:bg-white hover:bg-opacity-20' : 'hover:bg-black hover:bg-opacity-20'
                      }`}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5 text-white" />
                      ) : (
                        <Volume2 className="h-5 w-5 text-white" />
                      )}
                    </button>

                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;