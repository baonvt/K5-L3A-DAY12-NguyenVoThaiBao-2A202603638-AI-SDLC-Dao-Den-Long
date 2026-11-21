import * as T from '../node_modules/three/build/three.module.js';
import {makeShade} from './art.js';
// Reuse exactly the gameplay meshes and colors in the benchmark.
export class ShadeBatch{
  constructor(scene){
    this.scene=scene;this.root=new T.Object3D();this.matrix=new T.Matrix4();this.capacity=0;
    this.parts=makeShade().children;this.groups=[];this.color=new T.Color();
    for(const part of this.parts)part.updateMatrix();
  }
  render(w,time,accessible){
    const count=w.shades.length;
    if(count>this.capacity){
      for(const mesh of this.groups){this.scene.remove(mesh);mesh.material.dispose();mesh.dispose();}
      this.capacity=Math.max(12,count);this.groups=this.parts.map(part=>{
        const mat=part.material.clone();mat.color.set(0xffffff);
        const mesh=new T.InstancedMesh(part.geometry,mat,this.capacity);mesh.frustumCulled=false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(mesh);return mesh;
      });
    }
    for(let j=0;j<this.groups.length;j++){
      const mesh=this.groups[j],part=this.parts[j];mesh.count=count;
      for(let i=0;i<count;i++){
        const s=w.shades[i],p=w.player.pos;
        this.root.position.set(s.pos[0],s.pos[1]+.10*Math.sin(time*3+i),s.pos[2]);
        this.root.rotation.set(0,Math.atan2(p[0]-s.pos[0],p[2]-s.pos[2]),s.state==='stunned'?.61:0);
        this.root.updateMatrix();mesh.setMatrixAt(i,this.matrix.multiplyMatrices(this.root.matrix,part.matrix));
        const accent=j===0||j>=this.parts.length-2;
        this.color.copy(part.material.color);
        if(accent)this.color.set(accessible?'#00b3ff':'#7a3cff');
        if(j===1 && s.state==='stunned')this.color.set('#3a3450');
        mesh.setColorAt(i,this.color);
      }
      mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    }
  }
}
