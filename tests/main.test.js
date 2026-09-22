const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const {EventEmitter}=require('node:events');
async function main(){
 const app=new EventEmitter();Object.assign(app,{whenReady:()=>Promise.resolve(),getPath:()=>'/test',getLoginItemSettings:()=>({openAtLogin:false}),setLoginItemSettings(){},requestSingleInstanceLock:()=>true,quit(){}});
 const ipcMain=new EventEmitter();ipcMain.handlers={};ipcMain.handle=(key,fn)=>ipcMain.handlers[key]=fn;
 const screen=new EventEmitter();let displays=[{id:1,label:'Primary',workArea:{x:0,y:0,width:1200,height:760}},{id:2,label:'Secondary',workArea:{x:-900,y:200,width:900,height:600}}];screen.getAllDisplays=()=>displays;screen.getPrimaryDisplay=()=>displays[0];
 let window,menu;const sent=[];class Window extends EventEmitter{constructor(options){super();this.options=options;this.webContents={send:(...args)=>sent.push(args)};window=this;}loadFile(){}setIgnoreMouseEvents(){}setVisibleOnAllWorkspaces(){}setBounds(bounds){this.bounds=bounds;}show(){}}
 class Tray extends EventEmitter{setToolTip(){}setContextMenu(value){menu=value;}}
 const electron={app,ipcMain,screen,BrowserWindow:Window,Tray,Menu:{buildFromTemplate:x=>x},nativeImage:{createFromBuffer:()=>({})},powerMonitor:new EventEmitter()};
 vm.runInNewContext(fs.readFileSync('main.js','utf8'),{Buffer,process,__dirname:process.cwd(),require:name=>name==='electron'?electron:name==='fs'?{readFileSync(){throw Error('no preferences');},writeFileSync(){}}:require(name)});
 await Promise.resolve();return {ipc:ipcMain.handlers,sent,getWindow:()=>window,getMenu:()=>menu,screen,removeSecondary:()=>{displays=displays.slice(0,1);screen.emit('display-removed');}};
}
test('legacy mode initializes the tray and IPC mode changes agree',async()=>{const h=await main();assert.equal(h.ipc['initialize-settings'](null,{mode:'reminder'}).mode,'reminder');assert.ok(h.getMenu().find(item=>item.checked&&item.label.includes('提醒')));assert.equal(h.ipc['set-mode'](null,'companion'),'companion');assert.ok(h.sent.some(([channel,value])=>channel==='switch-mode'&&value==='companion'));});
test('selected screen uses work area and unplug returns to primary',async()=>{const h=await main();h.ipc['select-display'](null,2);assert.equal(h.getWindow().bounds.x,-900);h.removeSecondary();assert.equal(h.getWindow().bounds.x,0);assert.equal(h.getWindow().bounds.height,760);assert.ok(h.sent.some(([channel])=>channel==='displays-changed'));});
test('invalid mode does not replace current mode',async()=>{const h=await main();assert.equal(h.ipc['set-mode'](null,'invalid'),'companion');});
