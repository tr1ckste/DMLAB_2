'use strict';

const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');

const CENTER_X = 275;
const CENTER_Y = 275;
const RADIUS = 200;
const N = 10;
const R = 10;
const PI = Math.PI;
const ARROW_SIZE = 12;

let degrees = 360 / N;
let peaks = [];
let FOCUS = false;

const MATRIX = [
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [ 1, 0, 0, 0, 0, 0, 0, 1, 0, 0 ],
  [ 1, 0, 1, 0, 0, 0, 0, 0, 0, 0 ],
  [ 1, 0, 0, 1, 1, 0, 0, 1, 0, 0 ],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 0 ],
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  [ 0, 1, 0, 1, 0, 0, 0, 0, 0, 0 ],
  [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 ],
  [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 0 ]
];

const square = (num) => ( Math.pow( num, 2 ) );

const circle = (x, y) => {
  ctx.beginPath();
  ctx.arc(x, y, R, 0, 2 * PI);
  ctx.closePath();
  ctx.stroke();
}

const peak = (x, y, num) => {
  circle(x, y);
  ctx.beginPath();
  ctx.font = '13px serif';
  if (num < 10) {
    ctx.fillText(`${num}`, x - 4.5, y + 5);
  } else {
    ctx.fillText(`${num}`, x - 8.5, y + 5);
  }
}

const definePeaks = () => {
  peaks = [];
  let degree = 0;
  let name = 1;
  for (let i = 0; i < N; i++) {
    let x = CENTER_X + Math.sin((degree * PI) / 180) * RADIUS;
    let y = CENTER_Y - Math.cos((degree * PI) / 180) * RADIUS;
    peaks.push({
      name,
      x,
      y,
      connectedTo: [],
      connectedBy: [],
      rad: degree * PI / 180,
      isolated: false,
      hanging: false,
    })
    peak( x, y, name );
    degree += degrees;
    name++;
  }
}

const connectPeaks = () => {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (MATRIX[i][j] === 1) {
        peaks[i].connectedTo.push(j);
        peaks[j].connectedBy.push(i);
      }
    }
  }
}

const drawConnection = () => {
  let connected = [];
  for (let i = 0; i < N; i++) {
    for (let index of peaks[i].connectedTo) {
      if (index === i) {
        drTail(i);
      } else {
        let sX = peaks[i].x;
        let sY = peaks[i].y;
        let fX = peaks[index].x;
        let fY = peaks[index].y;
        let [subX, subY] = findSubs( sX, sY, fX, fY );
        [sX, sY, fX, fY] = changeCoords( sX, sY, fX, fY, subX, subY );
        if (checkPath(connected, i, index) && FOCUS) {
          let halfX = sX + (fX - sX) / 2 + 30;
          let halfY = sY + (fY - sY) / 2 + 30; 
          drLine(sX, sY, halfX, halfY, 0);
          drLine(halfX, halfY, fX, fY, FOCUS);
          console.log(FOCUS && checkPath(connected, i, index));
        } else {
          drLine(sX, sY, fX, fY, FOCUS);
        }
        connected.push([i, index]);
      }
    }
  }
}

const checkPath = (con, i, index) => {
  for (let ind = 0; ind < con.length; ind++) {
    console.log(con[ind]);
    if ( (con[ind][0] === i && con[ind][1] === index) ||
         (con[ind][0] === index && con[ind][1] === i)) {
      return true;
    }
  }
  return false;
}

const drTail = i => {
  const rad = peaks[i].rad;
  let xT = CENTER_X + Math.sin(rad) * ( RADIUS + 2 * R );
  let yT = CENTER_Y - Math.cos(rad) * ( RADIUS + 2 * R );
  circle(xT, yT);
}

const findSubs = ( startX, startY, finishX, finishY ) => {
  let x = Math.abs(finishX - startX);
  let y = Math.abs(finishY - startY);
  let subX;
  let subY;
  let proportion;
  if ( x === 0 || y === 0 ) {
    subX = 10;
    subY = 10;
  }
  else {
    proportion = Math.floor((x / y) * 100) / 100;
    subY = R * Math.sqrt( 1 / ( 1 + square(proportion) ) );
    subX = subY * proportion;
  }
  return [subX, subY];
}

const changeCoords = ( startX, startY, finishX, finishY, subX, subY ) => {
  if ( startX > finishX ) {
    startX -= subX;
    finishX += subX;
  } else if ( startX < finishX ) {
    startX += subX;
    finishX -= subX;
  }
  if ( startY > finishY ) {
    startY -= subY;
    finishY += subY;
  } else if ( startY < finishY ) {
    startY += subY;
    finishY -= subY;
  }
  return [startX, startY, finishX, finishY];
}

const drLine = ( startX, startY, finishX, finishY, foc ) => {
  ctx.beginPath();
  ctx.moveTo( startX, startY );
  ctx.lineTo( finishX, finishY );
  ctx.stroke();
  ctx.closePath();
  if (foc) {
    const [ arrLx, arrLy, arrRx, arrRy ] = findArrow( startX, startY, finishX, finishY );
    ctx.beginPath();
    ctx.lineTo( arrLx, arrLy );
    ctx.lineTo( arrRx, arrRy );
    ctx.lineTo( finishX, finishY );
    ctx.fill();
    ctx.closePath();
  } else {
    ctx.closePath();
    ctx.stroke();  
  }
}

const findArrow = ( startX, startY, finishX, finishY ) => {
  const X = finishX - startX;
  const Y = finishY - startY;
  let arrLx, arrLy, arrRx, arrRy; 
  if (X === 0) {
    if ( finishY > startY ) {
      arrLy = finishY - ARROW_SIZE;
      arrRy = arrLy;
      arrLx = finishX - ARROW_SIZE / 2.7;
      arrRx = finishX + ARROW_SIZE / 2.7;
    } else {
      arrLy = finishY + ARROW_SIZE;
      arrRy = arrLy;
      arrLx = finishX + ARROW_SIZE / 2.7;
      arrRx = finishX - ARROW_SIZE / 2.7;
    }
    return [ arrLx, arrLy, arrRx, arrRy ];
  }
  const L = Math.sqrt( square(X) + square(Y) );
  const x = L - ARROW_SIZE;
  const lambda = x / ARROW_SIZE;
  const xH = ( startX + lambda * finishX ) / ( 1 + lambda );
  const yH = ( startY + lambda * finishY ) / ( 1 + lambda );
  const A = square(Y) / square(X) + 1;
  const B = -( 2 * Y * xH / X ) - 
             ( 2 * square(Y) * yH / square(X) ) + 
             ( 2 * Y * xH / X ) - 2 * yH;
  const C = 2 * square(xH) + 
            square(Y * yH / X) +
            2 * Y * xH * yH / X -
            2 * square(xH) -
            2 * Y * yH * xH / X + 
            square(yH) - square( ARROW_SIZE / 2.7 );
  [ arrLy, arrRy ] = quadraticEquation( A, B, C );
  arrLx = ( X * xH + Y * yH - Y * arrLy ) / X;
  arrRx = ( X * xH + Y * yH - Y * arrRy ) / X;
  return [ arrLx, arrLy, arrRx, arrRy ];
}

const quadraticEquation = (A, B, C) => {
  const D = square(B) - 4 * A * C;
  let x1 = ( -B - Math.sqrt(D) ) / ( 2 * A );
  let x2 = ( -B + Math.sqrt(D) ) / ( 2 * A );
  return [x1, x2];
}


const draw = () => {
  definePeaks();
  connectPeaks();
  drawConnection();
}

draw();

const defineFocus = () => {
  if (FOCUS == 0) {
    let state = 'non-directional';
    document.getElementById("state").innerHTML = state;
  } else {
    let state = 'directional';
    document.getElementById("state").innerHTML = state;
  }
}
defineFocus();

document.getElementById('toggle').onclick=() => {
  if (FOCUS == 0) FOCUS = 1;
  else FOCUS = 0;
  defineFocus();
  ctx.clearRect(0, 0, 550, 550);
  draw();
}

const nonDirectedDegree = () => {
  for (let i in peaks) {
    let array = peaks[i].connectedTo.concat(peaks[i].connectedBy);
    let set = new Set(array);
    let num = +i + 1;
    let key = num + "Degree";
    document.getElementById(key).innerHTML = set.size;
    if (set.size === 0) peaks[i].isolated = true;
    if (set.size === 1) peaks[i].hanging = true;
  }
}

nonDirectedDegree();

const halfDegrees = () => {
  for (let i in peaks) {
    let num = +i + 1;
    let keyIn = num + "DegreeIn";
    let keyOut = num + "DegreeOut";
    document.getElementById(keyIn).innerHTML = peaks[i].connectedBy.length;
    document.getElementById(keyOut).innerHTML = peaks[i].connectedTo.length;
  }
}

const displayChar = () => {
  let hanging = 0;
  let isolated = 0;
  peaks.forEach(el => {
    if (el.hanging) hanging++;
    if (el.isolated) isolated++;
  })
  document.getElementById("isolated").innerHTML = isolated;
  document.getElementById("hanging").innerHTML = hanging;
}

displayChar();
halfDegrees();
