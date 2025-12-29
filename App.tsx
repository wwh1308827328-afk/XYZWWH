
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Experience from './components/Experience';
import Loader from './components/Loader';
import UIOverlay from './components/UIOverlay';
import { AppState, AppMode } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: AppMode.TREE,
    uiHidden: false,
    isLoading: true,
    focusedPhotoIndex: null,
    handX: 0,
    handY: 0,
  });

  const experienceRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setState(prev => ({ ...prev, uiHidden: !prev.uiHidden }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoaded = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const handleModeChange = useCallback((newMode: AppMode) => {
    setState(prev => ({ ...prev, mode: newMode }));
  }, []);

  const handleHandUpdate = useCallback((x: number, y: number) => {
    setState(prev => ({ ...prev, handX: x, handY: y }));
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {state.isLoading && <Loader />}
      
      <Experience 
        mode={state.mode}
        handX={state.handX}
        handY={state.handY}
        onLoaded={handleLoaded}
        onModeChange={handleModeChange}
        onHandUpdate={handleHandUpdate}
        ref={experienceRef}
      />

      <UIOverlay 
        state={state} 
        onModeChange={handleModeChange}
        onUpload={(texture) => experienceRef.current?.addPhoto(texture)}
      />
    </div>
  );
};

export default App;
