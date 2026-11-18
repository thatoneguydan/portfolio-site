// Shortest-column placement adapted from React Bits Masonry.
// https://reactbits.dev/components/masonry — license in THIRD-PARTY-NOTICES.txt.
export function masonryColumns(width, columnWidth=300, gap=14){
  return width<600?1:Math.min(4,Math.max(2,Math.floor((width+gap)/(columnWidth+gap))));
}

export function masonryLayout(items,width,{columns=masonryColumns(width),gap=14}={}){
  const count=Math.max(1,Math.round(columns)),size=Math.max(1,(width-gap*(count-1))/count);
  const heights=new Array(count).fill(0),tiles=[];
  for(const item of items){
    if(item.kind==='shelf'){
      const anchor=item.source?tiles.find(tile=>tile.el?.id===item.source):null;
      const y=anchor?anchor.y+anchor.h+gap+(item.tail||0):Math.max(...heights),h=Math.max(0,item.height||0);
      tiles.push({...item,x:0,y,w:width,h});
      if(h>.5)for(let column=0;column<count;column++)heights[column]=Math.max(heights[column],y+h+gap);
      continue;
    }
    const span=Math.min(count,Math.max(1,Math.round(item.span||1)));
    let column=0,y=Infinity;
    for(let start=0;start<=count-span;start++){
      const top=Math.max(...heights.slice(start,start+span));
      if(top<y-.5){y=top;column=start;}
    }
    const w=size*span+gap*(span-1),h=w*Math.max(.72,Math.min(1.5,item.ratio||1));
    for(let k=column;k<column+span;k++)heights[k]=y+h+gap;
    tiles.push({...item,x:column*(size+gap),y,w,h});
  }
  return {tiles,height:Math.max(0,Math.max(...heights)-gap),columns:count};
}
