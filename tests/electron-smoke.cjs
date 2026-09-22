
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs');const path=require('node:path');
const output=path.resolve('out/verification');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',path.join(output,'test-profile'));
let mode='reminder';let win;const errors=[];
const state=()=>({mode,displayId:1,autoStart:false,displays:[{id:1,label:'测试屏幕'}]});
ipcMain.handle('initialize-settings',()=>state());
ipcMain.handle('set-mode',(_event,value)=>{mode=value;win.webContents.send('switch-mode',value);return value;});
ipcMain.handle('select-display',()=>state());ipcMain.handle('auto-start',()=>false);ipcMain.handle('get-auto-start',()=>false);ipcMain.on('set-language',()=>{});
for(const channel of ['set-ignore-mouse-events','set-focusable'])ipcMain.on(channel,()=>{});
app.whenReady().then(async()=>{
 try {
  win=new BrowserWindow({show:false,width:Number(process.env.PET_TEST_WIDTH)||1000,height:Number(process.env.PET_TEST_HEIGHT)||760,webPreferences:{preload:path.resolve('preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
  win.webContents.on('console-message',(_event,level,message)=>{if(level===3)errors.push(message);});
  await win.loadFile(path.resolve('src/index.html'));
  const result=await win.webContents.executeJavaScript(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100&&!window.pet;i++)await wait(50);
    const p=window.pet;if(!p)throw Error('renderer failed to initialize');
    let checks=0;const check=(condition,message)=>{if(!condition)throw Error(message);checks++;};
    check(p.mode==='reminder','GIF preload preserves restored mode');
    for(const [state,asset] of [['idle','idle'],['walking','walk'],['sleeping','sleep'],['reminding','remind'],['sitting','sit'],['drag','drag']]) {
      p.setState(state);await wait(60);check(p.sprite.img.src.includes('/'+asset+'/'),'GIF '+state);check(p.sprite.img.naturalWidth>0,'loaded GIF '+state);
    }
    p.growth.completeIntro();p.switchMode('companion');
    p._showHealthReminder('healthBreak');p._showHealthReminder('healthWater');await wait(400);
    check(p.activeReminder.types.length===2,'merge');
    check(!document.getElementById('reminder-actions').classList.contains('hidden'),'action visibility');
    const before=p.growth.data.totalRemindersAccepted;
    document.querySelector('[data-reminder-action="accepted"]').click();
    document.querySelector('[data-reminder-action="accepted"]').click();
    check(p.growth.data.totalRemindersAccepted===before+1,'duplicate acceptance');
    p._showHealthReminder('healthWater');await wait(400);
    document.querySelector('[data-reminder-action="snoozed"]').click();
    check(!p.activeReminder,'snooze dismisses');
    check(p.growth.data.totalRemindersAccepted===before+1,'snooze does not accept');
    document.getElementById('quiet-toggle').click();
    check(p.isQuiet()&&p.state==='sleeping','quiet');
    p._showHealthReminder('healthBreak');check(!p.activeReminder&&!p._pendingReminders.length,'quiet suppresses reminders');
    document.getElementById('quiet-toggle').click();check(!p.isQuiet(),'quiet resume');
    document.querySelector('[data-mode="reminder"]').click();await wait(100);
    check(p.mode==='reminder','mode sync');
    check(JSON.parse(localStorage.getItem('desktop-pet-settings')).mode==='reminder','mode saved');
    p._showStatsBubble();await wait(650);p.handleClick();
    check(p.growth.data.totalRemindersAccepted===before+1,'stats click does not accept');
    await wait(500);p._showHealthReminder('healthBreak');await wait(1000);
    check(!!p.activeReminder,'reminder mode shows reminder');
    document.querySelector('[data-reminder-action="skipped"]').click();await wait(500);
    check(!p.activeReminder&&!p.isPoppedIn,'skip hides reminder');
    document.querySelector('[data-mode="companion"]').click();await wait(100);
    p._clearAllTimers();p.container.style.transition='none';p.container.style.left='0px';p.container.style.top='0px';p.container.style.bottom='auto';
    p.showBubble('这是一段用于检查屏幕边缘换行和完整显示的提醒文字。请休息一下，喝点水。',true);await wait(1600);
    const r=p.bubble.getBoundingClientRect();check(r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,'bubble bounds');
    document.getElementById('settings-panel').classList.remove('hidden');
    p.container.style.left='350px';p.container.style.top='350px';p._showHealthReminder('healthWater');await wait(400);
    for(const [lang,label] of [['zh-CN','完成了'],['en','Done'],['ja','できた'],['es','Hecho']]) {
      const select=document.getElementById('language-select');select.value=lang;select.dispatchEvent(new Event('change'));
      check(document.querySelector('[data-reminder-action="accepted"]').textContent===label,'localized '+lang);
      check(document.documentElement.lang===lang,'document language '+lang);
    }
    const size=document.getElementById('pet-size');size.value=175;size.dispatchEvent(new Event('input'));
    check(p.petWidth===280,'size slider');
    p.x=innerWidth+100;p.y=innerHeight+100;p._clampPosition();
    const cat=p.container.getBoundingClientRect();check(cat.right<=innerWidth&&cat.bottom<=innerHeight,'scaled cat bounds');
    size.value=100;size.dispatchEvent(new Event('input'));
    const language=document.getElementById('language-select');language.value='zh-CN';language.dispatchEvent(new Event('change'));
    p._clearAllTimers();p.container.style.transition='none';p.x=180;p.y=300;p._clampPosition();p.setState('reminding');p.showBubble(DesktopPetI18n.t('upgrade.combined'),true);
    document.querySelector('.settings-body').scrollTop=0;
    return {checks,mode:p.mode,viewport:[innerWidth,innerHeight],gif:p.sprite.img.src};
  })()`);
  await new Promise(resolve=>setTimeout(resolve,1600));
  const image=await win.webContents.capturePage();fs.writeFileSync(path.join(output,'upgrade.png'),image.toPNG());
  await win.webContents.executeJavaScript(`(async()=>{
    document.querySelector('.settings-body').scrollTop=10000;
    const language=document.getElementById('language-select');language.value='es';language.dispatchEvent(new Event('change'));
    const size=document.getElementById('pet-size');size.value=150;size.dispatchEvent(new Event('input'));
    const lock=document.getElementById('position-lock');if(!lock.checked)lock.click();
    await petAPI.setMode('reminder');
  })()`);
  await new Promise(resolve=>setTimeout(resolve,200));
  fs.writeFileSync(path.join(output,'settings-es.png'),(await win.webContents.capturePage()).toPNG());
  await win.loadFile(path.resolve('src/index.html'));
  const restored=await win.webContents.executeJavaScript(`(async()=>{
    for(let i=0;i<100&&!window.pet;i++)await new Promise(r=>setTimeout(r,50));
    if(!window.pet)throw Error('reload failed');
    if(pet.mode!=='reminder'||!pet.positionLocked||pet.petScale!==1.5||DesktopPetI18n.getLanguage()!=='es')throw Error('settings restoration failed');
    return {mode:pet.mode,locked:pet.positionLocked,scale:pet.petScale,language:DesktopPetI18n.getLanguage()};
  })()`);
  result.restored=restored;
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(output,'smoke-result.json'),JSON.stringify({ok:true,...result},null,2));app.exit(0);
 } catch(error){fs.writeFileSync(path.join(output,'smoke-result.json'),JSON.stringify({ok:false,error:error.stack},null,2));app.exit(1);}
});
setTimeout(()=>{fs.writeFileSync(path.join(output,'smoke-result.json'),JSON.stringify({ok:false,error:'timeout'}));app.exit(1);},30000);
