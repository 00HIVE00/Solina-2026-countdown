// --- INITIALIZATION ---
let isTestMode = false;
const realTarget = new Date('January 1, 2026 00:00:00').getTime();
let targetTime = realTarget;

const countdownContainer = document.getElementById('countdown');
const celebrationContainer = document.getElementById('celebration');
const twentySecondBtn = document.getElementById('twenty-second-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const particlesContainer = document.getElementById('particlesContainer');

let previousValues = { days: -1, hours: -1, minutes: -1, seconds: -1 };
let finalCountdownActive = false;
let ultraIntenseActive = false;
let fireworkInterval = null;
let celebrationFireworkInterval = null;
let whiteSparkInterval = null;
let goldenBurstInterval = null;
let flyingFireworkInterval = null;
let bigFireworkInterval = null;
let celebrationAnimationInterval = null;

// Audio context for sounds and music
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let celebrationMusicInterval = null;

function playTick(frequency = 440, volume = 0.3) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Sound for 20-second countdown start
function playTwentySecondSound() {
    // Play a rising chord sequence to signal the final countdown
    const frequencies = [392.00, 493.88, 587.33]; // G, B, D chord (rising)
    frequencies.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime); // Increased from 0.2
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
        }, i * 80);
    });
    
    // Add a deeper bass note for emphasis
    setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = 261.63; // C4
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime); // Increased from 0.25
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    }, 100);
}

// Intense sound for final 10 seconds
function playIntenseSound() {
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G chord
    frequencies.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime); // Increased from 0.15
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }, i * 100);
    });
}

// Firework sound generator - creates realistic firework explosion sounds
function playFireworkSound() {
    // Create noise buffer for firework sound
    const bufferSize = audioCtx.sampleRate * 0.1; // 0.1 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    // Create noise source
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // Create filter for more realistic firework sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200 + Math.random() * 300; // Random frequency between 200-500Hz
    filter.Q.value = 1;
    
    // Create gain for volume envelope (explosion shape)
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01); // Quick attack - Increased from 0.3
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15); // Fast decay
    
    // Connect: noise -> filter -> gain -> destination
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
    noise.stop(audioCtx.currentTime + 0.15);
}

// Celebration firework sounds - continuous firework explosions
function startCelebrationMusic() {
    if (celebrationMusicInterval) return;
    
    // Initial burst of firework sounds
for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            playFireworkSound();
        }, i * 100);
    }
    
    // Continuous firework sounds during celebration
    celebrationMusicInterval = setInterval(() => {
        // Play 1-3 firework sounds randomly
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                playFireworkSound();
            }, i * 50);
        }
    }, 400 + Math.random() * 300); // Random interval between 400-700ms for more natural feel
}

function stopCelebrationMusic() {
    if (celebrationMusicInterval) {
        clearInterval(celebrationMusicInterval);
        celebrationMusicInterval = null;
    }
}

// --- OPTIMIZED FIREWORK GENERATOR ---
let activeFireworks = 0;
const MAX_ACTIVE_FIREWORKS = 80; // Reduced limit to prevent lag

function createFirework(x, y, intensity = 1, size = 1) {
    // Limit active fireworks
    if (activeFireworks >= MAX_ACTIVE_FIREWORKS) return;
    
    // More colorful palette during final countdown
    const elegantColors = finalCountdownActive 
        ? ['#ff0066', '#ff6600', '#ffcc00', '#00ffcc', '#0066ff', '#ff00ff', '#00ff00', '#ffff00', '#ff1493', '#00ffff']
        : ['#d4af37', '#ffffff', '#f1e5ac', '#40e0d0', '#ff0080', '#ff8c00', '#9d4edd']; 
    // Particle count increases with size (reduced for performance)
    const particles = Math.floor(10 * Math.min(intensity, 1.5) * size);
    
    for (let i = 0; i < particles; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        firework.style.background = elegantColors[Math.floor(Math.random() * elegantColors.length)];
        
        // Size affects particle size
        const particleSize = 4 * size;
        firework.style.width = particleSize + 'px';
        firework.style.height = particleSize + 'px';
        firework.style.boxShadow = `0 0 ${8 * size}px ${firework.style.background}`;
        
        const angle = (Math.PI * 2 * i) / particles;
        const velocity = (50 + Math.random() * 30) * intensity * size;
        firework.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
        firework.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
        
        document.body.appendChild(firework);
        activeFireworks++;
        
        // Optimized cleanup
        setTimeout(() => {
            if (firework.parentNode) {
                firework.remove();
                activeFireworks--;
            }
        }, 800 * size);
    }
}

// Create multiple fireworks at once (throttled)
function createFireworkBurst(x, y, count = 3, intensity = 1, size = 1) {
    // Limit burst count to prevent lag
    const limitedCount = Math.min(count, 4);
    for (let i = 0; i < limitedCount; i++) {
        setTimeout(() => {
            if (activeFireworks < MAX_ACTIVE_FIREWORKS) {
                const offsetX = x + (Math.random() - 0.5) * 80;
                const offsetY = y + (Math.random() - 0.5) * 80;
                createFirework(offsetX, offsetY, intensity, size);
            }
        }, i * 150);
    }
}

// Ambient fireworks throughout the countdown (throttled)
let ambientFireworkInterval = null;
function startAmbientFireworks() {
    if (ambientFireworkInterval) return;
    
    ambientFireworkInterval = setInterval(() => {
        if (!finalCountdownActive && activeFireworks < MAX_ACTIVE_FIREWORKS * 0.5) {
    const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.7;
            createFirework(x, y, 0.7);
        }
    }, 3000); // Every 3 seconds (reduced frequency)
}

startAmbientFireworks();

// --- 2. CORE LOGIC ---
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetTime - now;
    const totalSeconds = Math.floor(distance / 1000);

    if (distance <= 0) {
        triggerCelebration();
        return;
    }

    // Sound logic: Play tick every second
    const currentSec = Math.floor((distance % (1000 * 60)) / 1000);
    if (previousValues.seconds !== currentSec) {
        const pitch = ultraIntenseActive ? 880 : 440;
        playTick(pitch);
    }

    // PHASE 1: 20 Seconds Left - Only on Dec 31st at 11:59:40 PM (or in test mode)
    if (totalSeconds <= 20 && !finalCountdownActive) {
        if (isTestMode) {
            // In test mode, enter final countdown immediately
            enterFinalCountdownMode();
        } else {
            // In real mode, only trigger on Dec 31st at 11:59 PM
            const now = new Date();
            const currentDate = now.getDate();
            const currentMonth = now.getMonth(); // 11 = December (0-indexed)
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Check if it's December 31st, 11:59 PM
            if (currentMonth === 11 && currentDate === 31 && currentHour === 23 && currentMinute === 59) {
                enterFinalCountdownMode();
                // Keep the 20s button visible during actual final countdown
                if (twentySecondBtn) {
                    twentySecondBtn.style.display = 'block';
                }
            }
        }
    }

    // PHASE 2: 10 Seconds Left
    if (totalSeconds <= 10 && !ultraIntenseActive) {
        enterUltraIntenseMode();
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = currentSec;

    const values = { days, hours, minutes, seconds };
    Object.keys(values).forEach(key => {
        const el = document.getElementById(key);
        if (el && previousValues[key] !== values[key]) {
            el.textContent = String(values[key]).padStart(2, '0');
            
            // Add fireworks when time units change (throttled)
            if (key === 'minutes' && values[key] < previousValues[key] && activeFireworks < MAX_ACTIVE_FIREWORKS * 0.7) {
                // Firework burst when minutes change
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                createFireworkBurst(centerX, centerY, 2, 1.0);
            } else if (key === 'hours' && values[key] < previousValues[key] && activeFireworks < MAX_ACTIVE_FIREWORKS * 0.6) {
                // Bigger burst when hours change
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                createFireworkBurst(centerX, centerY, 3, 1.2);
            } else if (key === 'days' && values[key] < previousValues[key] && activeFireworks < MAX_ACTIVE_FIREWORKS * 0.5) {
                // Biggest burst when days change
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                createFireworkBurst(centerX, centerY, 4, 1.5);
            }
            
            previousValues[key] = values[key];
        }
    });
}

// --- 3. UI STATE CONTROLS ---

function resetUI() {
    finalCountdownActive = false;
    ultraIntenseActive = false;
    clearInterval(fireworkInterval);
    // Stop any celebration music/sounds that might still be playing
    stopCelebrationMusic();
    document.body.classList.remove('final-countdown', 'ultra-intense-active');
    particlesContainer.classList.remove('particles-fast');
    document.querySelector('.container').style.animation = 'none';
    document.querySelector('.header').style.display = 'block';
    celebrationContainer.style.display = 'none';
    countdownContainer.style.display = 'flex';
    
    ['days-unit', 'hours-unit', 'minutes-unit'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'flex';
    });
    document.getElementById('seconds-unit').classList.remove('final-seconds');
    if (twentySecondBtn) {
        twentySecondBtn.innerHTML = '<span>20s</span>';
        twentySecondBtn.style.display = 'block'; // Show button again when reset
    }
    
    // Restart ambient fireworks and normal flying fireworks
    startAmbientFireworks();
    if (countdownFlyingInterval) {
        clearInterval(countdownFlyingInterval);
    }
    countdownFlyingInterval = startCountdownFlyingFireworks();
}

function enterFinalCountdownMode() {
    finalCountdownActive = true;
    
    // Play sound when reaching 20 seconds
    playTwentySecondSound();
    
    document.body.classList.add('final-countdown');
    ['days-unit', 'hours-unit', 'minutes-unit'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    document.getElementById('seconds-unit').classList.add('final-seconds');
    document.querySelector('.header').style.display = 'none';

    // Stop ambient fireworks and start intense ones
    if (ambientFireworkInterval) {
        clearInterval(ambientFireworkInterval);
        ambientFireworkInterval = null;
    }
    
    // Restart flying fireworks with bigger, more colorful version
    if (countdownFlyingInterval) {
        clearInterval(countdownFlyingInterval);
    }
    countdownFlyingInterval = startCountdownFlyingFireworks();

    fireworkInterval = setInterval(() => {
        if (activeFireworks < MAX_ACTIVE_FIREWORKS * 0.8) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.4;
            createFirework(x, y, 1.0);
            // Less frequent bursts
            if (Math.random() > 0.85 && activeFireworks < MAX_ACTIVE_FIREWORKS * 0.6) {
                createFireworkBurst(x, y, 1, 1.2);
            }
        }
    }, 800);
}

function enterUltraIntenseMode() {
    ultraIntenseActive = true;
    document.body.classList.add('ultra-intense-active');
    particlesContainer.classList.add('particles-fast');
    document.querySelector('.container').style.animation = 'shake 0.12s infinite';
    
    // Play intense sound
    playIntenseSound();
    
    clearInterval(fireworkInterval);
    fireworkInterval = setInterval(() => {
        if (activeFireworks < MAX_ACTIVE_FIREWORKS * 0.9) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.5;
            // BIGGER fireworks in final 10 seconds (size = 2.0)
            createFirework(x, y, 1.5, 2.0);
            // Less frequent bursts even in ultra intense mode
            if (Math.random() > 0.7 && activeFireworks < MAX_ACTIVE_FIREWORKS * 0.7) {
                createFireworkBurst(x, y, 2, 1.8, 2.2);
            }
        }
    }, 400); 
}

function triggerCelebration() {
    // Clear all existing intervals
    clearInterval(fireworkInterval);
    if (ambientFireworkInterval) {
        clearInterval(ambientFireworkInterval);
        ambientFireworkInterval = null;
    }
    if (celebrationFireworkInterval) {
        clearInterval(celebrationFireworkInterval);
        celebrationFireworkInterval = null;
    }
    if (whiteSparkInterval) {
        clearInterval(whiteSparkInterval);
        whiteSparkInterval = null;
    }
    if (goldenBurstInterval) {
        clearInterval(goldenBurstInterval);
        goldenBurstInterval = null;
    }
    if (flyingFireworkInterval) {
        clearInterval(flyingFireworkInterval);
        flyingFireworkInterval = null;
    }
    if (bigFireworkInterval) {
        clearInterval(bigFireworkInterval);
        bigFireworkInterval = null;
    }
    if (celebrationAnimationInterval) {
        clearInterval(celebrationAnimationInterval);
        celebrationAnimationInterval = null;
    }
    
    document.body.classList.remove('final-countdown', 'ultra-intense-active');
    document.querySelector('.container').style.animation = 'none';
    countdownContainer.style.display = 'none';
    celebrationContainer.style.display = 'block';
    
    // Start celebration music
    startCelebrationMusic();
    
    // Create cinematic firework effects (bokeh removed for performance)
    createWhiteSparks();
    createGoldenBursts();
    createFlyingFireworks();
    
    // Animate celebration elements
    animateCelebration();
    
    // Create BIG fireworks for elegant celebration
    createBigFireworks();
    
    // MASSIVE celebration fireworks (reduced frequency)
    for (let i = 0; i < 10; i++) { // Reduced from 20 to 10
        setTimeout(() => {
            if (activeFireworks < MAX_ACTIVE_FIREWORKS * 0.6) {
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                createFireworkBurst(x, y, 1, 1.5, 2.0); // Reduced size
            }
        }, i * 400); // Increased interval to 400ms
    }
    
    // Continuous celebration fireworks (further reduced frequency)
    celebrationFireworkInterval = setInterval(() => {
        if (activeFireworks < MAX_ACTIVE_FIREWORKS * 0.4) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            createFireworkBurst(x, y, 1, 1.2, 1.8); // Further reduced size
        }
    }, 2000); // Increased to 2000ms for better performance
    
    // Flying fireworks continue during celebration
    // (Already started by createFlyingFireworks)
}

// Create white shimmering sparks (optimized)
let whiteSparkCount = 0;
const MAX_WHITE_SPARKS = 12; // Reduced from 20

function createWhiteSparks() {
    const container = document.getElementById('whiteSparksContainer');
    if (!container) return;
    
    // Clear any existing interval
    if (whiteSparkInterval) {
        clearInterval(whiteSparkInterval);
    }
    
    function createSpark() {
        if (whiteSparkCount >= MAX_WHITE_SPARKS) return;
        
        const spark = document.createElement('div');
        spark.className = 'white-spark';
        spark.style.left = Math.random() * 100 + '%';
        spark.style.animationDuration = (1.5 + Math.random() * 1) + 's';
        container.appendChild(spark);
        whiteSparkCount++;
        
        setTimeout(() => {
            if (spark.parentNode) {
                spark.remove();
                whiteSparkCount--;
            }
        }, 2500);
    }
    
    // Reduced frequency - every 1500ms for better performance
    whiteSparkInterval = setInterval(createSpark, 1500);
    
    // Reduced initial burst
    for (let i = 0; i < 5; i++) {
        setTimeout(createSpark, i * 300);
    }
}

// Create golden bursts (optimized)
let goldenBurstCount = 0;
const MAX_GOLDEN_BURSTS = 30; // Reduced from 60

function createGoldenBursts() {
    const container = document.getElementById('goldenBurstsContainer');
    if (!container) return;
    
    // Clear any existing interval
    if (goldenBurstInterval) {
        clearInterval(goldenBurstInterval);
    }
    
    function createBurst(x, y) {
        if (goldenBurstCount >= MAX_GOLDEN_BURSTS) return;
        
        // Reduced particles from 8 to 6
        const particles = 6;
        for (let i = 0; i < particles; i++) {
            const burst = document.createElement('div');
            burst.className = 'golden-burst';
            burst.style.left = x + 'px';
            burst.style.top = y + 'px';
            
            const angle = (Math.PI * 2 * i) / particles;
            const distance = 50 + Math.random() * 30; // Reduced distance
            const burstX = Math.cos(angle) * distance;
            const burstY = Math.sin(angle) * distance;
            burst.style.setProperty('--burst-x', burstX + 'px');
            burst.style.setProperty('--burst-y', burstY + 'px');
            
            container.appendChild(burst);
            goldenBurstCount++;
            
            setTimeout(() => {
                if (burst.parentNode) {
                    burst.remove();
                    goldenBurstCount--;
                }
            }, 1200);
        }
    }
    
    // Reduced frequency - every 3000ms for better performance
    goldenBurstInterval = setInterval(() => {
        if (goldenBurstCount < MAX_GOLDEN_BURSTS * 0.5) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.8;
            createBurst(x, y);
        }
    }, 3000);
    
    // Reduced initial burst
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.8;
            createBurst(x, y);
        }, i * 600);
    }
}

// Create flying fireworks that launch and explode
let flyingFireworkCount = 0;
const MAX_FLYING_FIREWORKS = 3; // Reduced from 5

function createFlyingFireworks() {
    const container = document.getElementById('flyingFireworksContainer');
    if (!container) return;
    
    // Clear any existing interval
    if (flyingFireworkInterval) {
        clearInterval(flyingFireworkInterval);
    }
    
    function launchFirework() {
        if (flyingFireworkCount >= MAX_FLYING_FIREWORKS) return;
        
        // Start position at bottom
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight;
        
        // Target position (where it explodes) - upper portion of screen
        const targetX = startX + (Math.random() - 0.5) * 200;
        const targetY = Math.random() * window.innerHeight * 0.6;
        
        // Create rocket
        const rocket = document.createElement('div');
        rocket.className = 'flying-rocket';
        rocket.style.left = startX + 'px';
        rocket.style.top = startY + 'px';
        rocket.style.setProperty('--target-x', (targetX - startX) + 'px');
        rocket.style.setProperty('--target-y', (targetY - startY) + 'px');
        container.appendChild(rocket);
        flyingFireworkCount++;
        
        // Calculate flight time (faster = shorter)
        const flightTime = 800 + Math.random() * 400; // 800-1200ms
        
        // When rocket reaches target, explode
        setTimeout(() => {
            if (rocket.parentNode) {
                rocket.remove();
                flyingFireworkCount--;
                
                // Create explosion at target position
                if (activeFireworks < MAX_ACTIVE_FIREWORKS * 0.6) {
                    createFireworkBurst(targetX, targetY, 2, 1.5, 2.0); // Reduced
                }
            }
        }, flightTime);
    }
    
    // Launch fireworks periodically - reduced frequency
    flyingFireworkInterval = setInterval(launchFirework, 2500);
    
    // Reduced initial launches
    for (let i = 0; i < 3; i++) {
        setTimeout(launchFirework, i * 500);
    }
}

// Flying fireworks for countdown section
let countdownFlyingFireworkCount = 0;
const MAX_COUNTDOWN_FLYING = 3;
let countdownFlyingInterval = null;

function startCountdownFlyingFireworks() {
    const container = document.getElementById('countdownFlyingFireworks');
    if (!container) return;
    
    function launchCountdownFirework() {
        if (countdownFlyingFireworkCount >= MAX_COUNTDOWN_FLYING) return;
        
        // Start position at bottom
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight;
        
        // Target position (where it explodes) - upper portion of screen
        const targetX = startX + (Math.random() - 0.5) * 300;
        const targetY = Math.random() * window.innerHeight * 0.5;
        
        // Create rocket - bigger and more colorful in final countdown mode
        const rocket = document.createElement('div');
        rocket.className = finalCountdownActive ? 'flying-rocket final-rocket' : 'flying-rocket';
        rocket.style.left = startX + 'px';
        rocket.style.top = startY + 'px';
        rocket.style.setProperty('--target-x', (targetX - startX) + 'px');
        rocket.style.setProperty('--target-y', (targetY - startY) + 'px');
        container.appendChild(rocket);
        countdownFlyingFireworkCount++;
        
        // Calculate flight time
        const flightTime = 1000 + Math.random() * 500; // 1000-1500ms
        
        // When rocket reaches target, explode
        setTimeout(() => {
            if (rocket.parentNode) {
                rocket.remove();
                countdownFlyingFireworkCount--;
                
                // Create explosion at target position - bigger and more colorful in final countdown
                if (activeFireworks < MAX_ACTIVE_FIREWORKS * 0.6) {
                    if (finalCountdownActive) {
                        // Bigger, more colorful bursts in final 20 seconds
                        createFireworkBurst(targetX, targetY, 4, 2.5, 3.5);
                    } else {
                        createFireworkBurst(targetX, targetY, 2, 1.5, 2.0);
                    }
                }
            }
        }, flightTime);
    }
    
    // Launch fireworks periodically during countdown - more frequent in final countdown
    const interval = finalCountdownActive ? 800 : 2500;
    const intervalId = setInterval(() => {
        if (!finalCountdownActive && countdownFlyingFireworkCount >= MAX_COUNTDOWN_FLYING) {
            clearInterval(intervalId);
            return;
        }
        launchCountdownFirework();
    }, interval);
    
    // Initial launches
    const initialCount = finalCountdownActive ? 5 : 3;
    for (let i = 0; i < initialCount; i++) {
        setTimeout(launchCountdownFirework, i * (finalCountdownActive ? 200 : 500));
    }
    
    return intervalId;
}

// Create Big Fireworks for Elegant Celebration
function createBigFireworks() {
    const container = document.getElementById('bigFireworksContainer');
    if (!container) return;
    
    // Clear any existing interval
    if (bigFireworkInterval) {
        clearInterval(bigFireworkInterval);
    }
    
    const bigColors = ['#ff0066', '#ff6600', '#ffcc00', '#00ffcc', '#0066ff', '#ff00ff', '#00ff00', '#ffff00', '#ff1493', '#00ffff', '#d4af37', '#ffffff'];
    
    function createBigFirework() {
        // Random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6; // Upper portion
        
        // Create main firework
        const mainFirework = document.createElement('div');
        mainFirework.className = 'big-firework';
        const color = bigColors[Math.floor(Math.random() * bigColors.length)];
        mainFirework.style.background = color;
        mainFirework.style.color = color;
        mainFirework.style.left = x + 'px';
        mainFirework.style.top = y + 'px';
        container.appendChild(mainFirework);
        
        // Create big explosion with reduced particles (30 -> 12)
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'big-firework-particle';
            particle.style.color = color;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 120 + Math.random() * 80; // Reduced spread
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--big-tx', tx + 'px');
            particle.style.setProperty('--big-ty', ty + 'px');
            
            container.appendChild(particle);
            
            // Cleanup
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 2000);
        }
        
        // Cleanup main firework
        setTimeout(() => {
            if (mainFirework.parentNode) {
                mainFirework.remove();
            }
        }, 100);
    }
    
    // Reduced initial big fireworks burst
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            createBigFirework();
        }, i * 600);
    }
    
    // Continuous big fireworks - reduced frequency
    bigFireworkInterval = setInterval(() => {
        if (Math.random() > 0.8) { // 20% chance (reduced from 30%)
            createBigFirework();
        }
    }, 4000); // Increased from 2000ms to 4000ms
}

// Animate celebration elements
function animateCelebration() {
    // Clear any existing intervals
    if (celebrationAnimationInterval) {
        clearInterval(celebrationAnimationInterval);
    }
    
    // 3D rotation effect on title - reduced frequency
    const titleWrapper = document.querySelector('.celebration-title-wrapper');
    if (titleWrapper) {
        celebrationAnimationInterval = setInterval(() => {
            titleWrapper.style.transform = 'perspective(1000px) rotateY(5deg)';
            setTimeout(() => {
                titleWrapper.style.transform = 'perspective(1000px) rotateY(-5deg)';
            }, 2000);
            setTimeout(() => {
                titleWrapper.style.transform = 'perspective(1000px) rotateY(0deg)';
            }, 4000);
        }, 8000); // Increased from 6000ms
    }
    
    // Subtle 3D movement on year - reduced frequency
    const yearWrapper = document.querySelector('.celebration-year-wrapper');
    if (yearWrapper) {
        setInterval(() => {
            yearWrapper.style.transform = 'perspective(1000px) rotateX(3deg) rotateY(2deg)';
            setTimeout(() => {
                yearWrapper.style.transform = 'perspective(1000px) rotateX(-3deg) rotateY(-2deg)';
            }, 3000);
            setTimeout(() => {
                yearWrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            }, 6000);
        }, 12000); // Increased from 9000ms
    }
}

// --- 4. INTERACTION LISTENERS ---

// Toggle 20s Test Mode (for testing purposes only)
if (twentySecondBtn) {
    twentySecondBtn.addEventListener('click', () => {
        if (!isTestMode) {
            isTestMode = true;
            twentySecondBtn.innerHTML = '<span>Back</span>';
            targetTime = new Date().getTime() + 20500; 
            // Immediately enter final countdown mode for 20s test
            if (!finalCountdownActive) {
                enterFinalCountdownMode();
            }
        } else {
            isTestMode = false;
            targetTime = realTarget;
            resetUI();
        }
    });
} else {
    console.error('20-second button not found!');
}

// Check if we're in the actual final 20 seconds on Dec 31st and hide button
function checkAndUpdateButtonVisibility() {
    if (!twentySecondBtn) return;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // Keep button visible at all times (including during final 20 seconds)
    if (!isTestMode) {
        twentySecondBtn.style.display = 'block';
    }
}

// Fullscreen Logic
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Start the clock
setInterval(updateCountdown, 100);

// Check button visibility periodically
setInterval(checkAndUpdateButtonVisibility, 1000);

// Start flying fireworks for countdown
countdownFlyingInterval = startCountdownFlyingFireworks();

// Start flying fireworks for countdown
startCountdownFlyingFireworks();

// Start flying fireworks for countdown
startCountdownFlyingFireworks();
