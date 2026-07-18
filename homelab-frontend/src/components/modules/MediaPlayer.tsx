import React from 'react';

type MediaPlayerMode = 'light' | 'full';
type MediaKind = 'audio' | 'video';

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|oga|m4a|flac|aac)(\?.*)?$/i;

const guessMediaKind = (url: string): MediaKind => {
  if (VIDEO_EXTENSIONS.test(url)) return 'video';
  if (AUDIO_EXTENSIONS.test(url)) return 'audio';
  return 'video';
};

export interface MediaPlayerProps {
  src?: string;
  source?: string;
  sourceData?: string | { url?: string | null } | null;
  mediaType?: MediaKind;
  displayViewerMode?: MediaPlayerMode;
  params?: Record<string, unknown>;
  loading?: boolean;
  error?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  src,
  sourceData,
  mediaType,
  displayViewerMode = 'light',
  loading = false,
  error,
  autoPlay = false,
  loop = false,
}) => {
  const isFullMode = displayViewerMode === 'full';

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-80 bg-base-200 rounded-xl">
        <span className="loading loading-spinner text-primary"></span>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center w-full h-80 bg-error/10 text-error rounded-xl">
        <p>{error}</p>
      </div>
    );
  }

  const mediaUrl = src || (typeof sourceData === 'string' ? sourceData : sourceData?.url);

  if (!mediaUrl) {
    return (
      <div className="flex justify-center items-center w-full h-80 bg-base-200 rounded-xl text-base-content/50">
        <p>Media not available</p>
      </div>
    );
  }

  const kind = mediaType ?? guessMediaKind(mediaUrl);

  if (kind === 'audio') {
    return (
      <div className="w-full flex items-center justify-center rounded-lg p-4 bg-base-200">
        <audio
          src={mediaUrl}
          controls
          autoPlay={autoPlay}
          loop={loop}
          className="w-full"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (isFullMode) {
    return (
      <video
        src={mediaUrl}
        controls
        autoPlay={autoPlay}
        loop={loop}
        className="block w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
      >
        Your browser does not support the video element.
      </video>
    );
  }

  return (
    <div className="w-[400px] h-[300px] bg-base-200 flex items-center justify-center rounded-lg overflow-hidden">
      <video
        src={mediaUrl}
        controls
        autoPlay={autoPlay}
        loop={loop}
        className="max-w-full max-h-full object-contain"
      >
        Your browser does not support the video element.
      </video>
    </div>
  );
};
MediaPlayer.displayName = 'MediaPlayer';
