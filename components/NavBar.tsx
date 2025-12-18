import React from 'react';
import { Moon, Eye, User, Home, Sparkles, Compass } from 'lucide-react';
import { AppView } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface Props {
  currentView: AppView;
  setView: (view: AppView) => void;
  hapticEnabled?: boolean;
}

export const NavBar: React.FC<Props> = ({ currentView, setView, hapticEnabled = false }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tarot', icon: Sparkles, label: 'Tarot' },
    { id: 'dream', icon: Moon, label: 'Dream' },
    { id: 'astral', icon: Compass, label: 'Astral' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const handleNavClick = (view: AppView) => {
    if (hapticEnabled && view !== currentView) {
      triggerHaptic('medium');
    }
    setView(view);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-mystic-900/90 backdrop-blur-lg border-t border-white/5 pb-safe z-50">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id as AppView)}
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
              currentView === item.id 
                ? 'text-mystic-100' 
                : 'text-mystic-500 hover:text-mystic-300'
            }`}
          >
            <item.icon className={`w-6 h-6 ${currentView === item.id ? 'fill-current opacity-20 stroke-2' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};