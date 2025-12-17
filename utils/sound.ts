// Simple synth using Web Audio API to avoid external assets

let audioCtx: AudioContext | null = null;
let ambienceNodes: { oscs: OscillatorNode[], gain: GainNode } | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playSpendSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    // High pitched "sparkle" or "coin" sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) { console.error(e); }
};

export const playCompletionSound = () => {
    try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();

        // Mystical chord (C minor add 9) for revelation
        // Frequencies: C4, Eb4, G4, D5
        const freqs = [261.63, 311.13, 392.00, 587.33]; 
        
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle'; // Softer, more flute-like than sine
            osc.frequency.value = f;
            
            // Stagger starts slightly for arpeggiated "magic" feel
            const start = ctx.currentTime + (i * 0.06);
            const duration = 2.5;
            
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.04, start + 0.2); // Slow attack
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration); // Long tail
            
            osc.start(start);
            osc.stop(start + duration);
        });
    } catch (e) { console.error(e); }
}

export const playPurchaseSound = () => {
    try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        
        // Success "Level Up" style major triad (C Major)
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        freqs.forEach((f, i) => {
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             osc.connect(gain);
             gain.connect(ctx.destination);
             
             osc.type = 'sine';
             osc.frequency.value = f;
             
             const start = ctx.currentTime + (i * 0.08);
             
             gain.gain.setValueAtTime(0, start);
             gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
             gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
             
             osc.start(start);
             osc.stop(start + 0.5);
        });
    } catch (e) { console.error(e); }
}

export const startAstralAmbience = () => {
    try {
        if (ambienceNodes) return; // Already playing
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Slow fade in

        const oscs: OscillatorNode[] = [];
        
        // Binaural Drone setup:
        // 110Hz (A2) and 114Hz creates a 4Hz beat frequency (Theta waves - associated with deep meditation/REM)
        // 55Hz (A1) adds depth
        const freqs = [110, 114, 55]; 
        
        freqs.forEach(f => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            osc.connect(masterGain);
            osc.start();
            oscs.push(osc);
        });

        ambienceNodes = { oscs, gain: masterGain };
    } catch (e) { console.error("Ambience Error", e); }
};

export const stopAstralAmbience = () => {
    try {
        if (!ambienceNodes) return;
        const { oscs, gain } = ambienceNodes;
        const ctx = getContext();
        
        // Smooth fade out
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

        // Stop oscillators after fade
        setTimeout(() => {
            oscs.forEach(o => {
                try { o.stop(); } catch(e){}
            });
            gain.disconnect();
        }, 1600);

        ambienceNodes = null;
    } catch (e) { console.error("Ambience Stop Error", e); }
};