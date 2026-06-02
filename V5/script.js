// BACKUP: Complete Game Code for Echoes of the Unwritten Chapter 1
// This file contains all game systems extracted from original chapter1.html

// █████████████████████████████████████████████████████████████████████████████
//  GAME STATE MANAGEMENT
// █████████████████████████████████████████████████████████████████████████████
const GameState = {
  load: function() {
    const saved = localStorage.getItem('gamestate');
    return saved ? JSON.parse(saved) : null;
  },
  save: function(updates) {
    const current = this.load() || {};
    const newState = {...current, ...updates, lastSaveTime: Date.now()};
    localStorage.setItem('gamestate', JSON.stringify(newState));
    return newState;
  }
};

let gState = GameState.load();

// █████████████████████████████████████████████████████████████████████████████
//  AUDIO SYSTEM
// █████████████████████████████████████████████████████████████████████████████
const AUDIO = {
  enabled: true,
  ctx: null,
  
  initAudio() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {
        console.log('Audio not supported');
        this.enabled = false;
      }
    }
  },
  
  playTone(freq=440, duration=100, type='sine', vol=0.3) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(vol * 0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration / 1000);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration / 1000);
    } catch(e) {}
  },
  
  sfxHit() { 
    this.playTone(440, 80, 'triangle', 0.3); 
  },
  
  sfxAttack() { 
    // BASIC punch attack - short punchy sound
    this.playTone(500, 50, 'square', 0.25);
    setTimeout(() => this.playTone(350, 75, 'triangle', 0.15), 50);
  },
  
  sfxBurnAttack() {
    // BURN fireblast - whoosh with frequency sweep
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      // Frequency sweep up (fireblast effect)
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
      osc.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } catch(e) {}
  },
  
  sfxAbility() { 
    // ERASE ability - digital zap with double tone
    this.playTone(1000, 120, 'sine', 0.2);
    setTimeout(() => this.playTone(600, 100, 'square', 0.15), 60);
  },
  
  sfxBossPhaseChange() {
    // Boss phase transition - dramatic sound
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Deep bass pulse
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.frequency.value = 150;
      bass.type = 'sine';
      bassGain.gain.setValueAtTime(0.3, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      bass.start(now);
      bass.stop(now + 0.3);
      
      // High frequency sweep
      setTimeout(() => {
        const high = this.ctx.createOscillator();
        const highGain = this.ctx.createGain();
        high.connect(highGain);
        highGain.connect(this.ctx.destination);
        high.frequency.setValueAtTime(800, now + 0.1);
        high.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        high.type = 'square';
        highGain.gain.setValueAtTime(0.2, now + 0.1);
        highGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        high.start(now + 0.1);
        high.stop(now + 0.35);
      }, 0);
    } catch(e) {}
  },
  
  sfxVictory() {
    // Victory fanfare - ascending arpeggio
    const notes = [523, 659, 785, 1047]; // C E G C (higher octave)
    const delay = 150;
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 200, 'sine', 0.3), i * delay);
    });
  },
  
  sfxDefeat() {
    // Defeat sound - descending tone with vibrato
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      // Descending pitch with vibrato
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.6);
    } catch(e) {}
  },
  
  sfxSuccess() { 
    this.playTone(700, 200, 'sine', 0.3); 
  },
  
  sfxError() { 
    this.playTone(300, 200, 'square', 0.2); 
  },
  
  sfxUIClick() { 
    this.playTone(500, 50, 'sine', 0.2); 
  },
  
  sfxWordObtain() { 
    // Enhanced word obtain - rising tones
    this.playTone(523, 150, 'sine', 0.4);
    setTimeout(() => this.playTone(659, 150, 'sine', 0.35), 100);
    setTimeout(() => this.playTone(785, 200, 'sine', 0.4), 200);
  },
  
  ambientOscillator: null,
  ambientGain: null,
  
  startAmbient() {
    // Start low ambient background tone during combat
    if (!this.enabled || !this.ctx || this.ambientOscillator) return;
    try {
      this.ambientOscillator = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();
      this.ambientOscillator.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      
      this.ambientOscillator.frequency.value = 60; // Deep bass frequency
      this.ambientOscillator.type = 'sine';
      this.ambientGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      
      this.ambientOscillator.start();
    } catch(e) {}
  },
  
  stopAmbient() {
    // Stop ambient background tone
    if (this.ambientOscillator) {
      try {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        this.ambientOscillator.stop(this.ctx.currentTime + 0.5);
      } catch(e) {}
      this.ambientOscillator = null;
      this.ambientGain = null;
    }
  },
};

// █████████████████████████████████████████████████████████████████████████████
//  FX SYSTEM
// █████████████████████████████████████████████████████████████████████████████
const FX = {
  particles: [],
  shakeAmount: 0,
  shakeDecay: 0.95,
  
  createParticle(x, y, vx, vy, life, color, size=3) {
    this.particles.push({
      x, y, vx, vy, life, maxLife: life, color, size,
      rotation: 0, rotSpeed: Math.random() * 0.1 - 0.05,
    });
  },
  
  shake(amount=5) {
    this.shakeAmount = amount;
    AUDIO.sfxHit();
  },
  
  updateParticles(dt) {
    for(let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt/1000;
      p.y += p.vy * dt/1000;
      p.vy += 50 * dt/1000;
      p.rotation += p.rotSpeed;
      p.life -= dt;
      if(p.life <= 0) this.particles.splice(i, 1);
    }
    this.shakeAmount *= this.shakeDecay;
  },
  
  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
  },
  
  getShakeOffset() {
    if(this.shakeAmount < 0.1) return {x: 0, y: 0};
    return {
      x: (Math.random() - 0.5) * this.shakeAmount * 2,
      y: (Math.random() - 0.5) * this.shakeAmount * 2
    };
  }
};

// █████████████████████████████████████████████████████████████████████████████
//  CANVAS SETUP
// █████████████████████████████████████████████████████████████████████████████
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE = 16;
let SCALE = 1;
const MIN_SCALE = 1;
const MAX_SCALE = 1;
const COLS = 40, ROWS = 30;
const W = COLS * TILE, H = ROWS * TILE;

canvas.width  = W;
canvas.height = H;
function updateCanvasScale(){
  const maxWidth = window.innerWidth - 32;
  const maxHeight = window.innerHeight - 32;
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.floor(Math.min(maxWidth / W, maxHeight / H))));
  SCALE = scale;
  canvas.style.width = (W * SCALE) + 'px';
  canvas.style.height = (H * SCALE) + 'px';
}
updateCanvasScale();
window.addEventListener('resize', updateCanvasScale);

// █████████████████████████████████████████████████████████████████████████████
//  TILEMAP
// █████████████████████████████████████████████████████████████████████████████
const MAP = [
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,4,0,1,1,1,0,0,0,1,1,1,0,0,0,4,0,0,0,6,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,4,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,0,6,0,6,0,0,0,1,0,4,0,1,0,0,0,4,0,4,0,0,0,0,1],
  [1,0,0,0,5,0,0,5,0,0,5,0,0,5,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,4,0,0,0,0,0,1],
  [1,0,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,4,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,2,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,3,0,0,0,0,0,4,0,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,0,6,0,6,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,5,0,4,0,4,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,5,0,4,0,0,1,0,0,4,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,4,0,1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,1,4,0,4,0,0,0,1],
  [1,0,0,0,0,0,0,1,1,5,1,1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,2,2,2,2,2,1,0,0,0,0,0,0,1],
  [1,0,6,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1,1,5,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,4,0,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,4,0,1,0,0,0,0,4,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,4,0,0,0,1,1,5,1,1,0,0,0,0,0,0,4,0,0,0,0,0,1,1,5,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,4,0,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const SOLID = new Set([1,4,6]);
function isSolid(tx,ty){
  if(tx<0||ty<0||tx>=COLS||ty>=ROWS) return true;
  return SOLID.has(MAP[ty][tx]);
}

// █████████████████████████████████████████████████████████████████████████████
//  TILE COLORS
// █████████████████████████████████████████████████████████████████████████████
const TILE_COLORS = {
  0:'#1a3a18', 1:'#2a2a4a', 2:'#3a3020',
  3:'#1a2a4a', 4:'#1a3a18', 5:'#3a2a18', 6:'#4a4a3a',
};
const TILE_ACCENT = { 0:'#223a20', 2:'#443830', 3:'#1e3255', };

// █████████████████████████████████████████████████████████████████████████████
//  GAME OBJECTS
// █████████████████████████████████████████████████████████████████████████████
const EXIT_ZONE = {x:1*TILE, y:2*TILE, w:2*TILE, h:2*TILE, active:false};

let storyPhase = 0;
const player = {
  x:20*TILE+8, y:14*TILE+8,
  vx:0, vy:0, speed:90, dir:'down',
  animTick:0, animFrame:0, canMove:false,
  hp: gState?.playerHp || 100, maxHp:100,
  words: [], lastAttackTime:0, hasAllWords:false,
};

if(gState && gState.currentChapter1Phase !== undefined){
  storyPhase = gState.currentChapter1Phase;
  player.words = gState.playerWords || [];
  player.hp = gState.playerHp || 100;
  player.canMove = storyPhase >= 1;
}

const boss = {
  active:false,
  x:35*TILE+8, y:2*TILE+8, vx:0, vy:0,
  dir:'down', speed:60, hp:100, maxHp:100,
  animTick:0, animFrame:0, moveTimer:0,
  lastAttackTime:0, stunned:false, stunDuration:0, seenPlayer:false,
  phase:1, lastPhaseHp:100, projectileAttackTimer:0,
  talkCooldown:0, lastTaunt:''
};

let enemies = [];
let projectiles = [];
let drops = [];
let enemiesSpawned = false;
let gameStage = 0;
let bossTriggered = false;
let enemyWarningActive = false;
let bossWarningActive = false;
let gameDifficulty = 'normal'; // easy, normal, hard
let difficultySelected = false;

// █████████████████████████████████████████████████████████████████████████████
//  NPCS
// █████████████████████████████████████████████████████████████████████████████
const NPCS = [
  {
    id:'villager1', x:4*TILE, y:9*TILE, dir:'right',
    color:'#e8a060', hair:'#5a3010', shirt:'#6688aa',
    animTick:0, animFrame:0, walkTimer:0,
    dialogueTree:{
      start:[
        {speaker:'Villager', text:'Have you... seen the Script breaking?',
          choices:[{text:'No, what is it?', next:'explain'},{text:'I\'m looking into it.', next:'helping'}]},
      ],
      explain:[
        {speaker:'Villager', text:'The world is falling apart. Everything is unraveling.', next:'start'},
      ],
      helping:[
        {speaker:'Villager', text:'Please... save us all.', next:'start'},
      ],
    },
    currentNode:'start', currentIdx:0, loopWalk:true,
    walkPath:[{x:4,y:9},{x:4,y:11},{x:4,y:9}], pathIdx:0,
  },
  {
    id:'villager2', x:11*TILE, y:8*TILE, dir:'down',
    color:'#d4906a', hair:'#3a2010', shirt:'#aa6644',
    animTick:0, animFrame:0, walkTimer:0,
    dialogueTree:{
      start:[
        {speaker:'Villager', text:'The buildings are vanishing...',
          choices:[{text:'We\'ll stop this.', next:'reassured'},{text:'That sounds bad.', next:'start'}]},
      ],
      reassured:[
        {speaker:'Villager', text:'Really? Thank you... I hope so.', next:'start'},
      ],
    },
    currentNode:'start', currentIdx:0, loopWalk:false,
  },
  {
    id:'oldman', x:8*TILE, y:10*TILE, dir:'down',
    color:'#c8a070', hair:'#aaaaaa', shirt:'#444460',
    animTick:0, animFrame:0, walkTimer:0,
    dialogueTree:{
      intro:[
        {speaker:'Old Man', text:'…You\'re different. I can see it.', next:'scriptBreak'},
      ],
      scriptBreak:[
        {speaker:'Old Man', text:'The Script is breaking. If your name isn\'t written… you vanish.',
          choices:[{text:'How do I have a name?', next:'name'},{text:'What can I do?', next:'action'}]},
      ],
      name:[
        {speaker:'Aren', text:'…I can… speak?', speakMoment:true, next:'stillHere'},
      ],
      stillHere:[
        {speaker:'Old Man', text:'Then why am I still here?'},
        {speaker:'Aren', text:'I\'m still here too...'},
        {speaker:'Old Man', text:'…Because you were never written.', isKey:true, next:'threat'},
      ],
      action:[
        {speaker:'Old Man', text:'You must find the Hero and stop them.', isKey:true, next:'threat'},
      ],
      threat:[
        {speaker:'Old Man', text:'Someone called "the Hero" maintains the Script. If you don\'t stop them...', next:'crumble'},
      ],
      crumble:[
        {speaker:'Old Man', text:'This world will crumble. You will crumble.', next:'intro'},
      ],
    },
    currentNode:'intro', currentIdx:0, loopWalk:false,
  },
  {
    id:'villager3', x:15*TILE, y:12*TILE, dir:'left',
    color:'#ddb080', hair:'#4a2a10', shirt:'#886644',
    animTick:0, animFrame:0, walkTimer:0,
    dialogueTree:{
      start:[
        {speaker:'Villager', text:'We\'re disappearing! Someone fix the story!', isGlitch:true,
          choices:[{text:'I\'m trying!', next:'helping'},{text:'Calm down.', next:'calm'}]},
      ],
      helping:[
        {speaker:'Villager', text:'Please... save us...', next:'start'},
      ],
      calm:[
        {speaker:'Villager', text:'How can I be calm?! Reality is crumbling!', next:'start'},
      ],
    },
    currentNode:'start', currentIdx:0, loopWalk:false, panicking:true,
  },
];

// █████████████████████████████████████████████████████████████████████████████
//  GAME STATE & STORY
// █████████████████████████████████████████████████████████████████████████████
let glitchBuilding = null;
let glitchProgress = 0;
let erasedBuildings = [];
let objectiveText = 'Explore the village';
let stepsWalked = 0;
let oldManTalked = false;
let burnObtained = false;

const STORY_EVENTS = [
  { phase:0, trigger:'start', delay:1200,
    action:()=> showNarrator('In a world bound by script, every word… every action… is predetermined.', 3500,
      ()=> showNarrator('And some… are never meant to speak.', 3000,
        ()=> showWordObtain('MOVE','You can now move freely.',()=>{
          player.canMove = true;
          storyPhase = 1;
          player.words.push('MOVE');
          // Auto-grant BASIC attack after 3 seconds
          setTimeout(()=> {
            showWordObtain('BASIC', 'A simple punch. Learn to fight.', ()=>{
              player.words.push('BASIC');
              storyPhase = 2;
              objectiveText = 'Explore the village';
            });
          }, 3000);
        })
      )
    )
  },
];

// █████████████████████████████████████████████████████████████████████████████
//  INPUT
// █████████████████████████████████████████████████████████████████████████████
const keys = {};
document.addEventListener('keydown', e=>{
  keys[e.key.toLowerCase()] = true;
  if((e.key==='e'||e.key==='E') && !e.repeat) handleInteract();
  if((e.key==='z'||e.key==='Z') && !e.repeat) handleBasicAttack();
  if((e.key==='f'||e.key==='F') && !e.repeat) handleBurnAttack();
  if((e.key==='r'||e.key==='R') && !e.repeat) handleEraseAttack();
  if((e.key==='x'||e.key==='X') && !e.repeat && !enemiesSpawned) spawnEnemies();
  if((e.key==='p'||e.key==='P') && !e.repeat) handlePostCreditsTransition();
  if((e.key==='t'||e.key==='T') && !e.repeat) testShowPostCredits();
  if((e.key==='Escape') && !e.repeat) togglePauseMenu();
});
document.addEventListener('keyup',  e=>{ keys[e.key.toLowerCase()] = false; });

function handleBasicAttack(){
  if(!player.words.includes('BASIC')) return;
  if(Date.now() - player.lastAttackTime < 300) return;
  
  player.lastAttackTime = Date.now();
  AUDIO.sfxAttack();
  FX.shake(1);
  
  // Simple melee effect
  for(let i = 0; i < 4; i++){
    const angle = (Math.random() - 0.5) * Math.PI * 0.6;
    FX.createParticle(player.x + 8, player.y + 8, 
      Math.cos(angle) * 80 + Math.random() * 20, 
      Math.sin(angle) * 80 + Math.random() * 20,
      400, '#cccccc', 1);
  }
  
  enemies.forEach(enemy => {
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if(dist < 60){
      enemy.hp = Math.max(0, enemy.hp - 3);
      enemy.chaseTimer = 2;
      showDamagePopup(enemy.x, enemy.y, '-3');
      FX.shake(1);
      if(enemy.hp <= 0) {
        enemy.active = false;
        if(Math.random() < 0.5) spawnItemDrop(enemy.x, enemy.y);
      }
    }
  });
}

function handleBurnAttack(){
  if(!player.words.includes('BURN')) return;
  if(Date.now() - player.lastAttackTime < 500) return;
  
  player.lastAttackTime = Date.now();
  triggerGlitchFlash();
  AUDIO.sfxBurnAttack();
  FX.shake(3);
  
  for(let i = 0; i < 16; i++){
    const angle = (Math.random() - 0.5) * Math.PI;
    const speed = 100 + Math.random() * 80;
    const colors = ['#ff6b35', '#ffa500', '#ffff00'];
    const color = colors[Math.floor(Math.random()*3)];
    FX.createParticle(player.x + 8, player.y + 8, 
      Math.cos(angle) * speed, 
      Math.sin(angle) * speed,
      700, color, 2.5);
  }
  
  // Fireblast: multiple projectiles in spread pattern
  const baseAngle = (player.dir === 'right') ? 0 : (player.dir === 'left') ? Math.PI : (player.dir === 'down') ? Math.PI/2 : -Math.PI/2;
  
  // Main projectile
  projectiles.push({
    x: player.x + 8, y: player.y + 8,
    vx: Math.cos(baseAngle) * 150, vy: Math.sin(baseAngle) * 150,
    life: 0.6, maxLife: 0.6, type: 'burn', damage: 12, glow: true
  });
  
  // Spray projectiles (3 smaller ones)
  for(let i = -1; i <= 1; i++){
    if(i === 0) continue;
    const spreadAngle = baseAngle + i * 0.4;
    projectiles.push({
      x: player.x + 8, y: player.y + 8,
      vx: Math.cos(spreadAngle) * 100, vy: Math.sin(spreadAngle) * 100,
      life: 0.5, maxLife: 0.5, type: 'burn', damage: 6, glow: false
    });
  }
  
  enemies.forEach(enemy => {
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if(dist < 120){
      enemy.hp = Math.max(0, enemy.hp - 12);
      enemy.chaseTimer = 3;
      showDamagePopup(enemy.x, enemy.y, '-8');
      FX.shake(2);
      if(enemy.hp <= 0) {
        enemy.active = false;
        if(Math.random() < 0.5) spawnItemDrop(enemy.x, enemy.y);
      }
    }
  });
  
  if(boss.active){
    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if(dist < 120){
      const weakBonus = getWeaknessBonus('burn', boss.phase);
      const damage = Math.ceil(20 * weakBonus);
      boss.hp = Math.max(0, boss.hp - damage);
      boss.stunned = true;
      boss.stunDuration = 400;
      showDamagePopup(boss.x, boss.y, `-${damage}`);
      if(weakBonus > 1.0) showWeaknessEffect(true);
      FX.shake(4);
      if(boss.hp <= 0) triggerBossDefeat();
    }
  }
}

function handleEraseAttack(){
  if(!player.words.includes('ERASE')) return;
  if(Date.now() - player.lastAttackTime < 600) return;
  
  player.lastAttackTime = Date.now();
  triggerGlitchFlash();
  AUDIO.sfxBurnAttack();
  FX.shake(4);
  
  for(let i = 0; i < 12; i++){
    const angle = (i / 12) * Math.PI * 2;
    FX.createParticle(player.x + 8, player.y + 8, 
      Math.cos(angle) * 150, Math.sin(angle) * 150,
      700, '#00ccff', 3);
  }
  
  const angle = (player.dir === 'right') ? 0 : (player.dir === 'left') ? Math.PI : (player.dir === 'down') ? Math.PI/2 : -Math.PI/2;
  projectiles.push({
    x: player.x + 8, y: player.y + 8,
    vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120,
    life: 0.5, maxLife: 0.5, type: 'erase', damage: 12
  });
  
  enemies.forEach(enemy => {
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if(dist < 120){
      enemy.hp = Math.max(0, enemy.hp - 12);
      enemy.chaseTimer = 3;
      showDamagePopup(enemy.x, enemy.y, '✕-12');
      FX.shake(2);
      if(enemy.hp <= 0) {
        enemy.active = false;
        if(Math.random() < 0.5) spawnItemDrop(enemy.x, enemy.y);
      }
    }
  });
  
  let erased = false;
  for(let i = 0; i < erasedBuildings.length; i++){
    const b = erasedBuildings[i];
    const dist = Math.hypot(player.x - b.x, player.y - b.y);
    if(dist < 80){
      erasedBuildings.splice(i, 1);
      showDamagePopup(b.x, b.y, '✕ERASED');
      erased = true;
      break;
    }
  }
  
  if(boss.active){
    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if(dist < 120){
      const weakBonus = getWeaknessBonus('erase', boss.phase);
      const damage = Math.ceil(25 * weakBonus);
      boss.hp = Math.max(0, boss.hp - damage);
      boss.stunned = true;
      boss.stunDuration = 500;
      showDamagePopup(boss.x, boss.y, `-${damage}`);
      if(weakBonus > 1.0) showWeaknessEffect(true);
      FX.shake(5);
      if(boss.hp <= 0) triggerBossDefeat();
    }
  }
}

// █████████████████████████████████████████████████████████████████████████████
//  DIALOGUE ENGINE
// █████████████████████████████████████████████████████████████████████████████
let dlgQueue = [];
let dlgActive = false;
let dlgTyping = false;
let dlgFullText = '';
let dlgDisplayed = '';
let dlgTypeTimer = null;
let dlgOnDone = null;
let currentNPC = null;

function showDialogue(speaker, text, onDone=null, choices=null, isGlitch=false){
  dlgActive  = true;
  dlgOnDone  = onDone;
  dlgFullText = text;
  dlgDisplayed = '';
  player.canMove = false;

  document.getElementById('dlg-speaker').textContent = speaker;
  document.getElementById('dlg-text').textContent = '';
  document.getElementById('dlg-choices').innerHTML = '';
  document.getElementById('dlg-continue').style.display = choices ? 'none' : 'block';
  document.getElementById('dialogue').classList.add('open');

  if(isGlitch){
    typeGlitchText(text, choices);
  } else {
    typeText(text, choices);
  }
}

function typeText(text, choices){
  dlgTyping = true;
  let i = 0;
  clearInterval(dlgTypeTimer);
  dlgTypeTimer = setInterval(()=>{
    dlgDisplayed += text[i];
    document.getElementById('dlg-text').textContent = dlgDisplayed;
    i++;
    if(i >= text.length){
      clearInterval(dlgTypeTimer);
      dlgTyping = false;
      if(choices) {
        document.getElementById('dlg-continue').style.display = 'none';
        showChoices(choices);
      }
    }
  }, 28);
}

function typeGlitchText(text, choices){
  dlgTyping = true;
  const el = document.getElementById('dlg-text');
  let i = 0;
  clearInterval(dlgTypeTimer);
  dlgTypeTimer = setInterval(()=>{
    const char = text[i];
    const isCorrupt = Math.random() < .3;
    if(isCorrupt){
      const glyph = '█▓▒░?!#@$%'[Math.floor(Math.random()*10)];
      dlgDisplayed += `<span class="glitch-char">${glyph}</span>`;
      setTimeout(()=>{
        el.innerHTML = dlgDisplayed.replace(/<span class="glitch-char">.<\/span>/g, text.substring(0,i+1).split('').pop());
      }, 80 + Math.random()*120);
    } else {
      dlgDisplayed += char;
    }
    el.innerHTML = dlgDisplayed;
    i++;
    if(i >= text.length){
      clearInterval(dlgTypeTimer);
      dlgTyping = false;
      setTimeout(()=>{ el.textContent = text; }, 200);
      if(choices) showChoices(choices);
    }
  }, 40);
}

function showChoices(choices){
  const el = document.getElementById('dlg-choices');
  el.innerHTML = '';
  document.getElementById('dlg-continue').style.display = 'none';
  choices.forEach((c,i)=>{
    const btn = document.createElement('button');
    btn.className = 'dlg-choice';
    btn.textContent = (i===0?'▶ ':'  ') + c.text;
    btn.onclick = ()=>{ closeDialogue(); if(c.onSelect) c.onSelect(); };
    el.appendChild(btn);
  });
}

function closeDialogue(){
  document.getElementById('dialogue').classList.remove('open');
  dlgActive = false;
  dlgDisplayed = '';
  const cb = dlgOnDone;
  dlgOnDone = null;
  player.canMove = true;
  if(cb) setTimeout(cb, 300);
}

function handleInteract(){
  if(dlgActive){
    if(dlgTyping){
      clearInterval(dlgTypeTimer);
      dlgTyping = false;
      document.getElementById('dlg-text').textContent = dlgFullText;
      if(document.getElementById('dlg-choices').children.length === 0)
        document.getElementById('dlg-continue').style.display = 'block';
    } else if(document.getElementById('dlg-choices').children.length === 0){
      closeDialogue();
    }
    return;
  }
  
  const px = player.x + 8, py = player.y + 8;
  for(const npc of NPCS){
    const nx = npc.x + 8, ny = npc.y + 8;
    const dist = Math.hypot(px-nx, py-ny);
    if(dist < 32){
      currentNPC = npc;
      showNPCDialogue(npc);
      return;
    }
  }
}

function showNPCDialogue(npc){
  const nodeKey = npc.currentNode;
  const nodes = npc.dialogueTree[nodeKey] || [];
  
  if(npc.currentIdx >= nodes.length){
    npc.currentIdx = 0;
  }
  
  const dlgData = nodes[npc.currentIdx];
  npc.currentIdx++;
  
  const choices = dlgData.choices ? dlgData.choices.map(choice => ({
    text: choice.text,
    onSelect: () => {
      if(choice.next) npc.currentNode = choice.next;
      closeDialogue();
      // Show the response after a short delay
      setTimeout(() => showNPCDialogue(npc), 400);
    }
  })) : null;
  
  showDialogue(dlgData.speaker, dlgData.text, null, choices, dlgData.isGlitch);
  
  if(npc.id==='oldman' && dlgData.isKey && storyPhase===3){
    storyPhase = 4;
    setTimeout(()=> triggerGlitchIncident(), 1500);
  }
}

// █████████████████████████████████████████████████████████████████████████████
//  NARRATOR & VISUAL EFFECTS
// █████████████████████████████████████████████████████████████████████████████
let narratorTimeout = null;
function showNarrator(text, duration, onDone){
  const el = document.getElementById('narrator-box');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(narratorTimeout);
  narratorTimeout = setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>{ if(onDone) onDone(); }, 500);
  }, duration);
}

function showWordObtain(word, desc, onDone){
  const el   = document.getElementById('word-popup');
  document.getElementById('wp-word-text').textContent = word;
  document.getElementById('wp-sub-text').textContent  = desc;
  el.classList.add('show');
  triggerGlitchFlash();
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>{ if(onDone) onDone(); }, 400);
  }, 2200);
}

function triggerGlitchIncident(){
  glitchBuilding = {tx:3, ty:1, tw:3, th:3, life:4000}; // Building lasts 4 seconds before erasing
  const gl = document.getElementById('glitch-overlay');
  gl.classList.add('active');
  setTimeout(()=> gl.classList.remove('active'), 600);

  let progress = 0;
  const eraseInterval = setInterval(()=>{
    progress += .05;
    glitchProgress = progress;
    if(progress >= 1){
      clearInterval(eraseInterval);
      erasedBuildings.push({...glitchBuilding, eraseTime: Date.now()});
      glitchBuilding = null;
      glitchProgress = 0;

      setTimeout(()=>{
        showNarrator('The Script is failing…', 2500, ()=>{
          showNarrator('Defeat the Void and reclaim the lost words.', 2000, ()=>{
            // Auto-spawn enemies after glitch sequence
            spawnEnemies();
          });
        });
      }, 600);
    }
  }, 80);
}

function updateGlitchBuildings(){
  // Buildings regenerate after 6 seconds of being erased
  erasedBuildings = erasedBuildings.filter(b => {
    return (Date.now() - b.eraseTime) < 6000;
  });
}

function triggerGlitchFlash(){
  const gl = document.getElementById('glitch-overlay');
  gl.classList.add('active');
  setTimeout(()=> gl.classList.remove('active'), 600);
}

function triggerBossAppearance(){
  bossWarningActive = true;
  const bossWarning = document.getElementById('warning-boss');
  if(bossWarning) {
    bossWarning.classList.add('active');
    setTimeout(() => bossWarning.classList.remove('active'), 2500);
  }
  
  setTimeout(()=>{
    showNarrator('A figure emerges from the void...', 3000);
    gameStage = 2;
    boss.active = true;
    boss.hp = boss.maxHp;
    boss.phase = 1;
    boss.lastPhaseHp = 60;
    boss.x = 25*TILE+8;
    boss.y = 2*TILE+8;
    storyPhase = 5;
    objectiveText = 'Confront the Hero';
    EXIT_ZONE.active = true;
  }, 2500);
  
  setTimeout(()=>{
    if(!player.words.includes('ERASE')){
      player.words.push('ERASE');
      showWordObtain('ERASE', 'Unmake the world.', null);
    }
  }, 6000);
}

function triggerBossDefeat(){
  AUDIO.sfxVictory();
  AUDIO.stopAmbient();
  boss.active = false;
  gameStage = 3;
  storyPhase = 6;
  player.canMove = false;
  
  player.hasAllWords = (player.words.includes('MOVE') && 
                        player.words.includes('BURN') && 
                        player.words.includes('ERASE'));
  
  GameState.save({
    chapter: 'chapter1',
    currentChapter1Phase: 6,
    playerWords: player.words,
    playerHp: player.hp,
    bossDefeated: true
  });
  
  showNarrator('The Script crumbles...', 3000, ()=>{
    showDialogue('Aren', 'What will you do?', ()=>{
      showEndingChoice();
    }, [
      {text:'Restore the Script', onSelect:()=> selectEnding('restore')},
      {text:'Destroy the Script', onSelect:()=> selectEnding('destroy')},
    ]);
  });
}

function spawnItemDrop(x, y){
  const dropTypes = ['hp_potion', 'speed_boost'];
  const type = dropTypes[Math.floor(Math.random() * dropTypes.length)];
  drops.push({
    x: x, y: y, type: type, 
    lifetime: 8000, spawnTime: Date.now(),
    vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
    bobOffset: 0, bobTime: 0
  });
}

function updateDrops(dt){
  drops = drops.filter(d => {
    d.lifetime -= dt;
    d.bobTime += dt;
    d.bobOffset = Math.sin(d.bobTime / 300) * 4;
    
    // Slow down drops as they settle
    d.vx *= 0.98;
    d.vy *= 0.98;
    d.x += d.vx * (dt / 1000);
    d.y += d.vy * (dt / 1000);
    
    return d.lifetime > 0;
  });
  
  // Check for player pickup
  drops.forEach(drop => {
    const dist = Math.hypot(player.x - drop.x, player.y - drop.y);
    if(dist < 20){
      applyDropEffect(drop.type);
      drop.lifetime = -1;
    }
  });
}

function applyDropEffect(type){
  AUDIO.sfxSuccess && AUDIO.sfxSuccess();
  if(type === 'hp_potion'){
    const healAmount = 20;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    showDamagePopup(player.x, player.y, '♥+' + healAmount);
    FX.shake(1);
  } else if(type === 'speed_boost'){
    player.speed *= 1.3;
    setTimeout(() => { player.speed /= 1.3; }, 3000);
    showDamagePopup(player.x, player.y, '⚡+SPEED');
    FX.shake(1);
  }
}

function updateBossPhase(){
  let newPhase = 1;
  if(boss.hp <= 65 && boss.hp > 33) newPhase = 2;
  else if(boss.hp <= 33) newPhase = 3;
  
  if(newPhase !== boss.phase){
    boss.phase = newPhase;
    AUDIO.sfxBossPhaseChange();
    if(newPhase === 2){
      showNarrator('I will erase this world myself!', 2000);
      FX.shake(5);
      boss.speed *= 1.2;
      boss.hp = Math.min(boss.hp + 10, boss.maxHp); // Regain health on phase shift
    } else if(newPhase === 3){
      showNarrator('Then I will unmake YOU!', 2000);
      FX.shake(8);
      boss.speed *= 1.3;
      boss.hp = Math.min(boss.hp + 15, boss.maxHp);
    }
  }
  
  // Boss taunts during battle
  boss.talkCooldown -= 16; // ~60ms per frame
  if(boss.talkCooldown <= 0 && Math.random() < 0.02){
    const taunts = [
      'You cannot stop me!',
      'The Script demands it!',
      'This world is mine!',
      'Face extinction!',
      'Your words mean nothing!'
    ];
    const taunt = taunts[Math.floor(Math.random() * taunts.length)];
    if(taunt !== boss.lastTaunt){
      showNarrator(taunt, 1200);
      boss.lastTaunt = taunt;
      boss.talkCooldown = 5000;
    }
  }
}

function drawDrop(drop){
  ctx.save();
  ctx.globalAlpha = drop.lifetime / 8000;
  
  const icons = {
    'hp_potion': '♥',
    'speed_boost': '⚡'
  };
  
  const colors = {
    'hp_potion': '#ff4444',
    'speed_boost': '#ffff44'
  };
  
  ctx.fillStyle = colors[drop.type];
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icons[drop.type], drop.x, drop.y + drop.bobOffset);
  
  ctx.restore();
}

function showDamagePopup(x, y, text){
  const screenX = (x - cam.x) * SCALE + canvas.offsetLeft;
  const screenY = (y - cam.y) * SCALE + canvas.offsetTop;
  
  const div = document.createElement('div');
  div.className = 'damage-popup';
  div.textContent = text;
  div.style.left = screenX + 'px';
  div.style.top = screenY + 'px';
  
  // Scale based on damage amount
  const dmgMatch = text.match(/\d+/);
  if(dmgMatch) {
    const dmg = parseInt(dmgMatch[0]);
    div.style.fontSize = (12 + dmg * 1.5) + 'px';
    if(dmg > 15) div.style.fontWeight = 'bold';
  }
  
  document.body.appendChild(div);
  
  setTimeout(()=> div.remove(), 1200);
}

function showEndingChoice(){
  const panel = document.getElementById('ending-panel');
  const choices = document.getElementById('ending-choices');
  choices.innerHTML = '';
  
  document.getElementById('ending-title').textContent = 'What will you do?';
  document.getElementById('ending-text').textContent = 
    player.hasAllWords 
      ? 'All Words are yours. The path branches...' 
      : 'The future awaits your decision.';
  
  const opts = [
    {text: 'Restore the Script', ending: 'restore'},
    {text: 'Destroy the Script', ending: 'destroy'},
  ];
  
  opts.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'ending-choice';
    btn.textContent = opt.text;
    btn.onclick = ()=> selectEnding(opt.ending);
    choices.appendChild(btn);
  });
  
  panel.classList.add('show');
}

function selectEnding(type){
  document.getElementById('ending-panel').classList.remove('show');
  triggerEnding(type);
}

function triggerEnding(type){
  document.getElementById('ending-panel').classList.remove('show');
  document.getElementById('dialogue').classList.remove('open');
  dlgActive = false;
  
  let endingType = type;
  if(type === 'destroy' && player.hasAllWords){
    endingType = 'secret';
  }
  
  if(endingType === 'restore'){
    playObedienceEnding();
  } else if(endingType === 'destroy'){
    playFreedomEnding();
  } else if(endingType === 'secret'){
    playSecretEnding();
  }
}

function playObedienceEnding(){
  glitchBuilding = null;
  glitchProgress = 0;
  erasedBuildings = [];
  AUDIO.sfxSuccess();
  
  GameState.save({
    currentEnding: 'obedience',
    chapter1Completed: true
  });
  
  showNarrator('You place your hand upon the Script.', 2000, ()=>{
    showNarrator('The words flow back into order.', 2000, ()=>{
      showNarrator('The world crystallizes.', 2000, ()=>{
        NPCS.forEach(npc => {
          npc.dlgIdx = 0;
          npc.panicking = false;
        });
        
        showNarrator('Aren fades away...', 2500, ()=>{
          showNarrator('The story continues as written.', 2500, ()=>{
            setTimeout(()=> showEndingCard('restore'), 800);
          });
        });
      });
    });
  });
}

function playFreedomEnding(){
  AUDIO.sfxDefeat();
  
  GameState.save({
    currentEnding: 'freedom',
    chapter1Completed: true
  });
  
  const glitchOverlay = document.getElementById('glitch-overlay');
  glitchOverlay.classList.add('active');
  
  const instabilityEl = document.getElementById('instability-overlay');
  instabilityEl.classList.add('active');
  
  showNarrator('You tear the pages apart.', 2000, ()=>{
    showNarrator('The words scatter like ashes.', 2000, ()=>{
      showNarrator('The Script is gone...', 3000, ()=>{
        glitchOverlay.classList.remove('active');
        for(let i = 0; i < 5; i++){
          setTimeout(()=> {
            glitchOverlay.classList.add('active');
            setTimeout(()=> glitchOverlay.classList.remove('active'), 300);
          }, i * 400);
        }
        
        setTimeout(()=>{
          showNarrator('The world destabilizes.', 2500, ()=>{
            showNarrator('NPCs flicker and fade...', 2500, ()=>{
              setTimeout(()=> showEndingCard('destroy'), 800);
            });
          });
        }, 2000);
      });
    });
  });
}

function playSecretEnding(){
  AUDIO.sfxBossPhaseChange();
  
  GameState.save({
    currentEnding: 'secret',
    chapter1Completed: true
  });
  
  triggerGlitchFlash();
  
  showNarrator('You hold all the Words now.', 2000, ()=>{
    showNarrator('The Script dissolves in your hands.', 2000, ()=>{
      showNarrator('...I can rewrite this.', 2500, ()=>{
        showNarrator('I\'ll rewrite everything.', 2500, ()=>{
          showNarrator('The Script reforms before you.', 2000, ()=>{
            showNarrator('But this time... it\'s blank.', 2000, ()=>{
              showNarrator('Waiting.', 2000, ()=>{
                showNarrator('Once, I wanted freedom.', 1500, ()=>{
                  showNarrator('Now... I decide fate.', 2000, ()=>{
                    setTimeout(()=> showEndingCard('secret'), 800);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function showPostCredits(){
  const panel = document.getElementById('post-credits');
  panel.classList.add('show');
  
  setTimeout(()=>{
    document.getElementById('anomaly-message').style.opacity = '1';
  }, 2000);
}

function showEndingCard(endingType){
  const card = document.getElementById('ending-card');
  const title = document.getElementById('ending-card-title');
  const text = document.getElementById('ending-card-text');
  const footer = document.getElementById('ending-card-footer');
  
  // Remove all ending classes
  card.classList.remove('restore', 'destroy', 'secret');
  
  // Set content based on ending type
  if(endingType === 'restore'){
    title.textContent = 'The Script Endures';
    text.textContent = 'You chose order. The world stabilizes.\nAren fades into the pages.\nThe story continues... as written.';
    card.classList.add('restore');
  } else if(endingType === 'destroy'){
    title.textContent = 'Freedom Found';
    text.textContent = 'You chose chaos. The Script tears apart.\nThe world crumbles into silence.\nNo more words. No more rules.';
    card.classList.add('destroy');
  } else if(endingType === 'secret'){
    title.textContent = 'The Unwritten Path';
    text.textContent = 'You hold all power now.\nThe blank Script awaits your hand.\nYou alone decide what comes next.';
    card.classList.add('secret');
  }
  
  footer.textContent = 'CHAPTER 1 COMPLETE';
  card.classList.add('show');
  
  // Show credits after ending card
  setTimeout(()=> showCreditsRoll(), 5000);
}

function showCreditsRoll(){
  const endingCard = document.getElementById('ending-card');
  endingCard.classList.remove('show');
  
  setTimeout(()=>{
    const creditsRoll = document.getElementById('credits-roll');
    creditsRoll.classList.add('show');
  }, 600);
  
  // End after credits complete
  setTimeout(()=>{
    document.getElementById('credits-roll').classList.remove('show');
    showFinalMessage();
  }, 22000);
}

function showFinalMessage(){
  showNarrator('The End... For Now.', 4000, ()=>{
    showNarrator('Thank you for playing Echoes of the Unwritten.', 4000);
  });
}

function showDifficultySelector(){
  if(difficultySelected) return;
  document.getElementById('difficulty-selector').classList.add('show');
}

function selectDifficulty(d){
  gameDifficulty=d;difficultySelected=true;AUDIO.sfxUIClick();
  document.getElementById('difficulty-selector').classList.remove('show');
}

function getHPMultiplier(){
  if(gameDifficulty==='easy')return 0.7;
  if(gameDifficulty==='hard')return 1.6;
  return 1.0;
}

function getBossHPMultiplier(){
  if(gameDifficulty==='easy')return 0.6;
  if(gameDifficulty==='hard')return 1.6;
  return 1.0;
}

function getWeaknessBonus(attackType,phase){
  if(phase===1&&attackType==='basic')return 1.5;
  if(phase===2&&attackType==='burn')return 1.5;
  if(phase===3&&attackType==='erase')return 1.5;
  return 1.0;
}

function showWeaknessEffect(isWeak){
  if(isWeak){
    triggerGlitchFlash();
    AUDIO.sfxSuccess();
    showDamagePopup(player.x,player.y,'⚡WEAK!');
  }
}

// █████████████████████████████████████████████████████████████████████████████
//  PAUSE MENU
// █████████████████████████████████████████████████████████████████████████████
let isPaused = false;

function togglePauseMenu(){
  if(isPaused) closePauseMenu();
  else openPauseMenu();
}

function openPauseMenu(){
  isPaused = true;
  document.getElementById('pause-menu').classList.add('active');
  player.canMove = false;
}

function closePauseMenu(){
  isPaused = false;
  document.getElementById('pause-menu').classList.remove('active');
  player.canMove = true;
}

function returnToMenu(){
  GameState.save({
    chapter: 'chapter1',
    currentChapter1Phase: storyPhase,
    playerWords: player.words,
    playerHp: player.hp
  });
  triggerTransition(() => {
    window.location.href = 'main-menu.html';
  });
}

function handlePostCreditsTransition(){
  const postCreditsPanel = document.getElementById('post-credits');
  if(!postCreditsPanel || !postCreditsPanel.classList.contains('show')) return;
  
  // Close post-credits and show credits roll
  postCreditsPanel.classList.remove('show');
  showCreditsRoll();
}

function testShowPostCredits(){
  const postCreditsPanel = document.getElementById('post-credits');
  if(postCreditsPanel) {
    postCreditsPanel.classList.add('show');
  }
}

function triggerTransition(callback){
  const transition = document.getElementById('transition');
  transition.classList.remove('clear');
  setTimeout(() => {
    callback();
  }, 800);
}

const villageInfo = { chapter: 'CHAPTER 1', name: 'Village of Ink' };

function spawnEnemiesWave2(){
  if(wave2Spawned) return;
  wave2Spawned = true;
  gameStage = 1;
  AUDIO.startAmbient();
  showNarrator('WAVE 2 - The Void Intensifies', 2500);
  
  // Trigger building glitch again
  glitchBuilding = {tx:3, ty:1, tw:3, th:3, life:1500};
  
  // Wave 2: Stronger enemies, more of them
  const hpMult = getHPMultiplier();
  enemies = [
    {x:37*TILE+8, y:5*TILE+8, vx:0, vy:0, speed:65, hp:Math.ceil(35*hpMult), maxHp:Math.ceil(35*hpMult), type:'brute', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:37*TILE+8, y:20*TILE+8, vx:0, vy:0, speed:60, hp:Math.ceil(30*hpMult), maxHp:Math.ceil(30*hpMult), type:'scout', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:2*TILE+8, y:5*TILE+8, vx:0, vy:0, speed:55, hp:Math.ceil(28*hpMult), maxHp:Math.ceil(28*hpMult), type:'scout', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:2*TILE+8, y:25*TILE+8, vx:0, vy:0, speed:50, hp:Math.ceil(40*hpMult), maxHp:Math.ceil(40*hpMult), type:'brute', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:20*TILE+8, y:2*TILE+8, vx:0, vy:0, speed:70, hp:Math.ceil(22*hpMult), maxHp:Math.ceil(22*hpMult), type:'mage', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:20*TILE+8, y:28*TILE+8, vx:0, vy:0, speed:65, hp:Math.ceil(32*hpMult), maxHp:Math.ceil(32*hpMult), type:'scout', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
  ];
}

function triggerBossFight(){
  if(bossWaveStarted) return;
  bossWaveStarted = true;
  AUDIO.stopAmbient();
  gameStage = 2;
  boss.active = true;
  const bossMult = getBossHPMultiplier();
  boss.maxHp = Math.ceil(100 * bossMult);
  boss.hp = boss.maxHp;
  showNarrator('THE HERO AWAITS', 2000, ()=>{
    showNarrator('The one who broke the Script...', 1500);
  });
}

function spawnEnemies() { 
  if(enemiesSpawned) return;
  enemiesSpawned = true; 
  gameStage = 1;
  enemyWarningActive = true;
  AUDIO.startAmbient();
  showNarrator('The Void takes form... WAVE 1', 2500);
  
  // Trigger building glitch as warning signal
  glitchBuilding = {tx:3, ty:1, tw:3, th:3, life:2000};
  
  // Show incoming warning
  const warning = document.getElementById('warning-enemies');
  if(warning) {
    warning.classList.add('active');
    setTimeout(() => warning.classList.remove('active'), 3000);
  }
  
  // Spawn varied enemies at edges of map with different behaviors
  const hpMult = getHPMultiplier();
  enemies = [
    {x:37*TILE+8, y:5*TILE+8, vx:0, vy:0, speed:50, hp:Math.ceil(20*hpMult), maxHp:Math.ceil(20*hpMult), type:'scout', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:35*TILE+8, y:25*TILE+8, vx:0, vy:0, speed:30, hp:Math.ceil(35*hpMult), maxHp:Math.ceil(35*hpMult), type:'brute', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:3*TILE+8, y:25*TILE+8, vx:0, vy:0, speed:45, hp:Math.ceil(18*hpMult), maxHp:Math.ceil(18*hpMult), type:'scout', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
    {x:2*TILE+8, y:8*TILE+8, vx:0, vy:0, speed:35, hp:Math.ceil(25*hpMult), maxHp:Math.ceil(25*hpMult), type:'mage', dir:'down', animFrame:0, animTick:0, active:true, chaseTimer:0, attackCooldown:0},
  ];
}

function checkAllEnemiesDead() { return enemies.length === 0 && gameStage === 1; }
function updateEnemies(dt) { 
  enemies = enemies.filter(e => e.hp > 0 && e.active);
  enemies.forEach(enemy => {
    if(!enemy.active) return;
    enemy.animTick += dt;
    if(enemy.animTick > 200) { enemy.animTick = 0; enemy.animFrame = (enemy.animFrame + 1) % 4; }
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    
    // Different enemy AI behaviors
    let detectionRange = 100;
    if(enemy.type === 'scout') detectionRange = 130; // Scouts see farther
    if(enemy.type === 'mage') detectionRange = 110;
    if(enemy.type === 'brute') detectionRange = 80;
    
    if(dist < detectionRange && enemy.chaseTimer <= 0) {
      enemy.chaseTimer = 2;
      const speed = enemy.speed * dt / 1000;
      if(dist > 0) {
        enemy.vx = (dx / dist) * speed;
        enemy.vy = (dy / dist) * speed;
        enemy.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      }
    } else {
      enemy.chaseTimer -= dt / 1000;
    }
    
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    
    // Collision damage scaled by enemy type
    const playerDist = Math.hypot(player.x + 8 - (enemy.x + 8), player.y + 8 - (enemy.y + 8));
    if(playerDist < 16 && enemy.attackCooldown <= 0) {
      let damage = 1;
      if(enemy.type === 'brute') damage = 3;
      if(enemy.type === 'mage') damage = 2;
      player.hp = Math.max(0, player.hp - damage);
      enemy.attackCooldown = 1500;
      if(player.hp <= 0) {
        AUDIO.sfxDefeat();
        gameOver = true;
      }
    }
  });
}
function updateProjectiles(dt) { projectiles.forEach((p,i) => { p.life -= dt/1000; if(p.life <= 0) projectiles.splice(i,1); }); }
function lighten(hex, amt) { return hex; }

const cam = {x:0, y:0};
function updateCamera(){
  const tx = player.x + 8 - W/2;
  const ty = player.y + 8 - H/2;
  cam.x += (tx - cam.x) * .1;
  cam.y += (ty - cam.y) * .1;
  cam.x = Math.max(0, Math.min(cam.x, COLS*TILE - W));
  cam.y = Math.max(0, Math.min(cam.y, ROWS*TILE - H));
}

let lastTs = 0;
let gameOver = false;
let waveObjComplete = false;
let wave2Spawned = false;
let bossWaveStarted = false;
let wave1Complete = false;
let wave2Complete = false;

function update(dt){
  if(gameOver) return;
  
  const hpPercent = (player.hp / player.maxHp) * 100;
  
  NPCS.forEach(npc=>{
    npc.animTick += dt;
    if(npc.animTick > 200){ npc.animTick=0; npc.animFrame=(npc.animFrame+1)%4; }
  });

  if(boss.active){
    boss.animTick += dt;
    if(boss.animTick > 200){ boss.animTick=0; boss.animFrame=(boss.animFrame+1)%4; }
    
    updateBossPhase();
    
    if(boss.stunned){
      boss.stunDuration -= dt;
      if(boss.stunDuration <= 0) boss.stunned = false;
    } else {
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const dist = Math.hypot(dx, dy);
      
      // Boss speed increases by phase
      let phaseSpeed = boss.speed;
      if(boss.phase === 2) phaseSpeed = boss.speed * 1.2;
      else if(boss.phase === 3) phaseSpeed = boss.speed * 1.5;
      
      if(dist > 0){
        const speed = phaseSpeed * dt / 1000;
        boss.vx = (dx / dist) * speed;
        boss.vy = (dy / dist) * speed;
        boss.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      }
      
      // Boss collision check
      const nextBossTx1 = Math.floor((boss.x + boss.vx) / TILE);
      const nextBossTy1 = Math.floor((boss.y + boss.vy) / TILE);
      const nextBossTx2 = Math.floor((boss.x + boss.vx + 15) / TILE);
      const nextBossTy2 = Math.floor((boss.y + boss.vy + 15) / TILE);
      if(!isSolid(nextBossTx1, nextBossTy1) && !isSolid(nextBossTx2, nextBossTy2)) {
        boss.x += boss.vx;
        boss.y += boss.vy;
      }
      
      // Boss phase attacks with enhanced effects
      boss.projectileAttackTimer -= dt;
      if(boss.phase === 1 && boss.projectileAttackTimer <= 0){
        // Phase 1: Single slow projectile
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        projectiles.push({
          x: boss.x+8, y: boss.y+8, 
          vx: Math.cos(angle)*80, vy: Math.sin(angle)*80, 
          life:0.8, maxLife:0.8, type:'boss_proj', damage:6, phase:1
        });
        boss.projectileAttackTimer = 2000;
        FX.shake(1);
      } else if(boss.phase === 2 && boss.projectileAttackTimer <= 0){
        // Phase 2: Multiple projectiles with spread
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        for(let i = -1; i <= 1; i++){
          const spread = angle + i * 0.25;
          projectiles.push({
            x: boss.x+8, y: boss.y+8, 
            vx: Math.cos(spread)*110, vy: Math.sin(spread)*110,
            life:0.7, maxLife:0.7, type:'boss_proj', damage:5, phase:2
          });
        }
        boss.projectileAttackTimer = 1200;
        FX.shake(3);
      } else if(boss.phase === 3 && boss.projectileAttackTimer <= 0){
        // Phase 3: Rapid fire spread attack
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        for(let i = -2; i <= 2; i++){
          const spread = angle + i * 0.2;
          projectiles.push({
            x: boss.x+8, y: boss.y+8, 
            vx: Math.cos(spread)*130, vy: Math.sin(spread)*130,
            life:0.6, maxLife:0.6, type:'boss_proj', damage:4, phase:3
          });
        }
        boss.projectileAttackTimer = 600;
        FX.shake(4);
      }
    }
    
    // Boss projectile damage to player
    projectiles = projectiles.filter(p => {
      if(p.type === 'boss_proj'){
        const playerDist = Math.hypot(player.x + 8 - p.x, player.y + 8 - p.y);
        if(playerDist < 12){
          player.hp = Math.max(0, player.hp - p.damage);
          showDamagePopup(p.x, p.y, '-' + p.damage);
          FX.shake(2);
          if(player.hp <= 0) {
            AUDIO.sfxDefeat();
            gameOver = true;
          }
          return false;
        }
      }
      return true;
    });
    
    // Check if player reached exit zone
    if(EXIT_ZONE.active) {
      const dist = Math.hypot(player.x + 8 - (EXIT_ZONE.x + EXIT_ZONE.w/2), 
                              player.y + 8 - (EXIT_ZONE.y + EXIT_ZONE.h/2));
      if(dist < 20) {
        gameOver = true;
        showNarrator('You escape the collapsing world...', 3000, ()=> {
          showNarrator('[CHAPTER 1 COMPLETE]', 3000);
        });
      }
    }
  }

  updateEnemies(dt);
  updateProjectiles(dt);
  updateDrops(dt);
  
  // Check if first wave defeated
  if(gameStage === 1 && enemies.length === 0 && !wave1Complete && enemiesSpawned && !wave2Spawned){
    wave1Complete = true;
    showNarrator('The first wave falls...', 2000, ()=>{
      showWordObtain('BURN', 'You can now burn away lies.', ()=>{
        player.words.push('BURN');
        burnObtained = true;
        objectiveText = 'Prepare for the next wave';
        // Auto-start Wave 2 after 3 seconds
        setTimeout(()=> spawnEnemiesWave2(), 3000);
      });
    });
  }
  
  // Check if second wave defeated
  if(gameStage === 1 && enemies.length === 0 && wave1Complete && wave2Spawned && !wave2Complete){
    wave2Complete = true;
    showNarrator('The Void retreats further...', 2000, ()=>{
      showWordObtain('ERASE', 'Unmake the world itself.', ()=>{
        player.words.push('ERASE');
        objectiveText = 'Face the true threat';
        // Auto-trigger boss after 2 seconds
        setTimeout(()=> triggerBossFight(), 2000);
      });
    });
  }

  if(!player.canMove || dlgActive) return;

  let vx=0, vy=0;
  if(keys['w']||keys['arrowup'])    vy=-1;
  if(keys['s']||keys['arrowdown'])  vy= 1;
  if(keys['a']||keys['arrowleft'])  vx=-1;
  if(keys['d']||keys['arrowright']) vx= 1;

  if(vx!==0&&vy!==0){ vx*=.707; vy*=.707; }

  const spd = player.speed * dt/1000;
  const nx = player.x + vx*spd;
  const ny = player.y + vy*spd;

  if(vx!==0||vy!==0){
    if(vx>0) player.dir='right';
    else if(vx<0) player.dir='left';
    else if(vy>0) player.dir='down';
    else player.dir='up';
    player.animTick += dt;
    if(player.animTick>150){ player.animTick=0; player.animFrame=(player.animFrame+1)%4; }
    // Check collision
    const nextTx1 = Math.floor(nx / TILE);
    const nextTy1 = Math.floor(ny / TILE);
    const nextTx2 = Math.floor((nx + 15) / TILE);
    const nextTy2 = Math.floor((ny + 15) / TILE);
    if(!isSolid(nextTx1, nextTy1) && !isSolid(nextTx2, nextTy2)) {
      player.x = nx;
      player.y = ny;
    }
  }
}

// █████████████████████████████████████████████████████████████████████████████
//  GAME LOOP & RENDERING
// █████████████████████████████████████████████████████████████████████████████
function gameLoop(ts){
  if(lastTs === 0) lastTs = ts;
  const dt = Math.min(ts - lastTs, 50);
  lastTs = ts;

  FX.updateParticles(dt);
  update(dt);
  updateCamera();
  render();

  requestAnimationFrame(gameLoop);
}

function render(){
  const shake = FX.getShakeOffset();
  ctx.save();
  ctx.scale(SCALE, SCALE);
  ctx.translate(shake.x, shake.y);
  ctx.translate(-cam.x, -cam.y);

  // Draw tilemap
  for(let ty=Math.floor(cam.y/TILE); ty<Math.ceil((cam.y+H)/TILE); ty++){
    for(let tx=Math.floor(cam.x/TILE); tx<Math.ceil((cam.x+W)/TILE); tx++){
      drawTile(tx, ty);
    }
  }

  // Draw tree foliage
  for(let ty=0; ty<ROWS; ty++){
    for(let tx=0; tx<COLS; tx++){
      if(MAP[ty][tx]===4){
        ctx.fillStyle='#2a5a28';
        ctx.beginPath();ctx.arc(tx*TILE+8,ty*TILE+5,8,0,Math.PI*2);ctx.fill();
      }
    }
  }

  drawRoofs();
  drawGlitchBuilding();
  drawErasedBuildings();

  // Draw NPCs
  NPCS.forEach(npc=>{
    ctx.save();
    drawChibi(ctx, npc.x+8, npc.y+16, npc.dir, npc.animFrame,
      npc.color, npc.hair, npc.shirt);
    if(npc.panicking){
      ctx.fillStyle='#ffff00';
      ctx.font='bold 8px monospace';
      ctx.textAlign='center';
      ctx.fillText('!', npc.x+8, npc.y-8);
    }
    ctx.restore();
    
    const px = player.x+8, py = player.y+8;
    const nx = npc.x+8, ny = npc.y+8;
    const dist = Math.hypot(px-nx, py-ny);
    if(dist < 32) drawInteractPrompt(npc.x+8, npc.y-8);
  });

  // Draw enemies
  enemies.forEach(enemy => {
    if(enemy.active) drawEnemy(enemy);
  });

  // Draw boss
  drawBoss();

  // Draw projectiles
  drawProjectiles();
  
  // Draw item drops
  drops.forEach(drop => drawDrop(drop));

  // Draw player
  drawChibi(ctx, player.x+8, player.y+16, player.dir, player.animFrame,
    '#d4a574', '#8a5a3a', '#6b8aca');

  // Distance check for boss prompt
  if(boss.active){
    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if(dist < 100 && player.words.includes('BURN')){
      drawBossPrompt(boss.x+8, boss.y-8);
    }
  }

  // Draw exit zone
  drawExitZone();

  ctx.restore();

  // Draw UI (not affected by camera/scale)
  FX.drawParticles(ctx);
  drawHealthBar();
  drawChapterInfo();
}

function drawHealthBar(){
  const hpPercent = (player.hp / player.maxHp) * 100;
  const x = 16;
  const y = 16;
  const w = 150;
  const h = 16;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x, y, w, h);
  
  // Border
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  
  // Health fill
  const fillWidth = (w - 4) * (hpPercent / 100);
  ctx.fillStyle = hpPercent > 50 ? '#27ae60' : hpPercent > 25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(x + 2, y + 2, fillWidth, h - 4);
  
  // HP text
  ctx.font = 'bold 10px Press Start 2P';
  ctx.fillStyle = '#c9a84c';
  ctx.textAlign = 'center';
  ctx.fillText('HP: ' + Math.ceil(player.hp) + '/' + player.maxHp, x + w/2, y + h + 14);
}

function drawChapterInfo(){
  const x = canvas.width - 200;
  const y = 16;
  
  ctx.font = 'bold 12px Cinzel';
  ctx.fillStyle = '#c9a84c';
  ctx.textAlign = 'right';
  ctx.fillText(villageInfo.chapter, x + 180, y);
  
  ctx.font = '10px Cinzel';
  ctx.fillStyle = '#a89060';
  ctx.fillText(villageInfo.name, x + 180, y + 20);
}

// █████████████████████████████████████████████████████████████████████████████
//  DRAWING FUNCTIONS
// █████████████████████████████████████████████████████████████████████████████
function drawTile(tx, ty){
  if(tx<0||ty<0||tx>=COLS||ty>=ROWS) return;
  const t = MAP[ty][tx];
  const x = tx*TILE, y = ty*TILE;
  const col = TILE_COLORS[t] || '#111';
  ctx.fillStyle = col;
  ctx.fillRect(x, y, TILE, TILE);

  if(t===0){
    if((tx+ty)%3===0){ ctx.fillStyle='#244a22'; ctx.fillRect(x+3,y+3,2,2); }
    if((tx*3+ty)%5===0){ ctx.fillStyle='#1e3a1e'; ctx.fillRect(x+9,y+7,2,3); }
  }
  if(t===2){
    ctx.fillStyle='#443830';
    ctx.fillRect(x+1,y+1,6,6); ctx.fillRect(x+9,y+9,6,6);
    ctx.fillStyle='#2a2018';
    ctx.fillRect(x+1,y+9,6,6); ctx.fillRect(x+9,y+1,6,6);
  }
  if(t===3){
    ctx.fillStyle = (Math.sin(Date.now()*.001+tx+ty)>.3)?'#223366':'#1a2a55';
    ctx.fillRect(x+2,y+2,TILE-4,TILE-4);
    ctx.fillStyle='#4466aa44';
    ctx.fillRect(x+4,y+6,4,2); ctx.fillRect(x+10,y+10,4,2);
  }
  if(t===1){
    ctx.fillStyle='#1e1e3a';
    if(ty%2===0){ ctx.fillRect(x,y+4,TILE,2); } else { ctx.fillRect(x+8,y+4,TILE-8,2); }
    ctx.fillStyle='#222240';
    ctx.fillRect(x,y,TILE,2);
  }
  if(t===4){
    ctx.fillStyle='#0a1a08';
    ctx.fillRect(x+6,y+10,4,TILE-10);
    ctx.fillStyle='#1a4a18';
    ctx.beginPath();ctx.arc(x+8,y+7,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#226a20';
    ctx.beginPath();ctx.arc(x+8,y+5,5,0,Math.PI*2);ctx.fill();
  }
  if(t===5){
    ctx.fillStyle='#5a3010';
    ctx.fillRect(x+2,y,TILE-4,TILE);
    ctx.fillStyle='#8b5020';
    ctx.fillRect(x+4,y+2,4,6); ctx.fillRect(x+9,y+2,3,6);
    ctx.fillStyle='#c9a84c';
    ctx.fillRect(x+11,y+6,2,2);
  }
  if(t===6){
    ctx.fillStyle='#3a3a2a';
    ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle='#5a5a4a';
    ctx.fillRect(x+2,y+2,5,5); ctx.fillRect(x+9,y+7,5,5);
    ctx.fillStyle='#6a6a5a';
    ctx.fillRect(x+4,y+8,4,4); ctx.fillRect(x+10,y+3,3,3);
    ctx.fillStyle='#2a2a1a';
    ctx.fillRect(x+1,y+12,TILE-2,2);
  }
}

function drawRoofs(){
  ctx.fillStyle='#3a2a1a';
  ctx.fillRect(4*TILE, 2*TILE, 3*TILE, TILE*.5);
  ctx.fillStyle='#2a1a0a';
  ctx.beginPath();
  ctx.moveTo(4*TILE, 2*TILE);
  ctx.lineTo(5.5*TILE, 1*TILE);
  ctx.lineTo(7*TILE, 2*TILE);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle='#3a1a1a';
  ctx.beginPath();
  ctx.moveTo(10*TILE, 2*TILE);
  ctx.lineTo(11*TILE, 1*TILE);
  ctx.lineTo(12*TILE, 2*TILE);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle='#1a2a3a';
  ctx.beginPath();
  ctx.moveTo(16*TILE, 3*TILE);
  ctx.lineTo(16.5*TILE, 2*TILE);
  ctx.lineTo(17*TILE, 3*TILE);
  ctx.closePath(); ctx.fill();
}

function drawChibi(ctx, cx, cy, dir, frame, skinCol, hairCol, shirtCol, scale=1){
  const s=scale;
  const f=(v)=>Math.round(v*s);
  const lleg = dir==='left'||dir==='right' ? Math.sin(frame*.3)*2 : 0;
  const rleg = -lleg;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.globalAlpha=.2;
  ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(0,f(12),f(5),f(2),0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;

  ctx.fillStyle='#333';
  ctx.fillRect(f(-4),f(5)+lleg,f(3),f(5));
  ctx.fillRect(f(1),f(5)+rleg,f(3),f(5));
  ctx.fillStyle='#1a0a00';
  ctx.fillRect(f(-5),f(9)+lleg,f(4),f(3));
  ctx.fillRect(f(1),f(9)+rleg,f(4),f(3));

  ctx.fillStyle=shirtCol;
  ctx.fillRect(f(-5),f(-1),f(10),f(7));
  ctx.fillStyle=lighten(shirtCol,20);
  ctx.fillRect(f(-2),f(-1),f(4),f(2));

  ctx.fillStyle=shirtCol;
  ctx.fillRect(f(-8),f(0),f(3),f(6));
  ctx.fillRect(f(5),f(0),f(3),f(6));

  ctx.fillStyle=skinCol;
  ctx.fillRect(f(-4),f(-9),f(8),f(8));

  ctx.fillStyle=hairCol;
  ctx.fillRect(f(-4),f(-10),f(8),f(4));
  ctx.fillRect(f(-5),f(-9),f(2),f(4));
  ctx.fillRect(f(3),f(-9),f(2),f(4));

  if(dir!=='up'){
    ctx.fillStyle='#fff';
    ctx.fillRect(f(-3),f(-7),f(2),f(2));
    ctx.fillRect(f(1),f(-7),f(2),f(2));
    ctx.fillStyle='#111';
    ctx.fillRect(f(-3),f(-6),f(1),f(1));
    ctx.fillRect(f(1),f(-6),f(1),f(1));
  } else {
    ctx.fillStyle=hairCol;
    ctx.fillRect(f(-4),f(-9),f(8),f(5));
  }

  ctx.restore();
}

function drawBoss(){
  if(!boss.active) return;
  
  ctx.save();
  
  // Damage flash
  if(boss.stunned){
    ctx.globalAlpha = 0.5 + Math.sin(Date.now()*.02)*0.2;
  }
  
  // Glitch effect intensifies by phase
  const glitchAmount = boss.phase > 1 ? Math.sin(Date.now()*.015) * 3 * boss.phase : 0;
  
  const cx = boss.x + glitchAmount, cy = boss.y + glitchAmount, dir = boss.dir, frame = boss.animFrame;
  drawChibi(ctx, cx, cy, dir, frame, '#b84a4a', '#8a2a2a', '#1a1a3a', 1.3);
  
  // Enhanced phase auras
  let auraColor = '#cc2233';
  let auraSize = 20;
  if(boss.phase === 2) {
    auraColor = '#ff8833';
    auraSize = 25;
  } else if(boss.phase === 3) {
    auraColor = '#ff0033';
    auraSize = 30;
  }
  
  // Pulsing aura
  const pulse = 1 + Math.sin(Date.now()*.008) * 0.2;
  ctx.strokeStyle = auraColor;
  ctx.lineWidth = 2 + boss.phase;
  ctx.beginPath();
  ctx.arc(cx, cy, auraSize * pulse, 0, Math.PI*2);
  ctx.stroke();
  
  // Inner aura
  ctx.strokeStyle = auraColor + 'aa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, auraSize * 0.5, 0, Math.PI*2);
  ctx.stroke();
  
  // Boss HP bar with phase color
  const hpPercent = boss.hp / boss.maxHp;
  const barX = cx - 30;
  const barY = cy - 40;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(barX, barY, 60, 8);
  
  let barColor = '#00ff00';
  if(boss.phase === 2) barColor = '#ff8833';
  else if(boss.phase === 3) barColor = '#ff0033';
  
  ctx.fillStyle = barColor + 'dd';
  ctx.fillRect(barX + 1, barY + 1, (60 - 2) * hpPercent, 6);
  
  // Phase indicator with glow
  ctx.font = 'bold 10px Arial';
  ctx.fillStyle = auraColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = auraColor;
  ctx.shadowBlur = 8;
  ctx.fillText('PHASE ' + boss.phase, cx, cy + 35);
  ctx.shadowBlur = 0;
  
  ctx.restore();
}

function drawEnemy(enemy){
  ctx.save();
  
  const glitch = Math.sin(Date.now()*.008 + enemy.x);
  ctx.globalAlpha = 0.7 + Math.sin(Date.now()*.005)*0.3;
  
  let color = glitch > 0 ? '#ff3333' : '#cc1111';
  let hairColor = glitch > 0 ? '#990000' : '#660000';
  
  // Color by enemy type
  if(enemy.type === 'scout') { color = '#ff6644'; hairColor = '#cc3322'; }
  if(enemy.type === 'brute') { color = '#cc0000'; hairColor = '#880000'; }
  if(enemy.type === 'mage') { color = '#8844ff'; hairColor = '#5522cc'; }
  
  drawChibi(ctx, enemy.x+8, enemy.y+16, enemy.dir, enemy.animFrame,
    color, hairColor, '#0a0a2a', 1);
  
  ctx.globalAlpha = 1;
  
  ctx.strokeStyle = '#ff4444cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(enemy.x+8, enemy.y+8, 18, 0, Math.PI*2);
  ctx.stroke();
  
  // Draw enemy type label and HP
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 6px monospace';
  ctx.textAlign = 'center';
  const typeLabel = enemy.type.toUpperCase();
  ctx.fillText(typeLabel, enemy.x+8, enemy.y-10);
  
  // Draw HP bar
  const hpPercent = enemy.hp / enemy.maxHp;
  ctx.fillStyle = '#111';
  ctx.fillRect(enemy.x-6, enemy.y-3, 12, 2);
  ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
  ctx.fillRect(enemy.x-6, enemy.y-3, 12*hpPercent, 2);
  
  ctx.restore();
}

function drawExitZone(){
  if(!EXIT_ZONE.active) return;
  const x = EXIT_ZONE.x, y = EXIT_ZONE.y, w = EXIT_ZONE.w, h = EXIT_ZONE.h;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

function drawGlitchBuilding(){
  if(!glitchBuilding) return;
  const {tx,ty,tw,th} = glitchBuilding;
  const x=tx*TILE, y=ty*TILE, w=tw*TILE, h=th*TILE;
  ctx.save();
  ctx.globalAlpha = 1 - glitchProgress;
  ctx.fillStyle='#2a2a4a';
  ctx.fillRect(x,y,w,h);
  for(let i=0;i<8;i++){
    const gy = y + Math.random()*h;
    const gw = Math.random()*w*.7;
    const gx = x + Math.random()*w*.3;
    ctx.fillStyle = Math.random()>.5?'#ff224422':'#00e5ff22';
    ctx.fillRect(gx,gy,gw,2);
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function drawErasedBuildings(){
  erasedBuildings.forEach(b=>{
    const x=b.tx*TILE, y=b.ty*TILE, w=b.tw*TILE, h=b.th*TILE;
    ctx.fillStyle='#04040a';
    ctx.fillRect(x,y,w,h);
    ctx.strokeStyle='#ff224433';
    ctx.lineWidth=1;
    ctx.setLineDash([2,4]);
    ctx.strokeRect(x,y,w,h);
    ctx.setLineDash([]);
    for(let i=0;i<12;i++){
      ctx.fillStyle=Math.random()>.5?'#ff224422':'#00e5ff22';
      ctx.fillRect(x+Math.random()*w, y+Math.random()*h, 2, 1);
    }
  });
}

function drawInteractPrompt(x, y){
  ctx.fillStyle='#c9a84ccc';
  ctx.fillRect(x-8, y-20, 16, 12);
  ctx.fillStyle='#111';
  ctx.font='bold 8px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('E', x, y-11);
  ctx.textAlign='left';
}

function drawBossPrompt(x, y){
  ctx.fillStyle='#cc223388';
  ctx.fillRect(x-12, y-28, 24, 14);
  ctx.fillStyle='#fff';
  ctx.font='bold 7px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('F:BURN', x, y-17);
  ctx.textAlign='left';
}

function drawProjectiles(){
  projectiles.forEach(proj => {
    const progress = 1 - (proj.life / proj.maxLife);
    ctx.save();
    ctx.globalAlpha = 1 - (proj.life / proj.maxLife);
    
    if(proj.type === 'burn'){
      ctx.fillStyle = '#ff9944';
      ctx.shadowColor = '#ff9944';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 6, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = '#ffcc66';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 3, 0, Math.PI*2);
      ctx.fill();
    } else if(proj.type === 'erase'){
      ctx.strokeStyle = '#00ccff';
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 8, 0, Math.PI*2);
      ctx.stroke();
      
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(proj.x-6, proj.y);
      ctx.lineTo(proj.x+6, proj.y);
      ctx.moveTo(proj.x, proj.y-6);
      ctx.lineTo(proj.x, proj.y+6);
      ctx.stroke();
    } else if(proj.type === 'boss_proj'){
      // Boss projectiles - phase-based coloring with enhanced effects
      let projColor = '#ff3366';
      let glowColor = '#ff3366';
      let size = 5;
      
      if(proj.phase === 2){
        projColor = '#ff8833';
        glowColor = '#ff8833';
        size = 6;
      } else if(proj.phase === 3){
        projColor = '#ff0033';
        glowColor = '#ff0033';
        size = 7;
      }
      
      // Glow effect
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12 + (proj.phase || 1) * 3;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, size, 0, Math.PI*2);
      ctx.fill();
      
      // Inner core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, size * 0.4, 0, Math.PI*2);
      ctx.fill();
      
      // Trailing particles for phase 3
      if(proj.phase === 3){
        ctx.fillStyle = glowColor + 'aa';
        ctx.beginPath();
        ctx.arc(proj.x - proj.vx * 0.02, proj.y - proj.vy * 0.02, size * 0.6, 0, Math.PI*2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  });
}

function lighten(hex, amt){
  if(!hex || hex.length < 7) return hex;
  const n=parseInt(hex.slice(1),16);
  const r=Math.min(255,((n>>16)&0xff)+amt);
  const g=Math.min(255,((n>>8)&0xff)+amt);
  const b=Math.min(255,(n&0xff)+amt);
  const result = '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
  return result;
}
