import React from "react";
import "./AudioPlayer.css";
import { Slider } from "antd";
import { useIPFS } from "../hooks/useIPFS";
import useAudio from "../hooks/useAudio";
import {
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  PlayCircleFilled,
  PauseCircleFilled,
} from "@ant-design/icons";

function AudioPlayer({ nftAlbum }) {
  const [
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
  ] = useAudio(nftAlbum);

  const minSec = (secs) => {
    const minutes = Math.floor(secs / 60);
    const returnMin = minutes < 10 ? `0${minutes}` : minutes;
    const seconds = Math.floor(secs % 60);
    const returnSec = seconds < 10 ? `0${seconds}` : seconds;

    return `${returnMin}:${returnSec}`;
  };

  // Ensure that nftAlbum and trackIndex are valid
  if (!nftAlbum || nftAlbum.length === 0 || trackIndex >= nftAlbum.length) {
    return <div>No track available</div>;
  }

  // Current track for easier access
  const currentTrack = nftAlbum[trackIndex];

  return (
    <>
      <div
        className="buttons"
        style={{ width: "300px", justifyContent: "start" }}
      >
        <img
          className="cover"
          src={currentTrack.coverImage}
          alt="current cover"
        />
        <div>
          <div className="songTitle">{currentTrack.name}</div>
          <div className="songAlbum">{currentTrack.artistName}</div>
        </div>
      </div>
      <div>
        <div className="buttons">
          <StepBackwardOutlined className="forback" onClick={toPrevTrack} />
          {isPlaying ? (
            <PauseCircleFilled className="pauseplay" onClick={toggle} />
          ) : (
            <PlayCircleFilled className="pauseplay" onClick={toggle} />
          )}
          <StepForwardOutlined className="forback" onClick={toNextTrack} />
        </div>
        <div className="buttons">
          {minSec(trackProgress)}
          <Slider
            value={trackProgress}
            step={1}
            min={0}
            max={duration ? duration : 0}
            className="progress"
            tooltipVisible={false}
            onChange={(value) => onSearch(value)}
            onAfterChange={onSearchEnd}
          />
          {duration ? minSec(Math.round(duration)) : "00:00"}
        </div>
      </div>
      <div className="soundDiv">
        <SoundOutlined />
        <Slider
          className="volume"
          defaultValue={100}
          tooltipVisible={false}
          onChange={(value) => onVolume(value / 100)}
        />
      </div>
    </>
  );
}

export default AudioPlayer;
