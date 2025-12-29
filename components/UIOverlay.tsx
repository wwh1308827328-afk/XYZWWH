
import React, { useRef } from 'react';
import { AppState, AppMode } from '../types';
import * as THREE from 'three';

interface UIOverlayProps {
  state: AppState;
  onModeChange: (mode: AppMode) => void;
  onUpload: (texture: THREE.Texture) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ state, onModeChange, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          new THREE.TextureLoader().load(ev.target.result as string, (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            onUpload(t);
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${state.uiHidden ? 'opacity-0' : 'opacity-100'}`}>
      {/* Title */}
      <div className="absolute top-10 left-0 right-0 flex justify-center">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-b from-white to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] font-cinzel uppercase tracking-widest text-center">
          Merry Christmas
        </h1>
      </div>

      {/* Upload Wrapper */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4 pointer-events-auto">
        <div className="upload-wrapper">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-3 bg-white/10 backdrop-blur-md border border-[#d4af37] text-[#fceea7] font-cinzel tracking-wider hover:bg-[#d4af37]/20 transition-all rounded-sm uppercase"
          >
            ADD MEMORIES
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        <p className="text-white/40 text-sm tracking-widest">PRESS 'H' TO HIDE CONTROLS</p>
      </div>

      {/* Modes Visualization Feedback */}
      <div className="absolute bottom-10 left-10 space-y-2 font-cinzel">
        <div className={`text-xs ${state.mode === AppMode.TREE ? 'text-[#d4af37]' : 'text-white/20'}`}>MODE: TREE [FIST]</div>
        <div className={`text-xs ${state.mode === AppMode.SCATTER ? 'text-[#d4af37]' : 'text-white/20'}`}>MODE: SCATTER [OPEN HAND]</div>
        <div className={`text-xs ${state.mode === AppMode.FOCUS ? 'text-[#d4af37]' : 'text-white/20'}`}>MODE: FOCUS [PINCH]</div>
      </div>

      {/* MediaPipe Video Feed (Hidden) */}
      <div className="absolute bottom-4 right-4 opacity-0 pointer-events-none">
        <video id="webcam" autoPlay playsInline width="160" height="120"></video>
        <canvas id="cv-canvas" width="160" height="120"></canvas>
      </div>
    </div>
  );
};

export default UIOverlay;
