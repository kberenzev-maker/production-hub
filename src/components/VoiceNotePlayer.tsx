import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, FastForward, Volume2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { VoiceNoteItem } from '../types';

interface VoiceNotePlayerProps {
  voice: VoiceNoteItem;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ voice }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voice.duration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => {
        console.warn('Audio play prevented or file not found:', e);
      });
      setIsPlaying(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 18 decorative bars for audio waveform visualization
  const waveformHeights = [30, 45, 75, 90, 60, 40, 80, 100, 70, 50, 85, 95, 60, 40, 70, 55, 35, 20];

  return (
    <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-[#E5E5EA] space-y-2.5 transition-all">
      <audio ref={audioRef} src={voice.url} preload="metadata" />

      {/* Header with sender and time */}
      <div className="flex items-center justify-between text-xs text-[#8E8E93]">
        <div className="flex items-center gap-1.5 font-medium text-black">
          <Volume2 className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>{voice.senderName || 'Голосовая заметка'}</span>
        </div>
        <span>{voice.createdAt ? new Date(voice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
      </div>

      {/* Player Controls & Waveform */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#007AFF]/90 transition-transform active:scale-95 shrink-0 cursor-pointer shadow-sm"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        {/* Waveform Visualization & Scrubber */}
        <div className="flex-1 flex flex-col justify-center gap-1">
          <div 
            className="flex items-center gap-[3px] h-6 cursor-pointer py-1"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              if (audioRef.current && duration > 0) {
                audioRef.current.currentTime = clickPos * duration;
                setCurrentTime(clickPos * duration);
              }
            }}
          >
            {waveformHeights.map((h, i) => {
              const barProgress = (i / waveformHeights.length) * 100;
              const isPast = barProgress <= progress;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-colors duration-150"
                  style={{
                    height: `${h}%`,
                    backgroundColor: isPast ? '#007AFF' : '#C7C7CC'
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] text-[#8E8E93] font-medium font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || voice.duration || 0)}</span>
          </div>
        </div>

        {/* Speed Toggle (1x, 1.5x, 2x) */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-2 py-1 bg-white hover:bg-black/5 rounded-lg border border-[#D1D1D6] text-[11px] font-bold text-[#007AFF] shrink-0 cursor-pointer transition-colors shadow-2xs"
          title="Скорость воспроизведения"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Auto-transcript (Gemini speech-to-text) */}
      {voice.textTranscript && (
        <div className="pt-1 border-t border-[#E5E5EA]">
          <button
            type="button"
            onClick={() => setShowTranscript(prev => !prev)}
            className="w-full flex items-center justify-between text-xs text-[#007AFF] font-medium py-0.5 cursor-pointer hover:opacity-80"
          >
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>Расшифровка текста (AI)</span>
            </div>
            {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTranscript && (
            <div className="mt-1.5 p-2.5 bg-white rounded-xl text-xs text-[#3C3C43] leading-relaxed border border-[#E5E5EA]/60 shadow-2xs">
              {voice.textTranscript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
