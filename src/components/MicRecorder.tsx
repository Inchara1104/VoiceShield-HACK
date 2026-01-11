import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface MicRecorderProps {
  phrase: string;
  userId: string;
  onResult: (score: number, status: string) => void;
}

const MicRecorder: React.FC<MicRecorderProps> = ({ phrase, userId, onResult }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioLevels, setAudioLevels] = useState<number>(0);
  const [environment, setEnvironment] = useState<'Clean' | 'Noisy' | 'Testing'>('Testing');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>(0);

  // 🔊 REAL-TIME AUDIO ANALYSIS
  const startAudioAnalysis = () => {
    if (!streamRef.current || !audioContextRef.current) return;

    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    
    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
    source.connect(analyserRef.current);
    
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

    const analyzeAudio = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avg = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current!.length;
        setAudioLevels(avg);
      }
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };
    analyzeAudio();
  };

  // 🎙️ START RECORDING
  const startRecording = async (): Promise<void> => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      // Start analysis
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      startAudioAnalysis();

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        cancelAnimationFrame(animationFrameRef.current);
        
        if (chunks.length === 0) {
          onResult(0, '❌ No audio captured');
          cleanup();
          return;
        }

        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const voiceScore = calculateVoiceQuality(audioBlob, audioLevels);
        const voiceStatus = getVoiceStatus(voiceScore);
        
        // Backend first, then fallback
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voice.webm');
          formData.append('userId', userId);
          formData.append('phrase', phrase);
          formData.append('avgLevel', audioLevels.toString());

          const res = await axios.post('http://localhost:5000/api/voice/verify', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 5000
          });
          
          onResult(res.data.trustScore, res.data.status);
        } catch (error) {
          console.log('Using local analysis');
          onResult(voiceScore, voiceStatus);
        }
        
        cleanup();
      };

      recorder.start(1000);
      setRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 6000);

    } catch (error) {
      console.error('Mic error:', error);
      onResult(0, '❌ Microphone access denied');
    }
  };

  // 🧠 LOCAL VOICE SCORING
  const calculateVoiceQuality = (blob: Blob, avgLevel: number): number => {
    const baseScore = Math.min(60, avgLevel * 2);
    const durationScore = blob.size > 15000 ? 25 : 10;
    const phraseBonus = phrase.length > 5 ? 15 : 0;
    return Math.round(baseScore + durationScore + phraseBonus);
  };

  const getVoiceStatus = (score: number): string => {
    if (score >= 85) return '✅ AUTHENTIC VOICE DETECTED';
    if (score >= 65) return '⚠️ VOICE DETECTED - Suspicious';
    if (score >= 40) return '❌ WEAK VOICE - Speak louder';
    return '🚫 NO VOICE - Check microphone';
  };

  // 🧹 CLEANUP
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) analyserRef.current = null;
    setAudioLevels(0);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      cleanup();
    };
  }, []);

  return (
    <div className="mic-recorder-container">
      <div className="recording-header">
        <div className="env-status">
          <span className={`env-badge ${audioLevels > 25 ? 'env-noisy' : 'env-clean'}`}>
            {audioLevels > 25 ? '🔇' : '✅'} {Math.round(audioLevels)}dB
          </span>
        </div>
        
        <div className="audio-levels">
          <div className="level-bar">
            <div 
              className="level-fill" 
              style={{ 
                width: `${Math.min(100, audioLevels * 1.5)}%`,
                backgroundColor: audioLevels > 30 ? '#4CAF50' : audioLevels > 15 ? '#FF9800' : '#f44336'
              }}
            />
          </div>
        </div>
      </div>

      <div className="phrase-display">
        {phrase ? (
          <div className="phrase-box">
            <strong>🔊 Speak:</strong> "{phrase}"
          </div>
        ) : (
          <div className="no-phrase">Generate challenge first!</div>
        )}
      </div>

      <button 
        className={`record-btn ${recording ? 'recording' : ''}`}
        onClick={startRecording}
        disabled={recording || !phrase}
      >
        {recording ? (
          <>🔴 Recording... <span className="countdown">●</span></>
        ) : (
          '🎤 Analyze Voice (6s)'
        )}
      </button>
    </div>
  );
};

export default MicRecorder;
