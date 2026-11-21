import {openGame} from './browser.js';
import {mkdirSync,writeFileSync,mkdtempSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const output=process.argv[2]??'docs/proof/phase-4';mkdirSync(output,{recursive:true});
const data=mkdtempSync(join(tmpdir(),'dao-ui-check-'));
const game=await openGame({env:{DAO_DATA_DIR:data},recordVideo:process.env.DAO_VIDEO_DIR?{dir:process.env.DAO_VIDEO_DIR,size:{width:1280,height:720}}:undefined});const errors=[];
try{
  const {page}=game;page.on('pageerror',err=>errors.push(err.message));await page.goto(game.url);
  await page.screenshot({path:output+'/menu.jpg'});await page.waitForTimeout(900);await page.getByRole('button',{name:'Vào đảo'}).click();await page.getByRole('button',{name:'Bắt đầu đêm'}).click();
  await page.keyboard.down('KeyW');await page.waitForTimeout(1900);await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');await page.keyboard.press('Shift');
  const measured=await page.evaluate(()=>new Promise(resolve=>{
    const stamps=[];function frame(t){stamps.push(t);if(stamps.length===61)resolve(60000/(t-stamps[0]));else requestAnimationFrame(frame);}requestAnimationFrame(frame);
  }));
  await page.screenshot({path:output+'/play.jpg'});await page.keyboard.press('Escape');await page.getByText('Tạm dừng',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Cài đặt'}).click();await page.locator('#sensitivity').fill('1.6');await page.locator('#accessible').check();await page.locator('#large').check();await page.locator('#reduced').check();
  await page.getByRole('button',{name:'Nhảy · Space',exact:true}).click();await page.keyboard.press('w');assert.equal(await page.locator('#keyError').textContent(),'Phím đã được dùng');
  await page.keyboard.press('j');await page.getByRole('button',{name:'Nhảy · KeyJ',exact:true}).waitFor();
  await page.getByRole('button',{name:'Quay lại'}).click();await page.getByRole('button',{name:'Tiếp tục'}).click();
  assert.equal(await page.locator('#clock').isVisible(),true);await page.reload();await page.getByRole('button',{name:'Hướng dẫn điều khiển'}).click();
  assert.equal(await page.locator('#sensitivity').inputValue(),'1.6');assert.equal(await page.locator('#accessible').isChecked(),true);
  await page.getByRole('button',{name:'Nhảy · KeyJ',exact:true}).waitFor();await page.getByRole('button',{name:'Khôi phục mặc định'}).click();
  await page.getByRole('button',{name:'Nhảy · Space',exact:true}).waitFor();
  await page.screenshot({path:output+'/settings.jpg'});await page.getByRole('button',{name:'Quay lại'}).click();
  await page.getByRole('button',{name:'Vào đảo'}).click();await page.getByRole('button',{name:'Bắt đầu đêm'}).click();
  // Use normal movement over the edge three times, then save via the real result screen.
  await page.keyboard.down('KeyD');await page.getByRole('button',{name:'Lưu điểm'}).waitFor({timeout:90000});await page.keyboard.up('KeyD');
  await page.locator('input[name=playerName]').fill('May_QA');await page.getByRole('button',{name:'Lưu điểm'}).click();
  await page.getByText('Đã lưu điểm',{exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Bảng xếp hạng'}).click();
  await page.getByText('May_QA',{exact:true}).waitFor();await page.screenshot({path:output+'/rank.jpg'});
  const out=join(data,'export.json'),exported=spawnSync(process.execPath,['tools/serve.js','--export-leaderboard',out],{env:{...process.env,DAO_DATA_DIR:data}});
  assert.equal(exported.status,0);assert.equal(JSON.parse(readFileSync(out)).entries[0].name,'May_QA');assert.deepEqual(errors,[]);
  const sample={width:1280,height:720,frames:60,avg_fps:measured,errors};writeFileSync(output+'/play.json',JSON.stringify(sample,null,2)+'\n');console.log(sample);
}finally{await game.close();}
