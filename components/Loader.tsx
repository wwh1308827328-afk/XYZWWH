
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
      <div className="w-10 h-10 border-t border-[#d4af37] rounded-full animate-spin mb-4"></div>
      <h2 className="text-[#d4af37] font-cinzel text-xl tracking-[0.2em]">
        LOADING HOLIDAY MAGIC
      </h2>
    </div>
  );
};

export default Loader;
