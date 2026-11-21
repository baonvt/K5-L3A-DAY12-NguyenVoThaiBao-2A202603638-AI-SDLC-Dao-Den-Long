import {openGame} from './browser.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const output=process.argv[2]??'docs/proof/phase-2';mkdirSync(output,{recursive:true});
const game=await openGame();const errors=[];
try{
  const {page}=game;page.on('pageerror',err=>errors.push(err.message));await page.goto(game.url);
  await page.getByRole('button',{name:'Vào đảo'}).click();await page.getByRole('button',{name:'Bắt đầu đêm'}).click();
  await page.keyboard.down('KeyW');await page.waitForTimeout(1900);await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');await page.keyboard.press('Shift');
  const measured=await page.evaluate(()=>new Promise(resolve=>{
    const stamps=[];function frame(t){stamps.push(t);if(stamps.length===61)resolve(60000/(t-stamps[0]));else requestAnimationFrame(frame);}requestAnimationFrame(frame);
  }));
  await page.screenshot({path:output+'/play.jpg'});await page.keyboard.press('Escape');await page.getByText('Tạm dừng',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Cài đặt'}).click();await page.locator('#sensitivity').fill('1.6');await page.locator('#accessible').check();
  await page.getByRole('button',{name:'Quay lại'}).click();await page.getByRole('button',{name:'Tiếp tục'}).click();
  assert.equal(await page.locator('#clock').isVisible(),true);await page.reload();await page.getByRole('button',{name:'Hướng dẫn điều khiển'}).click();
  assert.equal(await page.locator('#sensitivity').inputValue(),'1.6');assert.equal(await page.locator('#accessible').isChecked(),true);assert.deepEqual(errors,[]);
  const sample={width:1280,height:720,frames:60,avg_fps:measured,errors};writeFileSync(output+'/play.json',JSON.stringify(sample,null,2)+'\n');console.log(sample);
}finally{await game.close();}
