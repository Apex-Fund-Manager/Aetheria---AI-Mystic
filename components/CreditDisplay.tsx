import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

interface Props {
  credits: number;
  onAddCredits: () => void;
}

export const CreditDisplay: React.FC<Props> = ({ credits, onAddCredits }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-mystic-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-mystic-300">
          Aetheria
        </span>
      </div>
      
      <button 
        onClick={onAddCredits}
        className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-gold-500/30 hover:bg-black/60 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-gold-400" />
        <span className="font-bold text-gold-400 text-sm">{credits}</span>
        <div className="w-px h-3 bg-white/20 mx-1"></div>
        <Plus className="w-3 h-3 text-gold-400" />
      </button>
    </div>
  );
};