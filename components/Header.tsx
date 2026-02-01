
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 lg:px-40 py-4 bg-black/90 sticky top-0 z-50 backdrop-blur-sm border-b border-[#222]">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full flex items-center justify-center overflow-hidden border border-[#333] bg-black">
          <img 
            alt="Tomauno Logo" 
            className="w-full h-full object-contain p-0.5" 
            src="https://lh3.googleusercontent.com/d/1EFWhAi8I9zhStIst2GLh1E2A6RyJZODS"
          />
        </div>
        <h2 className="text-lg font-extrabold tracking-tighter uppercase italic text-white">
          Toma<span className="text-[#ff0000]">uno</span> Model's
        </h2>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <nav className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <a className="hover:text-[#ff0000] transition-colors" href="#">Inicio</a>
          <a className="hover:text-[#ff0000] transition-colors border-b border-[#ff0000] pb-0.5" href="#">Pre-Inscripción</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
