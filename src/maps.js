export const NAMES=['','Đảo Bến','Cầu Tre','Tháp Chuông'];
export const lamps=[[],[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]],
  [[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]],
  [[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]]];
export const pads=[[],[],[[20,0,18],[50,0,-18]],[[0,3,13]]];
export const charms=[[],[],[[35,0,0]],[[30,0,25],[-30,0,25]]];
export const islands=[[],[[0,40]],[[0,28],[70,28]],[[0,45]]];
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function ring(n,r,start=0,step=360/n,x=0,y=0){
  return Array.from({length:n},(_,i)=>{const a=(start+i*step)*Math.PI/180;return [x+r*Math.cos(a),y,r*Math.sin(a)];});
}
export const moteSites=[[],[...ring(8,12),...ring(16,33)],[0,70].flatMap(x=>[...ring(4,10,0,90,x),...ring(8,22,0,45,x)]),
  [...ring(18,34),...ring(8,18,20,20,0,3),...ring(4,5,45,90,0,6)]];
export const fogSites=[[],ring(12,37,15),[0,70].flatMap(x=>ring(8,26,22.5,45,x)),ring(16,43)];
export function floorAt(n,x,z){
  if(n===2 && x>=26 && x<=44 && Math.abs(z)<=2)return 0;
  if(!islands[n].some(([cx,r])=>Math.hypot(x-cx,z)<=r))return -Infinity;
  if(n!==3)return 0;
  const r=Math.hypot(x,z);
  if(r<=8)return 6;
  if(z>0 && r>=12 && r<=24)return 3;
  for(const sign of [-1,1]){
    const along=x*sign*Math.sqrt(3)/2+z/2, side=z*Math.sqrt(3)/2-x*sign/2;
    if(along>=23.95 && along<=30 && Math.abs(side)<=1.5)return (30-along)/2;
  }
  return 0;
}
