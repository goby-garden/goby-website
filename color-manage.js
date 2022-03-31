import * as d3 from 'd3';

// let colors=['#8dd3c7','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#bc80bd','#ccebc5','#FF58EC'];
let colors=['#bc80bd','#ff9587','#FF89F2','#fdb462','#bebada','#80b1d3','#8dd3c7','#b3de69','#fccde5','#88AD8A'];

// '#ffffb3',
// #88AD8A


let colorPairs=[];

function desaturate(color, k = 1) {
  const {l, c, h} = d3.lch(color);
  return d3.lch(l, c - 10 * k, h).brighter(0.8).formatHex();
}

function saturate(color, k = 1) {
  const {l, c, h} = d3.lch(color);
  return d3.lch(l, c + 10 * k, h).formatHex();
}

for(let color of colors){
  colorPairs.push({
    regular:saturate(color),
    light:desaturate(color)
  })
}

console.log(colorPairs);
