'use client';

import { useState } from 'react';
import { PlayIcon, PauseIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/solid';

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-gray-800 p-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-800 rounded"></div>
          <div>
            <h3 className="text-sm font-medium">Song Title</h3>
            <p className="text-xs text-light-secondary">Artist Name</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-6">
            <button className="player-btn">
              <BackwardIcon className="h-5 w-5" />
            </button>
            <button 
              className="player-btn p-2 rounded-full bg-primary hover:scale-105 transition"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6 text-dark" />
              ) : (
                <PlayIcon className="h-6 w-6 text-dark" />
              )}
            </button>
            <button className="player-btn">
              <ForwardIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-96 progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Volume Control */}
        <div className="w-36">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player; 