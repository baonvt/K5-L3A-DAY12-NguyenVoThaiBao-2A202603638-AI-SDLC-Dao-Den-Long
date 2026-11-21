const localKey='dao-offline-scores';
function offline(){return JSON.parse(localStorage.getItem(localKey)??'[]');}
export async function leaderboard(entry){
  const options=entry?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}:{};
  let res;
  try{res=await fetch('./api/leaderboard',options);}catch{}
  if(res?.ok && res.headers.get('content-type')?.includes('application/json'))return (await res.json()).entries;
  if(res && ![200,404,405,501].includes(res.status))throw Error('Không lưu được điểm. Hãy thử lại.');
  const entries=offline();if(entry){
    entries.push({...entry,achieved_at:new Date().toISOString()});entries.sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at));
    entries.splice(10);localStorage.setItem(localKey,JSON.stringify(entries));
  }
  return entries;
}
export function renderRank(entries){
  const table=document.createElement('table');table.className='ranking';
  const head=table.createTHead().insertRow();
  for(const name of ['Hạng','Tên','Điểm','Đêm thắng']){const th=document.createElement('th');th.textContent=name;head.append(th);}
  const body=table.createTBody();entries.forEach((entry,i)=>{const row=body.insertRow();for(const v of [i+1,entry.name,entry.score,entry.nights_won])row.insertCell().textContent=v;});
  return table;
}
