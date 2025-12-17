export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    // Check if navigator and vibrate API exist
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    
    try {
        switch (pattern) {
            case 'light': 
                navigator.vibrate(10); // Subtle tick for buttons
                break;
            case 'medium': 
                navigator.vibrate(30); // Navigation / Tabs
                break;
            case 'heavy': 
                navigator.vibrate(60); // Significant action
                break;
            case 'success': 
                navigator.vibrate([10, 50, 20]); // Da-da-da
                break;
            case 'error': 
                navigator.vibrate([50, 30, 50, 30]); // Buzz-buzz
                break;
        }
    } catch (e) {
        // Ignore errors on devices that don't support or block vibration
    }
};