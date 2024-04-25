import React, { useState, useEffect, useRef } from "react";

const useAudio = (nftAlbum) => {
  const [audio, setAudio] = useState(nftAlbum);
  const [trackIndex, setTrackIndex] = useState(0);
  const [newSong, setNewSong] = useState(0);
  const [trackProgress, setTrackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef(new Audio(audio[trackIndex].url));

  const intervalRef = useRef();
  const isReady = useRef(false);

  const { duration } = audioRef.current;

  const toPrevTrack = () => {
    if (trackIndex - 1 < 0) {
      setTrackIndex(audio.length - 1);
    } else {
      setTrackIndex(trackIndex - 1);
    }
  };

  const toNextTrack = () => {
    if (trackIndex < audio.length - 1) {
      setTrackIndex(trackIndex + 1);
    } else {
      setTrackIndex(0);
    }
  };

  const toggle = () => {
    if (isPlaying) {
      // 先暂停音频
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 播放音频
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          startTimer();
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    }
  };

  useEffect(() => {
    toggle();
    setAudio(nftAlbum);
    if (trackIndex === 0) {
      setNewSong(newSong + 1);
    } else {
      setTrackIndex(0);
    }
  }, [nftAlbum]);

  const startTimer = () => {
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (audioRef.current.ended) {
        toNextTrack();
      } else {
        setTrackProgress(Math.round(audioRef.current.currentTime));
      }
    }, [1000]);
  };

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
      startTimer();
    } else {
      clearInterval(intervalRef.current);
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      audioRef.current.pause();
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    console.log("useEffect in useAudio is triggered");
    audioRef.current.pause();
    audioRef.current = new Audio(audio[trackIndex].url);
    audioRef.current.volume = volume;
    setTrackProgress(Math.round(audioRef.current.currentTime));
    if (isReady.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          startTimer();
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    } else {
      isReady.current = true;
    }
  }, [trackIndex, newSong]);

  const onSearch = (value) => {
    clearInterval(intervalRef.current);
    audioRef.current.currentTime = value;
    setTrackProgress(audioRef.current.currentTime);
  };

  const onSearchEnd = () => {
    if (!isPlaying) {
      setIsPlaying(true);
    }
    startTimer();
  };

  const onVolume = (vol) => {
    setVolume(vol);
    audioRef.current.volume = vol;
  };

  return [
    isPlaying,
    duration,
    toggle,
    toNextTrack,
    toPrevTrack,
    trackProgress,
    onSearch,
    onSearchEnd,
    onVolume,
    trackIndex,
  ];
};

export default useAudio;
