
import React, { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/Icon";

const AudioPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleProgressChange = (e) => {
    const newTime = (progressBarRef.current.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full max-w-[250px] p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
      <audio ref={audioRef} src={src} preload="metadata"></audio>

      <button
        onClick={togglePlayPause}
        className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center"
      >
        <Icon
          icon={isPlaying ? "heroicons-solid:pause" : "heroicons-solid:play"}
        />
      </button>

      <div className="flex-grow flex items-center gap-2">
        <div className="w-full bg-slate-300 dark:bg-slate-500 rounded-full h-1.5">
          <div
            className="bg-slate-900 dark:bg-white h-1.5 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {formatTime(currentTime)}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;
