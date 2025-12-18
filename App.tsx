
//this is a new test

import React, { useState, useEffect } from 'react';
import { CreditDisplay } from './components/CreditDisplay.tsx';
import { NavBar } from './components/NavBar.tsx';
import { Button } from './components/Button.tsx';
import { AppView, UserState, TarotResult, DreamResult, AstralResult, TarotCard } from './types.ts';
import { getTarotReading, getDreamInterpretation, getAstralGuidance, generateCardImage } from './services/geminiService.ts';
import { Sparkles, Moon, Eye, User, Compass, Play, X, CheckCircle2, Ticket, Zap, Loader2 } from 'lucide-react';
import { playSpendSound, playCompletionSound, playPurchaseSound } from './utils/sound.ts';
import { triggerHaptic } from './utils/haptics.ts';

const TAROT_COST = 20;
const DREAM_COST = 15;
const ASTRAL_COST = 25;

const INITIAL_STATE: UserState = {
  credits: 50,
  streak: 1,
  lastDailyBonus: new Date().toISOString(),
  history: [],
  soundEnabled: true,
  hapticEnabled: true,
  hasSeenTutorial: false,
  isPromoActive: true
};

const CardShuffle = () => (
  <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
    <div className="relative w-32 h-48 mb-12">
      <div className="absolute inset-0 bg-mystic-800 rounded-xl border border-white/10 shadow-2xl opacity-50 transform -rotate-6"></div>
      <div className="absolute inset-0 bg-mystic-700 rounded-xl border border-white/20 shadow-2xl animate-shuffle-left">
        <div className="w-full h-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white/10" />
        </div>
      </div>
      <div className="absolute inset-0 bg-mystic-600 rounded-xl border border-white/30 shadow-2xl animate-shuffle-right">
        <div className="w-full h-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white/20" />
        </div>
      </div>
      <div className="absolute inset-0 bg-mystic-500 rounded-xl border border-white/40 shadow-2xl z-20 flex flex-col items-center justify-center">
        <div className="w-16 h-24 border-2 border-white/20 rounded-lg flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white/40 animate-pulse" />
        </div>
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-lg font-bold text-mystic-100 tracking-widest mb-2">CONSULTING THE ARCANA</h3>
      <p className="text-xs text-mystic-400 animate-pulse italic">The mists are parting...</p>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [user, setUser] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem('aetheria_user');
      return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tarotResult, setTarotResult] = useState<TarotResult | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [dreamInput, setDreamInput] = useState('');
  const [dreamResult, setDreamResult] = useState<DreamResult | null>(null);
  const [tarotInput, setTarotInput] = useState('');
  const [astralInput, setAstralInput] = useState('');
  const [astralResult, setAstralResult] = useState<AstralResult | null>(null);
  const [showRefillModal, setShowRefillModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('aetheria_user', JSON.stringify(user));
  }, [user]);

  const vibrate = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (user.hapticEnabled) triggerHaptic(type);
  };

  const spendCredits = (cost: number): boolean => {
    if (user.credits < cost) {
      vibrate('error');
      setShowRefillModal(true);
      return false;
    }
    if (user.soundEnabled) playSpendSound();
    vibrate('heavy');
    setUser(prev => ({ ...prev, credits: prev.credits - cost }));
    return true;
  };

  const handleWatchAd = () => {
    vibrate('light');
    if (confirm("Watching Reward Video...\n(Granting 5 Free Credits)")) {
      if (user.soundEnabled) playPurchaseSound();
      vibrate('success');
      setUser(prev => ({ ...prev, credits: prev.credits + 5 }));
    }
  };

  const handlePurchase = (totalAmount: number, productId: string) => {
    vibrate('light');
    if (confirm(`Authorize Payment for ${productId}?`)) {
      if (user.soundEnabled) playPurchaseSound();
      vibrate('success');
      setUser(prev => ({ ...prev, credits: prev.credits + totalAmount }));
      setShowRefillModal(false);
    }
  };

  const runTarot = async () => {
    const input = tarotInput.trim();
    if (!input) return;
    if (!spendCredits(TAROT_COST)) return;
    
    setIsLoading(true);
    setTarotResult(null);
    try {
      const result = await getTarotReading(input);
      setTarotResult(result);
      if (user.soundEnabled) playCompletionSound();
      vibrate('success');
      
      setIsGeneratingImages(true);
      const imagePromises = result.cards.map(async (card, index) => {
        try {
          const url = await generateCardImage(card.visualCue);
          setTarotResult(prev => {
            if (!prev) return prev;
            const newCards = [...prev.cards];
            newCards[index] = { ...newCards[index], imageUrl: url };
            return { ...prev, cards: newCards };
          });
          return url;
        } catch (err) {
          console.warn("Card image failed:", err);
          return '';
        }
      });
      await Promise.all(imagePromises);
    } catch (e) {
      console.error(e);
      setUser(prev => ({ ...prev, credits: prev.credits + TAROT_COST }));
    } finally { 
      setIsLoading(false); 
      setIsGeneratingImages(false);
    }
  };

  const runDream = async () => {
    const input = dreamInput.trim();
    if (!input || !spendCredits(DREAM_COST)) return;
    setIsLoading(true);
    setDreamResult(null);
    try {
      const result = await getDreamInterpretation(input);
      setDreamResult(result);
      if (user.soundEnabled) playCompletionSound();
      vibrate('success');
    } catch (e) {
      setUser(prev => ({ ...prev, credits: prev.credits + DREAM_COST }));
    } finally { setIsLoading(false); }
  };

  const runAstral = async () => {
    const input = astralInput.trim();
    if (!input || !spendCredits(ASTRAL_COST)) return;
    setIsLoading(true);
    setAstralResult(null);
    try {
      const result = await getAstralGuidance(input);
      setAstralResult(result);
      if (user.soundEnabled) playCompletionSound();
      vibrate('success');
    } catch (e) {
      setUser(prev => ({ ...prev, credits: prev.credits + ASTRAL_COST }));
    } finally { setIsLoading(false); }
  };

  const renderStore = (isModal = false) => (
    <div className={`p-4 ${!isModal ? 'pb-24' : ''}`}>
      <h2 className="text-2xl font-bold mb-2 text-center text-white">Crystal Store</h2>
      <div className="mb-6 bg-green-500/10 border border-green-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-400">WELCOME50 ACTIVE</div>
            <div className="text-[10px] text-green-300 opacity-70">Pre-applied +50% Bonus Energy</div>
          </div>
        </div>
        <CheckCircle2 className="w-6 h-6 text-green-400" />
      </div>
      <button onClick={handleWatchAd} className="w-full mb-6 bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between group active:scale-95 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Play className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-sm">Free Recharge</div>
            <div className="text-[10px] text-mystic-500">Watch video for 5 Energy</div>
          </div>
        </div>
        <div className="bg-gold-500 text-black font-bold text-[10px] px-2 py-1 rounded-lg">+5 CR</div>
      </button>
      <div className="space-y-4">
        {[ 
          { base: 50, bonus: 25, price: "$0.99", id: "pkg_75" }, 
          { base: 200, bonus: 100, price: "$2.99", id: "pkg_300", popular: true }, 
          { base: 1000, bonus: 500, price: "$9.99", id: "pkg_1500" } 
        ].map((pkg, i) => (
          <div key={i} className={`relative bg-mystic-800/40 p-5 rounded-2xl border ${pkg.popular ? 'border-gold-500/50 bg-gold-900/10' : 'border-white/10'} flex justify-between items-center`}>
            {pkg.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-xl">BEST DEAL</div>}
            <div>
              <div className="font-bold text-xl text-white">{pkg.base + pkg.bonus} Credits</div>
              <div className="text-[10px] text-gold-400 font-bold uppercase tracking-widest mt-1">
                {pkg.base} + {pkg.bonus} PROMO BONUS
              </div>
            </div>
            <button 
              onClick={() => handlePurchase(pkg.base + pkg.bonus, pkg.id)} 
              className={`px-4 py-2 rounded-xl font-bold text-sm shadow-xl active:scale-90 transition-transform ${pkg.popular ? 'bg-gold-500 text-black' : 'bg-white/10 text-white border border-white/10'}`}
            >
              {pkg.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0518] text-white selection:bg-mystic-500/30 relative">
      <CreditDisplay credits={user.credits} onAddCredits={() => setView('store')} />
      {showRefillModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-mystic-900 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-mystic-500 to-indigo-600 p-6 text-center relative">
              <button onClick={() => setShowRefillModal(false)} className="absolute top-4 right-4 text-white/50"><X className="w-5 h-5" /></button>
              <Zap className="w-10 h-10 text-white mx-auto mb-2 animate-pulse" />
              <h3 className="text-xl font-bold">Low Energy</h3>
              <p className="text-xs text-white/70">Recharge to continue your spiritual journey.</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto no-scrollbar">{renderStore(true)}</div>
          </div>
        </div>
      )}
      <main className="max-w-md mx-auto min-h-[calc(100vh-140px)]">
        {view === 'home' && (
          <div className="p-4 space-y-6 pb-24">
            <div className="bg-gradient-to-br from-mystic-800 to-mystic-900 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-mystic-500/20 blur-3xl rounded-full"></div>
              <h2 className="text-xl font-bold mb-1">Aetheria Gate</h2>
              <p className="text-mystic-300 text-sm">Divine Energy: <span className="text-white font-bold">{user.credits} CR</span></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('tarot')} className="bg-mystic-800/50 p-5 rounded-2xl border border-white/5 text-left active:scale-95 transition-all group">
                <Sparkles className="w-6 h-6 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-white">Tarot Oracle</div>
                <div className="text-[10px] text-gold-500 font-mono mt-1 uppercase">{TAROT_COST} CR</div>
              </button>
              <button onClick={() => setView('dream')} className="bg-mystic-800/50 p-5 rounded-2xl border border-white/5 text-left active:scale-95 transition-all group">
                <Moon className="w-6 h-6 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-white">Dream Weaver</div>
                <div className="text-[10px] text-gold-500 font-mono mt-1 uppercase">{DREAM_COST} CR</div>
              </button>
              <button onClick={() => setView('astral')} className="col-span-2 bg-mystic-800/50 p-5 rounded-2xl border border-white/5 flex items-center gap-4 active:scale-95 transition-all group">
                <Compass className="w-8 h-8 text-blue-400 group-hover:rotate-12 transition-transform" />
                <div className="flex-1">
                  <div className="font-bold">Astral Travel</div>
                  <div className="text-[10px] text-mystic-400 italic">Beyond the physical realm</div>
                </div>
                <div className="text-xs font-mono text-gold-500 uppercase">{ASTRAL_COST} CR</div>
              </button>
            </div>
          </div>
        )}
        {view === 'tarot' && (
          <div className="p-4 space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-center">Tarot Oracle</h2>
            {isLoading && !tarotResult && <CardShuffle />}
            {!isLoading && !tarotResult && (
              <div className="space-y-4">
                <div className="bg-mystic-900 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Your Specific Question</p>
                  <input type="text" placeholder="e.g. Will my business grow?" className="w-full bg-transparent text-white focus:outline-none" value={tarotInput} onChange={(e) => setTarotInput(e.target.value)} />
                </div>
                <Button onClick={runTarot} isLoading={isLoading} disabled={!tarotInput.trim()}>Unlock Reading ({TAROT_COST} CR)</Button>
              </div>
            )}
            {tarotResult && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20 italic text-xs text-center text-indigo-200">
                  "Reading for: {tarotInput}"
                </div>
                {tarotResult.cards.map((card, i) => (
                  <div key={i} className="bg-mystic-800/40 rounded-3xl overflow-hidden border border-white/5">
                    <div className="aspect-[3/4] bg-mystic-950 relative overflow-hidden group">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover animate-fade-in" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-mystic-900 to-black">
                          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4 opacity-50" />
                          <div className="text-[10px] font-bold text-indigo-400/50 uppercase tracking-widest animate-pulse">Manifesting Arcana...</div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{card.position}</div>
                        <div className="font-bold text-xl text-white drop-shadow-lg">{card.name}</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm leading-relaxed text-mystic-100">{card.meaning}</p>
                    </div>
                  </div>
                ))}
                <div className="p-8 bg-gradient-to-b from-indigo-900/30 to-mystic-900/40 rounded-3xl border border-indigo-500/30 text-center relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
                   <h4 className="text-indigo-400 font-bold text-xs uppercase mb-4 tracking-widest">Oracle's Synthesis</h4>
                   <p className="italic text-sm leading-relaxed text-mystic-200">{tarotResult.summary}</p>
                </div>
                <Button variant="secondary" onClick={() => { setTarotResult(null); setTarotInput(''); }}>Return to Gate</Button>
              </div>
            )}
          </div>
        )}
        {view === 'dream' && (
          <div className="p-4 space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-center">Dream Weaver</h2>
            {!dreamResult ? (
              <div className="space-y-4">
                <div className="bg-mystic-900 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-purple-400 uppercase mb-2">Your Dream Vision</p>
                  <textarea placeholder="Tell the weaver what you saw..." className="w-full bg-transparent text-white focus:outline-none min-h-[180px]" value={dreamInput} onChange={(e) => setDreamInput(e.target.value)} />
                </div>
                <Button onClick={runDream} isLoading={isLoading} disabled={!dreamInput.trim()}>Interpret Dream ({DREAM_COST} CR)</Button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-mystic-800/40 p-8 rounded-3xl border border-white/5 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <h4 className="text-purple-400 font-bold uppercase text-xs tracking-widest">Interpretation</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-mystic-100 mb-8">{dreamResult.interpretation}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase mb-2">Lucky Path</div>
                      <div className="font-mono text-gold-400 font-bold tracking-widest">{dreamResult.luckyNumbers.join(', ')}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase mb-2">Themes</div>
                      <div className="text-[10px] font-bold text-purple-300 truncate">{dreamResult.themes.join(', ')}</div>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => { setDreamResult(null); setDreamInput(''); }}>New Dream</Button>
              </div>
            )}
          </div>
        )}
        {view === 'astral' && (
          <div className="p-4 space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-center">Astral Guide</h2>
            {!astralResult ? (
              <div className="space-y-4">
                 <div className="bg-mystic-900 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-2">Astral Inquiry</p>
                  <input type="text" placeholder="Where do you seek to travel?" className="w-full bg-transparent text-white focus:outline-none" value={astralInput} onChange={(e) => setAstralInput(e.target.value)} />
                </div>
                <Button onClick={runAstral} isLoading={isLoading} disabled={!astralInput.trim()}>Seek Guidance ({ASTRAL_COST} CR)</Button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-mystic-800/40 p-8 rounded-3xl border border-white/5">
                  <div className="text-xs font-bold text-blue-400 uppercase mb-4 tracking-widest">{astralResult.plane}</div>
                  <p className="text-sm leading-relaxed mb-6">{astralResult.guidance}</p>
                  <div className="p-5 bg-blue-900/20 rounded-2xl border border-blue-500/20 mb-4">
                    <div className="text-[10px] font-bold text-blue-300 uppercase mb-2">Projection Technique</div>
                    <p className="text-xs leading-relaxed italic">{astralResult.technique}</p>
                  </div>
                  <div className="text-xs text-red-300/60 flex items-start gap-2">
                    <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Safety: {astralResult.safetyTip}</span>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => { setAstralResult(null); setAstralInput(''); }}>Return to Portal</Button>
              </div>
            )}
          </div>
        )}
        {view === 'store' && renderStore()}
        {view === 'profile' && (
          <div className="p-4 pb-24">
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-tr from-mystic-800 to-indigo-900 border border-white/10 rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl relative">
                <User className="w-12 h-12 text-mystic-400" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center border-2 border-mystic-900">
                  <CheckCircle2 className="w-4 h-4 text-black" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white tracking-widest">DIVINE SEEKER</h2>
              <div className="text-[10px] text-mystic-500 font-mono mt-1">EST. 2024</div>
            </div>
            <div className="bg-mystic-800/30 rounded-3xl overflow-hidden border border-white/5 divide-y divide-white/5">
              <div className="p-6 flex justify-between items-center">
                <span className="text-mystic-300 font-medium">Spiritual Energy</span>
                <span className="font-bold text-gold-400 text-2xl">{user.credits} CR</span>
              </div>
              <div className="p-6 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-mystic-300 font-medium">Active Blessing</span>
                  <span className="text-[10px] text-green-400 font-bold">WELCOME50 (+50%)</span>
                </div>
                <Ticket className="w-5 h-5 text-green-400" />
              </div>
              <div className="p-6 flex justify-between items-center">
                <span className="text-mystic-300 font-medium">Haptic Feedback</span>
                <button 
                  onClick={() => setUser(prev => ({...prev, hapticEnabled: !prev.hapticEnabled}))}
                  className={`w-14 h-7 rounded-full relative transition-all duration-500 ${user.hapticEnabled ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${user.hapticEnabled ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            <div className="mt-8 bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10 text-center">
                <p className="text-[10px] text-indigo-300 leading-relaxed">Your journey through Aetheria is private and secure. All readings are destroyed upon closing the app unless saved to your spirit.</p>
            </div>
          </div>
        )}
      </main>
      <NavBar currentView={view} setView={setView} hapticEnabled={user.hapticEnabled} />
    </div>
  );
}
