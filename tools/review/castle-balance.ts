import { Battle, deltaAngle, distance } from '../../src/next/castle/Battle';
import * as C from '../../src/next/castle/Campaign';
import { wallSpec } from '../../src/next/castle/Catalog';

const results=[];
for(const policy of ['idle','patrol','target'] as const){
  let state=C.createCampaign();
  C.build(state,'ballista','east-court',1);C.build(state,'ballista','west-watch',1);
  C.upgradeWalls(state);C.buyOffer(state,0);C.equipKnight(state,'aldren',state.inventory[0].id);
  for(let wave=0;wave<3;wave++){
    const battle=new Battle(state);battle.start();
    for(let step=0;step<60*360&&battle.phase==='battle';step++){
      const enemies=battle.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,battle.king)-distance(b,battle.king));
      const boss=battle.enemies.find(e=>e.role==='dragon'&&e.hp>0);
      let heading=enemies[0]?Math.atan2(enemies[0].x,enemies[0].z):battle.angle;
      if(boss?.action==='breath'&&boss.actionTime<3.4)heading=battle.angle+1.2;
      battle.tick(1/60,{rotate:policy==='patrol'?.7:0,heading:policy==='target'?heading:undefined,charge:false,decree:policy!=='idle'&&battle.power>=100&&enemies.some(e=>distance(e,battle.king)<10)});
    }
    results.push({policy,wave:wave+1,phase:battle.phase,time:+battle.time.toFixed(1),hp:battle.king.hp,knights:battle.knights.map(k=>({name:k.name,hp:k.hp,x:+k.x.toFixed(1),z:+k.z.toFixed(1)})),walls:battle.state.walls,kills:battle.kills,spawned:battle.spawned,remaining:battle.enemies.filter(e=>e.hp>0).map(e=>({role:e.role,hp:e.hp,x:+e.x.toFixed(1),z:+e.z.toFixed(1)})),stats:battle.stats});
    if(battle.phase!=='won')break;
    state=battle.state;
    C.repairWalls(state);for(const k of state.knights)C.treat(state,k.id);
    if(state.wallTier<3)C.upgradeWalls(state);
    for(const b of state.buildings){C.repairBuilding(state,b.id);C.upgradeBuilding(state,b.id);}
    if(state.encounter===2)C.chooseRelic(state,'storm-oath');
  }
}
console.log(JSON.stringify(results,null,2));
