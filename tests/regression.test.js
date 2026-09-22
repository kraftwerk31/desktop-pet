process.env.TZ='Asia/Shanghai';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function growth(at='2026-09-22T00:30:00+08:00') {
 let time=new Date(at).getTime(); const storage=new Map();
 class Clock extends Date { constructor(...args){super(...(args.length?args:[time]));} static now(){return time;} }
 const c=vm.createContext({Date:Clock,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 vm.runInContext(fs.readFileSync('src/js/growth.js','utf8')+';globalThis.Growth=GrowthManager',c);
 return {g:new c.Growth(),advance:ms=>time+=ms};
}
test('mode time accumulates from zero',()=>{const {g}=growth();g.startSession();g.recordModeTime('companion',60000);assert.equal(g.data.analytics.currentSession.modeTime.companion,60000);});
test('local midnight is the current day',()=>{const {g}=growth();assert.equal(g._today(),'2026-09-22');});
test('usage excludes time between sessions',()=>{const {g,advance}=growth();g.startSession();advance(3600000);g.endSession();advance(3*3600000);g.startSession();advance(3600000);assert.equal(g.getSessionStats().todaySessionTime,'2h 0m');});
test('continuous running rolls over local midnight',()=>{const {g,advance}=growth('2026-09-22T23:59:00+08:00');g.startSession();advance(120000);g.getSessionStats();assert.equal(g.data.lastActiveDate,'2026-09-23');assert.equal(g.data.totalDays,2);assert.equal(g.getSessionStats().todaySessionTime,'1m');});
test('bond uses accumulated days',()=>{const {g}=growth();g.data.totalDays=30;g.data.consecutiveDays=1;assert.equal(g.getBondLevel(),5);});
test('busy users do not lose mood',()=>{const {g,advance}=growth();const score=g.getMood();advance(3600000);g.checkMoodDecay(new Date('2026-09-21T20:00:00+08:00').getTime());assert.ok(g.getMood()>=score);});
function engine(){
 const c=vm.createContext({setTimeout,clearTimeout,setInterval,clearInterval,Date,console,window:{innerWidth:800,innerHeight:600,DesktopPetI18n:{t:key=>key}},document:{getElementById:()=>null},requestAnimationFrame:fn=>fn()});
 for(const file of ['personalities','growth','pet','pet-movement','pet-intro','pet-health'])vm.runInContext(fs.readFileSync('src/js/'+file+'.js','utf8'),c);
 return vm.runInContext('Object.create(PetEngine.prototype)',c);
}
test('reminders queue while another reminder is active',()=>{const p=engine();p._pendingReminders=[];p.activeReminder={types:['healthBreak']};p.state='reminding';p.isPaused=false;p.quietUntil=0;p._showHealthReminder('healthWater');assert.equal(p._pendingReminders.length,1);});
test('clicking an informational popup does not accept a reminder',()=>{const p=engine();p.activeReminder=null;let count=0;p._recordReminderDismiss=()=>count++;assert.equal(typeof p.resolveReminder,'function');p.resolveReminder('accepted');assert.equal(count,0);});

function readyPet() {
 const p=engine();
 p.container={style:{},classList:{remove(){},add(){}},getBoundingClientRect:()=>({left:200,top:100,width:100,height:100,bottom:200})};
 p.character={style:{},classList:{add(){},remove(){}}};p._timers={};p._pendingReminders=[];p.reminderEnabled={};p.state='idle';p.mode='companion';p.isPaused=false;p.quietUntil=0;p._introPhase=null;p.activeReminder=null;p.personality='clingy';
 p._setTimer=(key,fn,delay)=>{p._timers[key]={fn,delay};};p._clearTimer=key=>{delete p._timers[key];};
 p.showBubble=()=>{};p.hideBubble=()=>{};p._positionBubble=()=>{};p.growth={completeIntro(){},getMoodLevel:()=> 'normal'};
 return p;
}
test('switching mode ends an unfinished intro',()=>{const p=readyPet();p._introPhase='peeking';p.switchMode('reminder');assert.equal(p._introPhase,null);});
test('locked pets do not seek attention by walking',()=>{const p=readyPet();p.positionLocked=true;p._startSeekAttention();assert.equal(p._timers.seek,undefined);});
test('a queued reminder survives mode switching',()=>{const p=readyPet();p.activeReminder={types:['healthWater']};p.switchMode('reminder');assert.ok(p._timers.reminderQueue);});
test('nearby deadlines merge into one reminder',()=>{const p=readyPet();p._showHealthReminder('healthBreak');p._showHealthReminder('healthWater');p._timers.reminderQueue.fn();assert.equal(p.activeReminder.types.length,2);assert.equal(p._timers.reminderTimeout.delay,30000);});
test('disabled reminders cannot schedule another deadline',()=>{const p=readyPet();p.reminderEnabled.healthWater=false;p.setWaterInterval(30);assert.equal(p._timers.waterReminder,undefined);});
test('quiet mode does not schedule health reminders',()=>{const p=readyPet();p.quietUntil=Date.now()+3600000;p.startHealthReminders();assert.equal(p._timers.waterReminder,undefined);});

test('a delayed ambient hide cannot erase an active reminder',()=>{const p=readyPet();let hides=0;p.bubble={classList:{remove(){hides++;}}};p.activeReminder={types:['healthWater']};p.hideBubble=Object.getPrototypeOf(p).hideBubble;p.hideBubble();assert.equal(hides,0);});
test('changing personality preserves active reminder text',()=>{const p=readyPet();let hides=0;p.hideBubble=()=>hides++;p.activeReminder={types:['healthWater']};p.setPersonality('dramatic');assert.equal(hides,0);});

test('closing just after midnight retains today usage',()=>{const {g,advance}=growth('2026-09-22T23:59:00+08:00');g.startSession();advance(120000);g.endSession();assert.equal(g.getSessionStats().todaySessionTime,'1m');});

test('switching one reminder off preserves the other deadline',()=>{const p=readyPet();p.breakInterval=2700000;p.waterInterval=1800000;p.startHealthReminders();const water=p._timers.waterReminder;p.setReminderEnabled('healthBreak',false);assert.equal(p._timers.waterReminder,water);});
test('mode switching preserves a pending snooze deadline',()=>{const p=readyPet();p.breakInterval=2700000;p.waterInterval=1800000;p._reminderDue={healthWater:Date.now()+300000};p.startHealthReminders();assert.ok(p._timers.waterReminder.delay<=300000);});

test('quiet companion returns onscreen after a reminder popup',()=>{const p=readyPet();p.x=100;p.y=100;p.screenWidth=800;p.screenHeight=600;p.petWidth=160;p.petHeight=160;p.container.style.left='820px';p.quietUntil=Date.now()+3600000;p.switchMode('companion');assert.equal(p.container.style.left,'100px');});
test('intro escape respects scaled pet bounds',()=>{const p=readyPet();p.screenWidth=800;p.petWidth=280;p.maxX=510;let target;p.walkTo=x=>target=x;p._introClicked();p._timers.state.fn();assert.ok(target<=510);});
test('walking cannot target outside the active display',()=>{const p=readyPet();p.minX=10;p.maxX=510;p.x=100;p.walkSpeed=.14;p.sprite={setFlip(){}};p.walkTo(780);assert.equal(p.x,510);});
