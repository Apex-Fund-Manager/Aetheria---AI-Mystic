import React, { useState, useEffect } from 'react';
import { CreditDisplay } from './components/CreditDisplay';
import { NavBar } from './components/NavBar';
import { Button } from './components/Button';
import { AppView, UserState, TarotResult, DreamResult, AstralResult, LegalMode } from './types';
import { getTarotReading, getDreamInterpretation, getAstralGuidance, getSymbolExplore } from './services/geminiService';
import { Sparkles, Moon, ArrowRight, Lock, CheckCircle2, AlertCircle, Volume2, VolumeX, Compass, Orbit, Music, Music2, Gift, X, Play, ShieldCheck, RefreshCw, Info, Smartphone, BookOpen, Search, FileText, LifeBuoy, Shield } from 'lucide-react';
import { playSpendSound, playCompletionSound, playPurchaseSound, startAstralAmbience, stopAstralAmbience } from './utils/sound';
import { triggerHaptic } from './utils/haptics';

const TAROT_COST = 20;
const DREAM_COST = 15;
const ASTRAL_COST = 25;
const DAILY_BONUS_AMOUNT = 15;

const INITIAL_STATE: UserState = {
  credits: 50, // Free welcome credits
  streak: 1,
  lastDailyBonus: new Date(Date.now() - 86400000).toISOString(), // Set to yesterday so they get a bonus today immediately
  history: [],
  soundEnabled: true,
  hapticEnabled: true,
  hasSeenTutorial: false
};

// Generates a deterministic mystical abstract art background based on text seed
const getCardVisual = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash >> 8) % 360);
  const accentHue = Math.abs((hash >> 4) % 360);
  
  const c1 = `hsl(${hue1}, 60%, 25%)`;
  const c2 = `hsl(${hue2}, 50%, 15%)`;
  const accent = `hsl(${accentHue}, 80%, 60%)`;
  
  return {
    background: `
      radial-gradient(circle at 50% 30%, ${accent}40 0%, transparent 50%),
      conic-gradient(from ${hue1}deg at 50% 60%, ${c1}, ${c2}, ${c1}),
      repeating-linear-gradient(45deg, transparent, transparent 10px, ${accent}10 10px, ${accent}10 11px)
    `,
    boxShadow: `inset 0 0 30px ${c2}`,
  };
};

export default function App() {
  // State
  const [view, setView] = useState<AppView>('home');
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('aetheria_user');
    return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
  });

  // Services State
  const [isLoading, setIsLoading] = useState(false);
  const [tarotResult, setTarotResult] = useState<TarotResult | null>(null);
  const [dreamInput, setDreamInput] = useState('');
  const [dreamResult, setDreamResult] = useState<DreamResult | null>(null);
  const [tarotInput, setTarotInput] = useState('');
  
  // Theme Explorer State
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [themeInsight, setThemeInsight] = useState<string>('');
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  
  // Astral State
  const [astralInput, setAstralInput] = useState('');
  const [astralResult, setAstralResult] = useState<AstralResult | null>(null);
  const [astralMusicEnabled, setAstralMusicEnabled] = useState(false);

  // Legal / Support State
  const [legalMode, setLegalMode] = useState<LegalMode>(null);

  // UI State
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!user.hasSeenTutorial);

  // Persist User
  useEffect(() => {
    localStorage.setItem('aetheria_user', JSON.stringify(user));
  }, [user]);

  // Check Daily Bonus on Mount
  useEffect(() => {
    const checkBonus = () => {
        const last = new Date(user.lastDailyBonus || 0);
        const now = new Date();
        // Check if it's a different calendar day
        const isDifferentDay = last.getDate() !== now.getDate() || last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
        
        if (isDifferentDay && !showTutorial) { // Don't show bonus on top of tutorial
            setShowBonusModal(true);
        }
    };
    const timer = setTimeout(checkBonus, 1000);
    return () => clearTimeout(timer);
  }, [showTutorial]); // Re-check when tutorial closes

  // Handle Background Ambience Logic
  useEffect(() => {
    if (view === 'astral' && user.soundEnabled && astralMusicEnabled) {
        startAstralAmbience();
    } else {
        stopAstralAmbience();
    }
    return () => {
        if (view !== 'astral') stopAstralAmbience();
    };
  }, [view, user.soundEnabled, astralMusicEnabled]);

  // Haptic Helper
  const vibrate = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
      if (user.hapticEnabled) triggerHaptic(type);
  };

  // Handlers
  const handleFinishTutorial = () => {
      if (user.soundEnabled) playPurchaseSound();
      vibrate('success');
      setUser(prev => ({ ...prev, hasSeenTutorial: true }));
      setShowTutorial(false);
  };

  const claimBonus = () => {
      if (user.soundEnabled) playPurchaseSound();
      vibrate('success');
      setUser(prev => ({
          ...prev,
          credits: prev.credits + DAILY_BONUS_AMOUNT,
          streak: prev.streak + 1,
          lastDailyBonus: new Date().toISOString()
      }));
      setShowBonusModal(false);
  };
  
  const handleThemeClick = async (theme: string) => {
    vibrate('light');
    setSelectedTheme(theme);
    setThemeInsight('');
    setIsThemeLoading(true);
    
    // Fetch insight
    try {
        const insight = await getSymbolExplore(theme);
        setThemeInsight(insight);
    } catch (e) {
        setThemeInsight("The symbol remains mysterious.");
    } finally {
        setIsThemeLoading(false);
    }
  };

  const closeThemeModal = () => {
      vibrate('light');
      setSelectedTheme(null);
  }

  // Generic Handler for "No-Code" Wrappers
  const handlePurchase = (amount: number, productId: string) => {
    console.log(`Initiating purchase for ${productId}`);
    vibrate('light');

    // 1. Attempt Native Bridge (Median.co / GoNative)
    // The wrapper usually injects a 'gonative' object.
    const w = window as any;
    if (w.gonative && w.gonative.iap) {
        w.gonative.iap.purchase({
            productID: productId
        });
        // Note: The logic to update credits usually happens in a callback function 
        // that Median calls upon success, but for this demo, we'll assume manual simulation below.
        return; 
    }

    // 2. Fallback / Dev Mode
    if (user.soundEnabled) playPurchaseSound();
    
    const confirmMsg = `[DEVELOPER MODE]\n\nIn the real mobile app (via Median.co), this button will trigger Native In-App Purchase for ID: '${productId}'.\n\nSimulate successful purchase now?`;
    
    if (confirm(confirmMsg)) {
        vibrate('success');
        setUser(prev => ({ ...prev, credits: prev.credits + amount }));
        alert(`Success! Added ${amount} credits.`);
        setView('home');
    }
  };

  const handleWatchAd = () => {
      if (confirm("[DEVELOPER MODE]\n\nSimulating 30-second video ad...\n(You would configure AdMob in your App Wrapper dashboard)")) {
           if (user.soundEnabled) playPurchaseSound();
           vibrate('success');
           setUser(prev => ({ ...prev, credits: prev.credits + 5 }));
           alert("Ad watched! You earned 5 credits.");
      }
  };

  const spendCredits = (cost: number): boolean => {
    if (user.credits < cost) {
      vibrate('error');
      setView('store');
      return false;
    }
    if (user.soundEnabled) playSpendSound();
    vibrate('heavy');
    setUser(prev => ({ ...prev, credits: prev.credits - cost }));
    return true;
  };

  const runTarot = async () => {
    if (!spendCredits(TAROT_COST)) return;
    setIsLoading(true);
    setTarotResult(null);
    try {
      const result = await getTarotReading(tarotInput);
      setTarotResult(result);
      if (user.soundEnabled) playCompletionSound();
      vibrate('success');
      
      setUser(prev => ({
        ...prev,
        history: [...prev.history, { 
          id: Date.now().toString(), 
          date: new Date().toISOString(), 
          type: 'tarot', 
          summary: result.summary.substring(0, 100) + "..." 
        }]
      }));
    } catch (e) {
      alert("The spirits are clouded. Credits refunded.");
      vibrate('error');
      setUser(prev => ({ ...prev, credits: prev.credits + TAROT_COST }));
    } finally {
      setIsLoading(false);
    }
  };

  const runDream = async () => {
    if (!dreamInput.trim()) return;
    if (!spendCredits(DREAM_COST)) return;
    setIsLoading(true);
    setDreamResult(null);
    try {
      const result = await getDreamInterpretation(dreamInput);
      setDreamResult(result);
      if (user.soundEnabled) playCompletionSound();
      vibrate('success');

       setUser(prev => ({
        ...prev,
        history: [...prev.history, { 
          id: Date.now().toString(), 
          date: new Date().toISOString(), 
          type: 'dream', 
          summary: result.interpretation.substring(0, 100) + "..." 
        }]
      }));
    } catch (e) {
      alert("The dream realm is unreachable. Credits refunded.");
      vibrate('error');
      setUser(prev => ({ ...prev, credits: prev.credits + DREAM_COST }));
    } finally {
      setIsLoading(false);
    }
  };

  const runAstral = async () => {
    if (!spendCredits(ASTRAL_COST)) return;
    setIsLoading(true);
    setAstralResult(null);
    try {
        const result = await getAstralGuidance(astralInput);
        setAstralResult(result);
        if (user.soundEnabled) playCompletionSound();
        vibrate('success');

        setUser(prev => ({
            ...prev,
            history: [...prev.history, {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: 'astral',
                summary: result.guidance.substring(0, 100) + "..."
            }]
        }));
    } catch (e) {
        alert("The astral plane is turbulent. Credits refunded.");
        vibrate('error');
        setUser(prev => ({ ...prev, credits: prev.credits + ASTRAL_COST }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleViewChange = (newView: AppView) => {
    setView(newView);
  };

  // Views
  const renderHome = () => (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-gradient-to-br from-mystic-800 to-mystic-900 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mystic-500/20 blur-3xl rounded-full"></div>
        <h2 className="text-xl font-bold mb-1 text-white">Daily Insight</h2>
        <p className="text-mystic-300 text-sm mb-4">Your spiritual energy is rising today.</p>
        <div className="flex items-center gap-4">
            <div className="bg-black/30 px-3 py-1 rounded-lg border border-white/5 text-xs text-gold-400 font-mono">
                STREAK: {user.streak} DAYS
            </div>
             <div className="text-xs text-mystic-300 flex items-center gap-1">
                Next bonus: <span className="text-white font-bold">Tomorrow</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => { vibrate('medium'); setView('tarot'); }} className="bg-mystic-800/50 p-4 rounded-xl border border-white/5 hover:bg-mystic-700/50 transition-all group text-left">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="font-bold text-white">Tarot</div>
            <div className="text-xs text-mystic-400 mt-1">Reveal your destiny</div>
            <div className="mt-2 text-xs font-mono text-gold-500">{TAROT_COST} Credits</div>
        </button>

        <button onClick={() => { vibrate('medium'); setView('dream'); }} className="bg-mystic-800/50 p-4 rounded-xl border border-white/5 hover:bg-mystic-700/50 transition-all group text-left">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Moon className="w-5 h-5 text-purple-300" />
            </div>
            <div className="font-bold text-white">Dream</div>
            <div className="text-xs text-mystic-400 mt-1">Decode the unknown</div>
            <div className="mt-2 text-xs font-mono text-gold-500">{DREAM_COST} Credits</div>
        </button>

        <button onClick={() => { vibrate('medium'); setView('astral'); }} className="col-span-2 bg-gradient-to-r from-mystic-800/50 to-blue-900/30 p-4 rounded-xl border border-white/5 hover:bg-mystic-700/50 transition-all group flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Compass className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex-1">
                <div className="font-bold text-white flex justify-between">
                    Astral Guide 
                    <span className="text-xs font-mono text-gold-500 font-normal">{ASTRAL_COST} Credits</span>
                </div>
                <div className="text-xs text-mystic-400 mt-1">Explore the etheric planes</div>
            </div>
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 text-white/90">Recent Journeys</h3>
        {user.history.length === 0 ? (
            <div className="text-center py-8 text-mystic-500 text-sm border border-dashed border-white/10 rounded-xl">
                No readings yet. Start your journey.
            </div>
        ) : (
            <div className="space-y-3">
                {user.history.slice(-3).reverse().map(h => (
                    <div key={h.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs text-mystic-400">
                            <span className="uppercase font-bold tracking-wider">{h.type}</span>
                            <span>{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-mystic-100 line-clamp-2">{h.summary}</p>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );

  const renderTarot = () => (
    <div className="p-4 pb-24 animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-center">Oracle Tarot</h2>
        <p className="text-center text-mystic-300 text-sm mb-6">Focus on your question...</p>

        {!tarotResult ? (
            <div className="space-y-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <input 
                        type="text" 
                        placeholder="What guides my path today?" 
                        className="w-full bg-transparent border-none outline-none text-center text-lg placeholder-mystic-600 text-white"
                        value={tarotInput}
                        onChange={(e) => setTarotInput(e.target.value)}
                    />
                </div>
                
                <div className="flex justify-center py-8">
                    <div className="relative w-48 h-72 bg-gradient-to-br from-mystic-700 to-black rounded-xl border-2 border-white/10 shadow-2xl flex items-center justify-center animate-float">
                        <div className="text-6xl opacity-20">?</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                </div>

                <Button onClick={runTarot} isLoading={isLoading} hapticEnabled={user.hapticEnabled}>
                    Draw Cards ({TAROT_COST} Credits)
                </Button>
            </div>
        ) : (
            <div className="space-y-8">
                 <div className="grid gap-8">
                    {tarotResult.cards.map((card, idx) => (
                        <div key={idx} className="relative group">
                            {/* Card Visual Placeholder */}
                            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative shadow-2xl border border-white/10 mb-4 transition-transform group-hover:scale-[1.02] duration-500">
                                <div className="absolute inset-0" style={getCardVisual(card.name + card.visualCue + idx)}></div>
                                
                                {/* Overlay Content */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
                                    <div className="text-[10px] font-bold text-gold-400 uppercase tracking-widest mb-1 opacity-90">{card.position}</div>
                                    <h3 className="text-2xl font-serif font-bold text-white mb-2 shadow-black drop-shadow-lg">{card.name}</h3>
                                    <div className="h-px w-12 bg-gold-500/50 mb-3"></div>
                                    <p className="text-xs text-white/80 italic line-clamp-2">{card.visualCue}</p>
                                </div>

                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            </div>

                            {/* Meaning Content */}
                            <div className="bg-mystic-800/40 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
                                <p className="text-sm text-mystic-100 leading-relaxed">{card.meaning}</p>
                            </div>
                        </div>
                    ))}
                 </div>
                 
                 <div className="bg-indigo-900/30 p-6 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                    <h3 className="font-bold text-indigo-300 mb-3 flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5" /> Oracle's Summary
                    </h3>
                    <p className="text-sm text-indigo-100 leading-relaxed font-light">{tarotResult.summary}</p>
                 </div>

                 <Button variant="outline" onClick={() => { vibrate('light'); setTarotResult(null); }} hapticEnabled={user.hapticEnabled}>New Reading</Button>
            </div>
        )}
    </div>
  );

  const renderDream = () => (
    <div className="p-4 pb-24">
        <h2 className="text-2xl font-bold mb-2 text-center">Dream Decoder</h2>
        <p className="text-center text-mystic-300 text-sm mb-6">Uncover the hidden messages...</p>

        {!dreamResult ? (
            <div className="space-y-6">
                <textarea 
                    className="w-full h-40 bg-mystic-800/50 rounded-xl border border-white/10 p-4 text-white placeholder-mystic-500 focus:ring-2 focus:ring-mystic-500 focus:outline-none resize-none"
                    placeholder="I was flying over a purple ocean, but my wings were heavy..."
                    value={dreamInput}
                    onChange={(e) => setDreamInput(e.target.value)}
                />
                <Button onClick={runDream} isLoading={isLoading} disabled={!dreamInput.trim()} hapticEnabled={user.hapticEnabled}>
                    Analyze Dream ({DREAM_COST} Credits)
                </Button>
            </div>
        ) : (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-mystic-800/80 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">Interpretation</h3>
                    <p className="text-sm text-mystic-100 leading-relaxed mb-4">{dreamResult.interpretation}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                        {dreamResult.themes.map(t => (
                            <button 
                                key={t} 
                                onClick={() => handleThemeClick(t)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-lg text-xs text-mystic-300 border border-white/5 transition-colors flex items-center gap-1 group"
                            >
                                <span className="text-indigo-400 group-hover:text-indigo-300">#</span>{t}
                            </button>
                        ))}
                    </div>

                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 mb-4">
                        <span className="text-xs text-gold-500 font-bold block mb-1">PSYCHOLOGICAL NOTE</span>
                        <p className="text-xs text-mystic-200">{dreamResult.psychologicalNote}</p>
                    </div>

                    <div className="flex items-center gap-3 justify-center pt-2 border-t border-white/5">
                        <span className="text-xs text-mystic-400">LUCKY NUMBERS:</span>
                        {dreamResult.luckyNumbers.map(n => (
                            <span key={n} className="w-8 h-8 rounded-full bg-gold-600/20 text-gold-400 flex items-center justify-center text-sm font-bold border border-gold-500/30">
                                {n}
                            </span>
                        ))}
                    </div>
                </div>
                <Button variant="outline" onClick={() => { vibrate('light'); setDreamResult(null); }} hapticEnabled={user.hapticEnabled}>Analyze Another</Button>
            </div>
        )}
    </div>
  );

  const renderAstral = () => (
      <div className="relative min-h-[calc(100vh-140px)]">
          {/* Dynamic Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0518] via-[#1B143F] to-[#0f0518] z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 animate-nebula z-0 mix-blend-screen bg-[length:200%_200%]"></div>
          
          {/* Stars */}
          <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
             {[...Array(30)].map((_, i) => (
                <div 
                    key={i} 
                    className="star"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 2 + 1}px`,
                        height: `${Math.random() * 2 + 1}px`,
                        '--duration': `${2 + Math.random() * 4}s`,
                        '--delay': `${Math.random() * 2}s`
                    } as React.CSSProperties}
                />
             ))}
          </div>

          <div className="relative z-10 p-4 pb-24">
             {/* Original Content */}
              <div className="flex items-center justify-center relative mb-2">
            <h2 className="text-2xl font-bold text-center text-blue-100">Astral Projection</h2>
            <button 
                onClick={() => { vibrate('light'); setAstralMusicEnabled(!astralMusicEnabled); }}
                className={`absolute right-0 p-2 rounded-full transition-all ${astralMusicEnabled ? 'bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-blue-500/40 hover:text-blue-400'}`}
                title="Toggle Ambient Meditation Music"
            >
                {astralMusicEnabled ? <Music2 className="w-5 h-5 animate-pulse" /> : <Music className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-center text-blue-300/70 text-sm mb-6">Explore the planes of consciousness...</p>

          {!astralResult ? (
              <div className="space-y-6">
                   <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                    <input 
                        type="text" 
                        placeholder="How do I leave my body?" 
                        className="w-full bg-transparent border-none outline-none text-center text-lg placeholder-blue-400/50 text-white"
                        value={astralInput}
                        onChange={(e) => setAstralInput(e.target.value)}
                    />
                </div>
                <div className="flex justify-center py-6">
                    <div className="relative w-32 h-32 rounded-full bg-blue-500/5 border border-blue-400/20 flex items-center justify-center animate-pulse-slow">
                        <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-125"></div>
                        <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                         <Compass className="w-10 h-10 text-blue-400 relative z-10" />
                    </div>
                </div>
                  <Button onClick={runAstral} isLoading={isLoading} className="from-blue-600 to-indigo-800 shadow-blue-900/40" hapticEnabled={user.hapticEnabled}>
                      Seek Guidance ({ASTRAL_COST} Credits)
                  </Button>
              </div>
          ) : (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-blue-950/40 p-6 rounded-xl border border-blue-400/20 backdrop-blur-md">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-blue-100">Guidance</h3>
                          <span className="text-[10px] uppercase tracking-widest text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded">{astralResult.plane}</span>
                      </div>
                      <p className="text-sm text-blue-50 leading-relaxed mb-6">{astralResult.guidance}</p>
                      
                      <div className="bg-black/20 p-4 rounded-lg border border-blue-400/10 mb-4">
                          <h4 className="text-xs font-bold text-blue-300 mb-2 uppercase flex items-center gap-2">
                            <Orbit className="w-3 h-3" /> Technique
                          </h4>
                          <p className="text-sm text-gray-300 italic">"{astralResult.technique}"</p>
                      </div>

                      <div className="flex gap-2 items-start bg-red-900/10 p-3 rounded-lg border border-red-500/10">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-200/80">{astralResult.safetyTip}</p>
                      </div>
                  </div>
                   <Button variant="outline" onClick={() => { vibrate('light'); setAstralResult(null); }} className="border-blue-500/50 text-blue-300 hover:bg-blue-900/30" hapticEnabled={user.hapticEnabled}>New Query</Button>
              </div>
          )}
          </div>
      </div>
  );

  const renderStore = () => (
    <div className="p-4 pb-24">
        <h2 className="text-2xl font-bold mb-2 text-center text-white">Crystal Store</h2>
        <p className="text-center text-mystic-300 text-sm mb-6">Purchase energy for your journey</p>

        {/* --- AdMob / Reward Ads Section --- */}
        <div className="mb-8">
            <button 
                onClick={handleWatchAd}
                className="w-full bg-gradient-to-r from-purple-900/80 to-indigo-900/80 p-4 rounded-xl border border-indigo-500/50 flex items-center justify-between shadow-lg shadow-indigo-900/30 group active:scale-95 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-white">Watch Ad</div>
                        <div className="text-xs text-indigo-200">Get 5 Free Credits</div>
                    </div>
                </div>
                <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">+5</span>
            </button>
        </div>

        {/* --- In-App Purchase Section --- */}
        <div className="space-y-4 mb-8">
            {[
                { amount: 50, price: "$0.99", id: "credits_small", popular: false },
                { amount: 200, price: "$2.99", id: "credits_medium", popular: true },
                { amount: 1000, price: "$9.99", id: "credits_large", popular: false }
            ].map((pkg, i) => (
                <div key={i} className={`relative bg-mystic-800/40 p-5 rounded-xl border ${pkg.popular ? 'border-gold-500/50 bg-gold-900/10' : 'border-white/10'} flex justify-between items-center`}>
                    {pkg.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">MOST POPULAR</div>}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Sparkles className={`w-5 h-5 ${pkg.popular ? 'text-gold-400' : 'text-mystic-300'}`} />
                        </div>
                        <div>
                            <div className="font-bold text-lg">{pkg.amount} Credits</div>
                            <div className="text-xs text-mystic-400">Unlock {Math.floor(pkg.amount / TAROT_COST)} Readings</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handlePurchase(pkg.amount, pkg.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${pkg.popular ? 'bg-gold-500 text-black hover:bg-gold-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {pkg.price}
                    </button>
                </div>
            ))}
        </div>

        {/* --- Compliance & Restoration Footer (Required by Play Store) --- */}
        <div className="space-y-4 pt-6 border-t border-white/5">
             <button className="w-full flex items-center justify-center gap-2 text-xs text-mystic-400 hover:text-white py-2">
                <RefreshCw className="w-3 h-3" /> Restore Purchases
             </button>
             
             <div className="flex justify-center gap-6 text-[10px] text-mystic-600">
                <button onClick={() => setLegalMode('terms')} className="hover:text-mystic-400">Terms of Service</button>
                <button onClick={() => setLegalMode('privacy')} className="hover:text-mystic-400">Privacy Policy</button>
                <button onClick={() => setLegalMode('support')} className="hover:text-mystic-400">Support</button>
             </div>
        </div>
    </div>
  );

  const renderProfile = () => (
      <div className="p-4 pb-24">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-mystic-500 to-indigo-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold shadow-lg shadow-mystic-500/30">
                A
            </div>
            <h2 className="text-xl font-bold">Seeker</h2>
            <p className="text-mystic-400 text-sm">Joined {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-mystic-800/30 rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
              <div className="p-4 flex justify-between items-center">
                  <span className="text-sm text-mystic-200">Current Credits</span>
                  <span className="font-bold text-gold-400">{user.credits}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <span className="text-sm text-mystic-200">Daily Streak</span>
                  <span className="font-bold text-white">{user.streak} Days</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <span className="text-sm text-mystic-200">Total Readings</span>
                  <span className="font-bold text-white">{user.history.length}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {user.soundEnabled ? <Volume2 className="w-4 h-4 text-mystic-300"/> : <VolumeX className="w-4 h-4 text-mystic-500"/>}
                    <span className="text-sm text-mystic-200">Sound Effects</span>
                  </div>
                  <button 
                    onClick={() => { vibrate('light'); setUser(prev => ({...prev, soundEnabled: !prev.soundEnabled})); }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${user.soundEnabled ? 'bg-gold-500' : 'bg-mystic-700'}`}
                  >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.soundEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
              </div>
               <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {user.hapticEnabled ? <Smartphone className="w-4 h-4 text-mystic-300"/> : <Smartphone className="w-4 h-4 text-mystic-500"/>}
                    <span className="text-sm text-mystic-200">Haptic Feedback</span>
                  </div>
                  <button 
                    onClick={() => { 
                        // Trigger vibration before turning it off, or after turning it on
                        if (!user.hapticEnabled) triggerHaptic('light'); 
                        setUser(prev => ({...prev, hapticEnabled: !prev.hapticEnabled})); 
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${user.hapticEnabled ? 'bg-gold-500' : 'bg-mystic-700'}`}
                  >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.hapticEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
              </div>
          </div>
          
          <button 
            onClick={() => {
                localStorage.removeItem('aetheria_user');
                setUser(INITIAL_STATE);
                setView('home');
            }}
            className="w-full mt-6 py-3 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Reset Account Data
          </button>
      </div>
  );
  
  // --- LEGAL / SUPPORT CONTENT ---
  const renderLegalContent = () => {
      if (!legalMode) return null;
      
      const content = {
          terms: (
              <>
                  <h3 className="font-bold text-lg mb-2">Terms of Service</h3>
                  <p className="mb-4">By using Aetheria, you agree to these terms. Aetheria is for entertainment purposes only.</p>
                  <ul className="list-disc pl-4 space-y-2">
                      <li>Readings are AI-generated and not professional advice.</li>
                      <li>Credits purchased are final and non-refundable.</li>
                      <li>We do not guarantee the accuracy of spiritual insights.</li>
                      <li>You must be 18+ to make purchases.</li>
                  </ul>
              </>
          ),
          privacy: (
              <>
                  <h3 className="font-bold text-lg mb-2">Privacy Policy</h3>
                  <p className="mb-4">Your privacy is important to us. Here is how we handle your data:</p>
                  <ul className="list-disc pl-4 space-y-2">
                      <li>We do not store your reading history on external servers; it stays on your device (Local Storage).</li>
                      <li>Dream and Tarot inputs are sent to Gemini API for processing but not retained by us.</li>
                      <li>We do not track location or personal identifiers.</li>
                  </ul>
              </>
          ),
          support: (
              <>
                  <h3 className="font-bold text-lg mb-2">Support</h3>
                  <p className="mb-4">Need help with your account or purchases?</p>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                      <div className="text-xs text-mystic-400 mb-1">USER ID</div>
                      <div className="font-mono text-white select-all">User-{Math.floor(Math.random() * 100000)}</div>
                  </div>
                  <p>Contact us at:</p>
                  <a href="mailto:support@aetheria-app.com" className="text-gold-400 font-bold hover:underline">support@aetheria-app.com</a>
              </>
          )
      };

      return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-mystic-900 w-full max-w-md max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl p-6 relative flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex items-center gap-2 text-mystic-300">
                        {legalMode === 'terms' && <FileText className="w-5 h-5" />}
                        {legalMode === 'privacy' && <Shield className="w-5 h-5" />}
                        {legalMode === 'support' && <LifeBuoy className="w-5 h-5" />}
                        <span className="uppercase tracking-widest text-xs font-bold">{legalMode}</span>
                    </div>
                    <button 
                        onClick={() => setLegalMode(null)}
                        className="p-1 text-white/50 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="overflow-y-auto text-sm text-mystic-200 leading-relaxed pr-2">
                    {content[legalMode]}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-mystic-500 shrink-0">
                    Last updated: October 2023
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#0f0518] text-white selection:bg-mystic-500/30 relative">
      <CreditDisplay credits={user.credits} onAddCredits={() => setView('store')} />

      {/* --- ONBOARDING TUTORIAL --- */}
      {showTutorial && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-fade-in">
             <div className="max-w-sm w-full bg-gradient-to-b from-mystic-800 to-black border border-gold-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                 {/* Decorative background glow */}
                 <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-mystic-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                 <div className="relative z-10 text-center">
                     <div className="w-16 h-16 bg-gold-500/20 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-gold-500/10">
                         <Sparkles className="w-8 h-8 text-gold-400" />
                     </div>
                     
                     <h2 className="text-2xl font-bold text-white mb-2">Welcome, Seeker.</h2>
                     <p className="text-mystic-200 text-sm mb-8 leading-relaxed">
                         Aetheria connects you to ancient wisdom through modern intelligence.
                     </p>

                     <div className="space-y-4 text-left mb-8">
                         <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                             <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                 <Sparkles className="w-5 h-5 text-indigo-300" />
                             </div>
                             <div>
                                 <div className="font-bold text-sm text-white">Tarot</div>
                                 <div className="text-xs text-mystic-400">Reveal your past, present, and future.</div>
                             </div>
                         </div>

                         <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                             <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                 <Moon className="w-5 h-5 text-purple-300" />
                             </div>
                             <div>
                                 <div className="font-bold text-sm text-white">Dreams</div>
                                 <div className="text-xs text-mystic-400">Decode hidden symbols and messages.</div>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                             <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                 <Compass className="w-5 h-5 text-blue-300" />
                             </div>
                             <div>
                                 <div className="font-bold text-sm text-white">Astral</div>
                                 <div className="text-xs text-mystic-400">Explore higher planes of consciousness.</div>
                             </div>
                         </div>
                     </div>

                     <div className="bg-gold-500/10 p-3 rounded-lg border border-gold-500/20 mb-6 flex items-start gap-3 text-left">
                        <Info className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-gold-100/80">
                            <strong>Economy:</strong> Every insight requires energy (Credits). We have gifted you 50 credits to begin.
                        </div>
                     </div>

                     <button 
                        onClick={handleFinishTutorial}
                        className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-gold-500/20 transition-all active:scale-95"
                    >
                        Awaken
                    </button>
                 </div>
             </div>
        </div>
      )}
      
      {showBonusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-mystic-800 to-indigo-900 w-full max-w-sm rounded-2xl border border-gold-500/30 shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>
                <div className="w-20 h-20 bg-gold-500/20 rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce">
                    <Gift className="w-10 h-10 text-gold-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Daily Login Bonus!</h2>
                <p className="text-mystic-200 text-sm mb-6">The stars have aligned for your return.</p>
                
                <div className="bg-black/30 p-4 rounded-xl mb-6 border border-white/5">
                    <div className="text-gold-400 font-bold text-3xl mb-1">+{DAILY_BONUS_AMOUNT}</div>
                    <div className="text-xs uppercase tracking-widest text-mystic-400">Credits Added</div>
                </div>

                <button 
                    onClick={claimBonus}
                    className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-gold-500/20 transition-all active:scale-95"
                >
                    Claim Reward
                </button>
            </div>
        </div>
      )}
      
      {/* --- THEME EXPLORER MODAL --- */}
      {selectedTheme && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-indigo-950 to-mystic-950 w-full max-w-md rounded-2xl border border-indigo-500/30 shadow-2xl p-6 relative overflow-hidden">
                <button 
                    onClick={closeThemeModal}
                    className="absolute top-4 right-4 text-white/50 hover:text-white p-1"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20">
                        <BookOpen className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                        <div className="text-xs text-indigo-400 uppercase tracking-widest">Symbol</div>
                        <h2 className="text-2xl font-bold text-white capitalize">{selectedTheme}</h2>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Insight Section */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-h-[100px] flex items-center justify-center relative">
                        {isThemeLoading ? (
                             <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-indigo-300 animate-pulse">Consulting the archives...</span>
                             </div>
                        ) : (
                             <p className="text-sm text-mystic-100 leading-relaxed italic text-center">
                                "{themeInsight}"
                             </p>
                        )}
                        <div className="absolute -top-3 left-4 bg-indigo-900 px-2 py-0.5 text-[10px] font-bold text-indigo-200 rounded border border-indigo-500/30">
                            MYSTICAL DEFINITION
                        </div>
                    </div>

                    {/* Related Dreams Section */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Search className="w-4 h-4 text-mystic-400" /> Found in Journal
                        </h3>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                            {user.history.filter(h => h.type === 'dream' && h.summary.toLowerCase().includes(selectedTheme.toLowerCase())).length > 0 ? (
                                user.history
                                    .filter(h => h.type === 'dream' && h.summary.toLowerCase().includes(selectedTheme.toLowerCase()))
                                    .slice(0, 5) // Limit to top 5
                                    .map(h => (
                                        <div key={h.id} className="bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                            <div className="flex justify-between text-[10px] text-mystic-500 mb-1">
                                                <span>{new Date(h.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-mystic-300 line-clamp-2">{h.summary}</p>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-4 text-mystic-600 text-xs italic border border-dashed border-white/5 rounded-lg">
                                    No other recorded dreams match this symbol.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- LEGAL MODAL --- */}
      {renderLegalContent()}

      <main className="max-w-md mx-auto min-h-[calc(100vh-140px)]">
        {view === 'home' && renderHome()}
        {view === 'tarot' && renderTarot()}
        {view === 'dream' && renderDream()}
        {view === 'astral' && renderAstral()}
        {view === 'store' && renderStore()}
        {view === 'profile' && renderProfile()}
      </main>

      <NavBar currentView={view} setView={handleViewChange} hapticEnabled={user.hapticEnabled} />
    </div>
  );
}