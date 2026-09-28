import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Export a detached clone, so saving never interrupts the interactive scene.
export async function exportAnimatedModel(washer) {
  const root=washer.root.clone(true);
  root.name='ORBIT_HeatPump_WasherDryer_Concept';
  const tracks=[];
  root.traverse(object=>{object.visible=true;object.userData={};});
  washer.parts.forEach((part,index)=>{
    const node=root.children[index];node.position.copy(part.base);node.rotation.set(0,0,0);
    const exploded=part.base.clone().addScaledVector(part.offset,.82);
    tracks.push(new THREE.VectorKeyframeTrack(`${node.uuid}.position`,[0,1,6,8,13], [...part.base,...part.base,...exploded,...exploded,...part.base]));
  });
  root.traverse(node=>{if(node.morphTargetInfluences?.length){node.morphTargetInfluences[0]=0;tracks.push(new THREE.NumberKeyframeTrack(`${node.uuid}.morphTargetInfluences`,[0,1,6,8,13],[0,0,.82,.82,0]));}});
  root.updateMatrixWorld(true);
  const clip=new THREE.AnimationClip('Assembly — exploded anatomy',13,tracks);
  const exporter=new GLTFExporter();
  return await exporter.parseAsync(root,{binary:true,onlyVisible:true,animations:[clip],maxTextureSize:1024});
}
