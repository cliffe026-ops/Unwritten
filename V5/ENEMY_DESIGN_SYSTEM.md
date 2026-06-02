# ECHOES OF THE UNWRITTEN - ENEMY DESIGN SYSTEM
## Complete Spawn, Behavior, and Attack Pattern Documentation

---

# PART 1: REGULAR MOBS

## MOB #1: GLITCH CRAWLER
**Role**: Fast, melee-focused, weak individual damage, spawns in groups

### Spawn Pattern
```
Interval: Every 8-12 seconds (wave-based)
Group Size: 3-5 crawlers per spawn
Spawn Locations: Random edges of screen (4 cardinal directions)
Spawn Sequence: 
  - Wave 1: 1 crawler (Tutorial)
  - Waves 2-5: 2-3 crawlers
  - Waves 6+: 4-5 crawlers
Acceleration: +1 crawler every 3 waves until max 5
```

### Behavior Pattern
```
State Machine:
├─ SPAWN (0.8s) → appears with fade-in, disoriented
├─ IDLE (0.3s) → brief pause, acquire target
├─ CHASE (duration: until 1 tile away or hit)
│  └─ Movement: Direct rush toward player
│  └─ Speed: 2.5 tiles/sec (fast)
│  └─ Target Priority: Closest player (only 1 player supported)
│
├─ ATTACK (0.4s wind-up + 0.2s execute)
│  └─ Trigger: Distance < 1 tile OR on timer every 3 sec
│
└─ RECOVER (0.6s) → brief stun after hit/miss
   └─ Resets to CHASE or IDLE

Movement Behavior:
  - Direct pathing (no pathfinding)
  - Moves in cardinal directions only (up/down/left/right)
  - Can overlap other enemies (stacking allowed)
  - Knocked back 2 tiles on hit, brief stun 0.4s

Target Priority:
  - Player distance < 10 tiles: CHASE
  - Otherwise: Idle, wander slowly (0.8 tiles/sec)
```

### Attack Pattern
```
Attack Type: Melee Dash
Wind-up: 0.4s (red flash/twitch animation)
Execution: 0.2s dash forward 1.5 tiles, hits first target touched
Damage: 5 HP
Hit Effect: Player knockback 1 tile, 0.3s stun
Miss Cooldown: 1.5s before next attack
Hit Cooldown: 2.0s before next attack
Variant (Every 4th Attack): 
  - Dash 2 tiles instead of 1.5 tiles
  - Same damage, extended reach
```

---

## MOB #2: SHADOW ARCHER
**Role**: Mid-range support, ranged attacks, kiting pattern, medium threat

### Spawn Pattern
```
Interval: Every 15-18 seconds (staggered after waves)
Group Size: 1-2 archers per spawn
Spawn Locations: Corners of screen (stay at range)
Spawn Sequence:
  - First spawn: Wave 4+
  - Waves 5-8: 1 archer
  - Waves 9+: 1-2 archers
Max Concurrent: 3 archers on screen
```

### Behavior Pattern
```
State Machine:
├─ SPAWN (1.2s) → fade in, draw bow, delay
├─ IDLE (0.5s) → scan for targets
├─ EVALUATE_RANGE
│  ├─ If player distance < 3 tiles: KITE (move away)
│  ├─ If player distance 3-8 tiles: AIM_AND_FIRE
│  └─ If player distance > 8 tiles: APPROACH (slowly)
│
├─ KITE (continuous while distance < 3)
│  └─ Move away at 1.2 tiles/sec (slower than player)
│  └─ Maintain ~5 tile distance
│
├─ APPROACH (when player far)
│  └─ Move closer at 0.8 tiles/sec
│
├─ AIM_AND_FIRE (1.5s wind-up)
│  └─ Lock in place, draw bow (telegraph)
│  └─ Fire arrow projectile
│  └─ Cooldown: 3.0s
│
└─ HIT_RECOVER (0.8s) → knocked back if struck

Movement Behavior:
  - Diagonal movement allowed (can move NE, NW, SE, SW)
  - Pathfinding: Attempts to maintain distance from player
  - Knockback: 3 tiles on hit, 0.5s stun
  - Cannot be pushed through walls
```

### Attack Pattern
```
Attack Type: Ranged Arrow Projectile
Wind-up: 1.5s (draw bow, glowing tell)
Projectile Speed: 3 tiles/sec
Projectile Lifetime: 5 seconds (despawns off-screen)
Execution: Arrow travels in straight line
Damage: 8 HP
Hit Effect: Player knockback 1 tile, 0.2s stun (light)
Miss After: Projectile despawns or hits wall
Cooldown: 3.0s after fire
Variant (Every 3rd Shot):
  - Fire 2 arrows in spread (15° angle apart)
  - Same damage per arrow
  - Telegraph shows multiple draw motions
```

---

## MOB #3: ECHO GUARDIAN
**Role**: Tank/healer, low damage, defensive, spawns rarely, disrupts flow

### Spawn Pattern
```
Interval: Every 25-30 seconds (late-game only)
Group Size: 1 guardian per spawn
Spawn Locations: Center-bottom of screen
Spawn Sequence:
  - First spawn: Wave 8+
  - Max concurrent: 2 guardians
Removal: Despawn when defeated OR 45 seconds on-screen
```

### Behavior Pattern
```
State Machine:
├─ SPAWN (1.0s) → materialize with shimmer effect
├─ IDLE (0.3s) → scan area
├─ EVALUATE_ALLIES
│  ├─ If ally HP < 60%: HEAL_ALLY (prioritize closest damaged ally)
│  ├─ If no damaged allies: PROTECT_MODE
│  └─ If threatened: DEFEND_SELF
│
├─ PROTECT_MODE (continuous)
│  └─ Move toward center of other mobs
│  └─ Speed: 0.5 tiles/sec (very slow)
│  └─ Radius: Stays within 6 tiles of nearest ally
│
├─ HEAL_ALLY (2.0s channel)
│  └─ Lock in place, glow effect
│  └─ Channel: Cannot move, can be interrupted
│  └─ Restore 15 HP to target ally
│  └─ Cooldown: 4.0s after heal
│
├─ DEFEND_SELF (when attacked)
│  └─ Raise shield, reduce damage 50%
│  └─ Shield active: 1.5s
│  └─ Cooldown: 3.0s
│
└─ RETREAT (if HP < 25%)
   └─ Move away from player at 1.5 tiles/sec
   └─ Will not heal while retreating

Movement Behavior:
  - Deliberate, predictable movement
  - Prefers cardinal directions
  - Knockback: 1.5 tiles (resistant, heavy armor)
  - Cannot be knocked through obstacles
```

### Attack Pattern
```
Attack Type: Protective Aura Pulse
Wind-up: 1.2s (aura expands, visual telegraph)
Execution: Aura hits all enemies within 2 tile radius
Damage: 3 HP (very low)
Effect: Heals all nearby allies 4 HP
Cooldown: 5.0s
Trigger: Only when surrounded by 2+ allies OR after defending
Special: Attack is DEFENSIVE, not aggressive
         Should be rare in typical gameplay
```

---

# PART 2: BOSS - THE SCRIBE (THE HERO AWAKENS)

**Boss Concept**: A corrupted entity that rewrites reality through 3 phases of escalating complexity.
**Total HP**: 180 HP (scales with difficulty)
**Difficulty Scaling**:
- Easy: 120 HP (30% reduction)
- Normal: 180 HP (baseline)
- Hard: 288 HP (60% increase)

---

## PHASE 1: THE AWAKENING (100% - 70% HP | 180→126 HP)
**Duration**: ~45-60 seconds
**Theme**: Aggressive but readable, establishes attack patterns
**Difficulty**: Moderate

### Boss Behavior Pattern
```
Phase 1 Behavior:
├─ SPAWN: Boss appears center-screen with dramatic effect (2.0s entrance)
├─ INTRO_MONOLOGUE: 3.0s dialogue/narration
├─ PRIMARY_ATTACK_LOOP: (repeating pattern)
│  ├─ Attack A: SLASH_COMBO
│  ├─ Attack B: DASH_STRIKE
│  ├─ Attack C: RANGED_SPIKE_BURST
│  ├─ RECOVERY_WINDOW: 1.5s safe zone for player to attack
│  └─ Loop Duration: ~8s per full cycle
│
├─ PHASE_BEHAVIOR:
│  ├─ Movement: Oscillates left/right, maintains center-ish position
│  ├─ Speed: 0.4 tiles/sec (slow, deliberate)
│  ├─ Distance from Player: Tries to maintain 3-5 tiles
│  └─ No mob spawns in Phase 1
│
└─ PHASE_TRANSITION (at 126 HP):
   └─ Screen shake, boss recoils, dramatic pause
   └─ 2.0s transition animation
   └─ Summons 4 Glitch Crawlers
```

### Phase 1 Attack Patterns

#### Attack A: SLASH_COMBO
```
Wind-up: 0.6s (sword raise, red glow)
Pattern: 3 sequential slashes
  Slash 1: 0.3s execute, hit 1.5 tile arc (right)
  Pause: 0.2s
  Slash 2: 0.3s execute, hit 1.5 tile arc (left)
  Pause: 0.2s
  Slash 3: 0.4s execute, hit 2 tile arc (overhead)
Damage: 6 HP per slash (18 total if all hit)
Hit Effect: Knockback 1 tile per slash
Recovery: 1.2s after final slash before next attack
Counterplay: Can dodge between slashes, or stay back
```

#### Attack B: DASH_STRIKE
```
Wind-up: 0.8s (charging pose, building energy aura)
Execution: 0.5s dash toward player, strikes on contact
Distance: Dashes 4 tiles toward player position
Damage: 12 HP (single hit)
Hit Effect: Knockback 2 tiles, 0.4s stun
Miss Effect: Boss slides past, stops at screen edge
Recovery: 1.0s cooldown, repositions slowly
Cooldown: 4.5s before next attack
Counterplay: Can sidestep dash trajectory, hits in straight line only
```

#### Attack C: RANGED_SPIKE_BURST
```
Wind-up: 1.0s (boss raises hand, spikes materialize)
Projectile: 6 spikes in cone pattern (60° spread)
Pattern: Fires cone aimed at last known player position
Projectile Speed: 2.0 tiles/sec
Projectile Lifetime: 4.0s
Damage: 4 HP per spike (24 max if all hit)
Hit Effect: Knockback 0.5 tiles per spike
Recovery: 1.5s after burst
Cooldown: 5.0s before next attack
Counterplay: Wide spread, can dodge by moving perpendicular to attack
           Or get close to minimize hit spikes
```

### Phase 1 Spawn Events
```
Timeline:
- 0s: Boss enters, intro monologue
- 3s: First attack cycle begins
- 30s: Increase tempo, attack cooldowns -0.3s
- Transition: When HP ≤ 126 (70%)
```

---

## PHASE 2: THE CORRUPTION (70% - 30% HP | 126→54 HP)
**Duration**: ~60-90 seconds
**Theme**: Faster, combined attacks, introduces mob coordination
**Difficulty**: Hard

### Boss Behavior Pattern
```
Phase 2 Behavior:
├─ ENTRY: Boss recovers, new phase music/visual effect
├─ CORRUPTION_AURA: Boss gains glowing red aura, attacks faster
├─ ADVANCED_ATTACK_LOOP: (more complex patterns)
│  ├─ Attack A: DOUBLE_SLASH_COMBO (faster version of Phase 1)
│  ├─ Attack B: TELEPORT_STRIKE (new attack)
│  ├─ Attack C: SPIKE_BURST_RAPID (faster version)
│  ├─ Attack D: SUMMON_CRAWLERS (mob spawn)
│  ├─ RECOVERY_WINDOW: 1.0s (shorter than Phase 1)
│  └─ Loop Duration: ~10s per cycle
│
├─ PHASE_BEHAVIOR:
│  ├─ Movement: More erratic, teleports, varied distances
│  ├─ Speed: 0.6 tiles/sec (faster movement)
│  ├─ Aggression: Pursues player more actively
│  └─ Mob Spawns: During attack cycle
│
└─ PHASE_TRANSITION (at 54 HP):
   └─ Screen glitch effect intensifies
   └─ Boss retreats to screen center
   └─ 3.0s dramatic pause
   └─ Summons 6 Glitch Crawlers + 2 Shadow Archers
```

### Phase 2 Attack Patterns

#### Attack A: DOUBLE_SLASH_COMBO (Faster)
```
Wind-up: 0.5s (sword raise, faster tell)
Pattern: 4 slashes (increased from Phase 1's 3)
  Slash 1: 0.25s execute, 1.5 tile arc (right)
  Pause: 0.15s
  Slash 2: 0.25s execute, 1.5 tile arc (left)
  Pause: 0.15s
  Slash 3: 0.3s execute, 1.8 tile arc (overhead)
  Pause: 0.15s
  Slash 4: 0.3s execute, 2.0 tile arc (spinning)
Damage: 6 HP per slash (24 total)
Hit Effect: Knockback 1 tile
Recovery: 1.0s
Cooldown: 3.5s
```

#### Attack B: TELEPORT_STRIKE (NEW)
```
Wind-up: 0.7s (boss flickers, red energy build-up)
Execution: Boss teleports 5 tiles away, immediately strikes
Teleport: Can be in any direction (8 directions + straight up/down)
Strike: 1.5s projectile slash that travels toward last player position
Damage: 8 HP on teleport impact + 5 HP if slash hits (13 max)
Hit Effect: Knockback 1.5 tiles
Recovery: 1.2s after slash
Cooldown: 4.0s
Counterplay: Predict teleport direction from wind-up visual
            Projectile can be dodged after it fires
```

#### Attack C: SPIKE_BURST_RAPID (Faster Version)
```
Wind-up: 0.7s (spikes materialize faster)
Projectiles: 9 spikes (increased from Phase 1's 6)
Pattern: Two bursts, 0.8s apart
  Burst 1: Cone aimed at player
  Pause: 0.8s
  Burst 2: Circle pattern around boss
Projectile Speed: 2.5 tiles/sec (faster)
Damage: 4 HP per spike (36 max)
Hit Effect: Knockback 0.5 tiles
Recovery: 1.0s after second burst
Cooldown: 4.5s
Counterplay: More projectiles, harder to dodge completely
            Being close reduces cone coverage
```

#### Attack D: SUMMON_CRAWLERS (NEW)
```
Wind-up: 1.2s (boss raises hand, void opens, red rifts appear)
Execution: Summon 4 Glitch Crawlers at screen edges
Damage: None directly (summon ability)
Effect: Spawns 4 crawlers at N, S, E, W edges
Crawler HP: Reduced to 8 HP each (easier to destroy)
Cooldown: 6.0s
Strategy: Player must manage adds while fighting boss
Recovery: 1.5s after summon
Special: Boss does NOT attack during summon animation (safe window)
```

### Phase 2 Spawn Events
```
Timeline (from Phase 2 start):
- 0s: Phase transition, boss recovers
- 2s: Summons 4 Glitch Crawlers first
- 8s: Attack cycle begins
- 15s: Second crawler summon
- 30s: Tempo increases, cooldowns -0.2s
- 45s+: Increased pressure, crawlers spawn every 4s
- Transition: When HP ≤ 54 (30%)
```

---

## PHASE 3: THE UNWRITING (30% - 0% HP | 54→0 HP)
**Duration**: ~90-120 seconds
**Theme**: Chaotic, combines all previous attacks, desperation mode
**Difficulty**: Very Hard

### Boss Behavior Pattern
```
Phase 3 Behavior:
├─ ENTRY: Screen glitches violently, boss transforms (warped visuals)
├─ BERSERKER_MODE: Boss enters frenzied state
│  ├─ All attack cooldowns: -30% (much faster)
│  ├─ All attack damage: +25%
│  ├─ Movement speed: 0.8 tiles/sec (faster, erratic)
│  └─ Aura pulses with damage (see below)
│
├─ CHAOTIC_ATTACK_LOOP: (all attacks mixed together)
│  ├─ Random selection each cycle:
│  │  ├─ QUADRUPLE_SLASH (Phase 2 + extra strike)
│  │  ├─ TELEPORT_STRIKE (faster variant)
│  │  ├─ SPIKE_BURST_SPIRAL (new, circles the boss)
│  │  ├─ SUMMON_MIXED_WAVE (crawlers + archers)
│  │  ├─ DESPERATION_PULSE (wide AOE around boss)
│  │  └─ CHAIN_ATTACKS (2-3 attacks with no recovery)
│  │
│  ├─ RECOVERY_WINDOW: 0.5s (minimal, dangerous)
│  └─ Loop Duration: 6-8s per cycle (unpredictable)
│
├─ PHASE_BEHAVIOR:
│  ├─ Movement: Highly erratic, teleports frequently
│  ├─ Distance: Varies, teleports behind/above/below player
│  ├─ Aura: Pulse every 2s, 3 HP damage to nearby player
│  └─ Mob Spawns: Frequent (every 3-4s)
│
└─ DEFEAT:
   └─ When HP reaches 0, boss collapses
   └─ 2.0s fall animation
   └─ Final dialogue/cutscene
   └─ Victory screen/transition to Chapter 2
```

### Phase 3 Attack Patterns

#### Attack A: QUADRUPLE_SLASH (Enhanced)
```
Wind-up: 0.4s (rapid sword raise)
Pattern: 4 slashes + spinning AOE
  Slashes 1-4: Same as Phase 2 Double Combo
  Spin: 0.4s spinning slash hits 2 tile radius
Damage: 6 HP per slash + 8 HP spin (32 total)
Hit Effect: Knockback 1.5 tiles per hit
Recovery: 0.8s
Cooldown: 3.0s
```

#### Attack B: TELEPORT_STRIKE (Rapid)
```
Wind-up: 0.5s (flickers more rapidly)
Execution: Boss teleports 3-6 tiles away, strikes
Teleports: Can execute 2-3 teleports before stopping
Each Teleport: Deals damage separately
Damage: 8 HP per teleport impact
Hit Effect: Knockback 1.5 tiles
Recovery: 0.6s after final teleport
Cooldown: 3.5s
Counterplay: Multiple strikes, harder to avoid all
```

#### Attack C: SPIKE_BURST_SPIRAL (NEW)
```
Wind-up: 0.6s (spikes spin around boss)
Pattern: Spiral of 12 spikes radiating outward
Direction: Can rotate clockwise or counterclockwise
Projectile Speed: 2.5 tiles/sec
Projectile Lifetime: 5s
Damage: 4 HP per spike (48 max if all hit)
Hit Effect: Knockback 0.5 tiles
Recovery: 1.0s
Cooldown: 4.0s
Counterplay: Large area attack, requires precision dodge or retreat
```

#### Attack D: SUMMON_MIXED_WAVE (NEW)
```
Wind-up: 1.0s (multiple rifts appear)
Execution: Summon combination of mobs
Summon: 4 Glitch Crawlers + 1 Shadow Archer
Placement: Screen edges + random locations
HP: Crawlers 8 HP, Archer 12 HP (slightly reduced)
Cooldown: 5.0s
Recovery: 1.5s
Strategy: Boss attacks while adds spawn (no safe window)
```

#### Attack E: DESPERATION_PULSE (NEW)
```
Wind-up: 0.8s (boss glows intensely, void spirals outward)
Execution: Large AOE pulse around boss
Radius: 5 tiles from boss center
Damage: 10 HP to player
Wave Count: 2 pulses (0s, then 0.5s after first)
Total Damage: 20 HP if both hit (high!)
Hit Effect: Knockback 2 tiles per pulse
Recovery: 2.0s (long recovery, but dangerous attack)
Cooldown: 6.0s
Counterplay: Large area, must move far away or use iframe abilities
            Longest recovery window of Phase 3
```

#### Attack F: CHAIN_ATTACKS (NEW)
```
Wind-up: 0.3s (boss crackles with energy)
Pattern: Boss chains 2-3 attacks with minimal breaks
  Chain 1: SLASH combo (reduced damage 4 HP per slash)
  Chain 2: Teleport strike (reduced damage 6 HP)
  Chain 3: Spike burst (4 spikes only, 4 HP each)
Recovery: 1.2s after chain completes
Cooldown: 5.0s
Strategy: Intense pressure attack, player has few safe windows
Counterplay: Learn timing of chain, iframe abilities crucial
```

### Phase 3 Passive Effect: CORRUPTION AURA
```
Activation: Continuous throughout Phase 3
Pattern: Aura pulses every 2.0 seconds
Radius: 3 tile radius around boss
Damage: 3 HP per pulse
Duration: Permanent until boss defeated
Counterplay: Stay at range, or health management
```

### Phase 3 Spawn Events
```
Timeline (from Phase 3 start):
- 0s: Phase transition, dramatic effect
- 3s: First attack cycle, starts mixed random pattern
- 5s: First crawler summon (4x)
- 10s: Mixed wave summon (4 crawlers + 1 archer)
- 15s+: Every 3-4s, random adds spawn
- Throughout: Aura pulses every 2s (3 HP damage)
- Continuous: Erratic teleportation, unpredictable attacks
```

---

## BOSS SUMMARY TABLE

| Phase | HP Range | Duration | Attacks | Cooldowns | Adds Spawned | Difficulty |
|-------|----------|----------|---------|-----------|--------------|-----------|
| 1     | 180→126  | 45-60s   | 3 types | 4-5s      | None         | Moderate  |
| 2     | 126→54   | 60-90s   | 4 types | 3.5-5s    | 4 crawlers   | Hard      |
| 3     | 54→0     | 90-120s  | 6 types | 3-5s      | Mixed waves  | Very Hard |

---

## DIFFICULTY SCALING

### Easy Mode
```
Regular Mobs:
- Movement speed: -20%
- Attack cooldowns: +15% (longer waits)
- Damage: -30%

Boss:
- Total HP: 120 (30% less)
- Phase 1: 0-84 HP
- Phase 2: 84-36 HP
- Phase 3: 36-0 HP
- Attack cooldowns: +20% (longer waits)
- Damage: -25%
- Fewer adds summoned (3 instead of 4, etc)
```

### Normal Mode (Baseline)
```
- All values as specified above
```

### Hard Mode
```
Regular Mobs:
- Movement speed: +20%
- Attack cooldowns: -15% (faster)
- Damage: +40%
- Spawn frequency: +25% (more mobs)

Boss:
- Total HP: 288 (60% more)
- Phase 1: 0-201.6 HP
- Phase 2: 201.6-86.4 HP
- Phase 3: 86.4-0 HP
- Attack cooldowns: -25% (much faster)
- Damage: +50%
- Additional adds summoned (+1 extra per wave)
- Aura damage in Phase 3: 5 HP (instead of 3 HP)
```

---

## PLAYER COUNTERPLAY & MECHANICS

### For Regular Mobs
```
Glitch Crawler:
- Fast but linear (easy to predict)
- Vulnerable after attack wind-up (0.4s)
- Can be kited around obstacles
- Groups are threat, not individuals

Shadow Archer:
- Slow movement outside combat
- Vulnerable during 1.5s aim wind-up
- Projectiles can be dodged/blocked
- Can be rushed before shot

Echo Guardian:
- Slowest, easy to hit
- Low damage output (not direct threat)
- Prioritize destruction to stop ally heals
- Focus fire to burst heal targets
```

### For Boss Phases
```
Phase 1:
- Readable attacks, long wind-ups (0.6-1.0s)
- Long recovery windows (1.2-1.5s) for player attacks
- No adds, can focus fully on boss
- Learn patterns before Phase 2

Phase 2:
- Attacks combined but still telegraphed
- Must juggle adds while fighting boss
- Shorter recovery windows (1.0s)
- Teleport strikes require prediction

Phase 3:
- Chaotic but NOT random (patterns exist)
- Desperation Pulse most punishable (2.0s recovery)
- Aura damage forces positioning
- Last resort window when adds are cleared
```

### Fair Counterplay Elements
```
✓ All attacks have 0.4s+ wind-up (readable)
✓ No guaranteed one-shot mechanics
✓ Safe recovery windows exist in all patterns
✓ Projectiles travel in straight lines (dodgeable)
✓ Melee attacks have limited range (keepaway strategy)
✓ Boss cannot attack while summoning (safe window)
✓ Phase transitions give player brief respite
```

---

## IMPLEMENTATION NOTES

### State Machine Pattern (Pseudocode Example)
```javascript
class Enemy {
  state = 'IDLE';
  stateTimer = 0;
  
  update(deltaTime) {
    this.stateTimer -= deltaTime;
    
    switch(this.state) {
      case 'IDLE':
        this.moveTowardPlayer();
        if (this.distanceToPlayer < 3) {
          this.transitionTo('ATTACK', 0.6); // wind-up
        }
        break;
        
      case 'ATTACK':
        if (this.stateTimer <= 0) {
          this.executeAttack();
          this.transitionTo('RECOVER', 1.2);
        }
        break;
        
      case 'RECOVER':
        if (this.stateTimer <= 0) {
          this.transitionTo('IDLE', 0.5);
        }
        break;
    }
  }
  
  transitionTo(newState, duration) {
    this.state = newState;
    this.stateTimer = duration;
  }
}
```

### Spawn System
```javascript
let waveCounter = 0;
let spawnTimer = 0;
const spawnIntervals = {
  'crawler': { min: 8, max: 12, count: () => 3 + Math.floor(waveCounter/3) },
  'archer': { min: 15, max: 18, count: () => waveCounter > 4 ? 1 : 0 },
  'guardian': { min: 25, max: 30, count: () => waveCounter > 8 ? 1 : 0 }
};

function spawnWave(type) {
  const config = spawnIntervals[type];
  for (let i = 0; i < config.count(); i++) {
    spawnEnemyAtRandomEdge(type);
  }
  waveCounter++;
}
```

---

## PLAYTESTING CHECKLIST

- [ ] Phase 1: Attacks readable? Wind-ups clear enough?
- [ ] Phase 1: Can player learn patterns? Do they feel repeatable?
- [ ] Phase 2: Do adds create new challenge without overwhelming?
- [ ] Phase 2: Does teleport attack feel fair or cheap?
- [ ] Phase 3: Chaotic but not RNG-dependent (patterns exist)?
- [ ] Phase 3: Is Desperation Pulse avoidable or too punishing?
- [ ] Difficulty modes: Does scaling feel proportional?
- [ ] Regular mobs: Solo threat vs group threat balanced?
- [ ] Recovery windows: Are they long enough for player counterplay?
- [ ] Damage values: Do they force interesting decisions (health management)?

---

## BALANCE TUNING GUIDE

If playtesting reveals issues:

```
Too Easy:
  - Reduce recovery windows by 0.2s
  - Increase attack damage by 10-20%
  - Reduce spawn intervals by 2s
  - Increase Phase 2/3 cooldowns (-10%)

Too Hard:
  - Increase recovery windows by 0.3s
  - Reduce attack damage by 15-20%
  - Increase spawn intervals by 3s
  - Reduce cooldown speed increase
  - Add more safe windows before Phase 2/3

Attacks Feel Unfair:
  - Increase wind-up time by 0.2-0.4s
  - Add visual telegraph effects
  - Reduce projectile speed
  - Add extra recovery between chained attacks

Adds Overwhelming:
  - Reduce spawn count by 1-2
  - Increase add HP to reduce player pressure
  - Add longer delays between summon waves
```

---

# CONCLUSION

This enemy design system provides:
- **3 distinct regular mob archetypes** (Damage Dealer, Ranged Support, Tank/Support)
- **1 boss with 3 escalating phases** spanning 3-4 minutes of gameplay
- **Clear telegraphs and fair counterplay** throughout
- **Scaling difficulty** that adjusts all major mechanics
- **Reusable patterns** that create learning opportunities for players

The system emphasizes **pattern recognition** and **positioning** over twitch reflexes, creating a skill-based difficulty curve. All attacks are avoidable with proper reading and timing.

---

*End of Enemy Design System Document*
