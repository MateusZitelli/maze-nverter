import React from 'react';
import { render } from 'react-dom';
import xs from 'xstream';
import 'babel-core/register';
import 'babel-polyfill';

import Grid from './components/Grid';

const range = (start, count) =>
  Array.apply(0, Array(count))
    .map((element, index) => index + start);

const genMatrix = (x, y, val) => range(0, x)
  .map(() => range(0, y)
    .map(() => val));

const genIdxMatrix = (sx, sy) => range(0, sx)
  .map(x => range(0, sy)
    .map(y => ({ x, y })));


const heuristicCostEstimate = (startIdx, goal) => {
  const dx = Math.abs(startIdx.x - goal.x);
  const dy = Math.abs(startIdx.y - goal.y);
  return Math.sqrt(dx * dx + dy * dy);
};

const aStar = (start, goal, matrix, listener) => {
  const minScore = (set, scores) => set.reduce((minObj, loc) => {
    const locScore = scores[loc.x][loc.y];
    if (locScore < minObj.min) {
      return Object.assign({}, minObj, { min: locScore, loc });
    }
    return minObj;
  }, {
    min: Infinity,
    loc: null,
  }).loc;

  /*
  const checkPath = (gScore, current) => (neighbor) => {
    const tentativeGScore = gScore[current.x][current.y] + distBetween(current, neighbor);
    return tentativeGScore < gScore[neighbor.x][neighbor.y];
  };
  */

  const x = matrix.length;
  const y = matrix[0].length;
  const distBetween = (current, neighbor) => matrix[neighbor.x][neighbor.y];

  const idxMatrix = genIdxMatrix(x, y);
  const startIdx = idxMatrix[start.x][start.y];

  const openSet = new Set([startIdx]);
  const closedSet = new Set([]);
  const cameFrom = genMatrix(x, y, null);

  const gScore = genMatrix(x, y, Infinity);
  gScore[start.x][start.y] = 0;

  const fScore = genMatrix(x, y, Infinity);
  fScore[start.x][start.y] = heuristicCostEstimate(startIdx, goal);

  const addToMap = current => (neighbor) => {
    const tentativeGScore = gScore[current.x][current.y] + distBetween(current, neighbor);

    if(openSet.has(neighbor) && tentativeGScore < gScore[neighbor.x][neighbor.y]){
      openSet.delete(neighbor);
      return;
    }

    if(closedSet.has(neighbor) && tentativeGScore < gScore[neighbor.x][neighbor.y]){
      closedSet.delete(neighbor);
      return;
    }

    if(!openSet.has(neighbor) && !closedSet.has(neighbor) && tentativeGScore < gScore[neighbor.x][neighbor.y]){
      openSet.add(neighbor);
      cameFrom[neighbor.x][neighbor.y] = current;
      gScore[neighbor.x][neighbor.y] = tentativeGScore;
      fScore[neighbor.x][neighbor.y] = tentativeGScore + heuristicCostEstimate(neighbor, goal);
    }
  };

  let current = minScore(Array.from(openSet), fScore);
  let status = {
    current,
    gScore,
    fScore,
    cameFrom,
    done: false
  }

  const interval2 = setInterval(() => {
    listener.next(status);
  }, 30);

  const interval = setInterval(() => {
    if (openSet.size === 0) {
      clearInterval(interval);
      return;
    }

    current = minScore(Array.from(openSet), fScore);
    current = idxMatrix[current.x][current.y];

    openSet.delete(current);
    closedSet.add(current);

    const addToCurrentMap = addToMap(current);
    // const checkCurrentPath = checkPath(gScore, current);

    if (current.x === goal.x && current.y === goal.y) {
      clearInterval(interval);
      status = {
        current,
        gScore,
        fScore,
        cameFrom,
        done: true
      };
      return;
    }

    status = {
      current,
      gScore,
      fScore,
      cameFrom,
      done: false
    };

    const neighborsOffset = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    const neighborsToCheck = neighborsOffset
      .map(offset => [current.x + offset[0], current.y + offset[1]])
      .filter(neighbor => neighbor[0] >= 0 && neighbor[0] < x &&
        neighbor[1] >= 0 && neighbor[1] < y)
      .map(neighbor => idxMatrix[neighbor[0]][neighbor[1]]);

    neighborsToCheck.forEach(addToCurrentMap);
  }, 0.1);
};

const createProducer = (start, goal, matrix) => ({
  start: (listener) => {
    aStar(start, goal, matrix, listener);
  },
  stop: () => {
  },
});

const matrix = genMatrix(10, 10, 1);

for(let i = 0; i < 9; i++){
  matrix[3][i] = Infinity;
}

xs.create(createProducer({ x: 0, y: 0 }, { x: 9, y: 0 }, matrix))
  .addListener({
    next: (status) => {
      render(<Grid score={status.gScore} cameFrom={status.cameFrom}/>, document.getElementById('root'));
    },
    error: err => console.error(err),
    complete: () => console.log('completed'),
  });

