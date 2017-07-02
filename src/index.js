import React from 'react';
import { render } from 'react-dom';
import 'babel-core/register';
import 'babel-polyfill';
import Immutable from 'immutable';
import Rx from "rxjs";

import Grid from './components/Grid';

const range = (start, count) =>
    Array.apply(0, new Array(count))
        .map((element, index) => index + start);

const genMatrix = (x, y, val) => range(0, x)
    .map(() => range(0, y).map(() => val));

const heuristicCostEstimate = (startIdx, goal) => {
    const dx = Math.abs(startIdx.x - goal.x);
    const dy = Math.abs(startIdx.y - goal.y);
    return (dx + dy);
};

const minScore = (set, scores) => set
    .reduce((minObj, loc) => {
        const locScore = scores[loc.x][loc.y];
        if (locScore < minObj.min) {
            return Object.assign({}, minObj, { min: locScore, loc });
        }
        return minObj;
    }, {
        min: Infinity,
        loc: null,
    }).loc;

const distBetween = (current, neighbor) => matrix[neighbor.x][neighbor.y];

const addToMap = (current, state) => (neighbor) => {
    const tentativeGScore = state.gScore[current.x][current.y]+ distBetween(current, neighbor);

    if(state.openSet.has(neighbor) && tentativeGScore < state.gScore[neighbor.x][neighbor.y]){
        state.openSet.delete(neighbor);
        return;
    }

    if(state.closedSet.has(neighbor) && tentativeGScore < state.gScore[neighbor.x][neighbor.y]){
        state.closedSet.delete(neighbor);
        return;
    }

    if(!state.openSet.has(neighbor) && !state.closedSet.has(neighbor) && tentativeGScore < state.gScore[neighbor.x][neighbor.y]){
        state.openSet.add(neighbor);
        state.cameFrom[neighbor.x][neighbor.y] = current;
        state.gScore[neighbor.x][neighbor.y] = tentativeGScore;
        state.fScore[neighbor.x][neighbor.y] = tentativeGScore + heuristicCostEstimate(neighbor, state.goal);
    }
};


const aStarInitialStateFatory = (start, goal, matrix) => {
    const startIdx = genIdx(start.x, start.y);
    const width = matrix.length;
    const height = matrix[0].length;
    const openSet = new Set([startIdx]);
    const closedSet = new Set([]);
    const gScore = genMatrix(width, height, Infinity);
    gScore[start.x][start.y] = 0;
    const fScore = genMatrix(width, height, Infinity);
    fScore[start.x][start.y] = heuristicCostEstimate(startIdx, goal);
    const cameFrom = genMatrix(width, height, null);

    return {
        openSet, closedSet, gScore, fScore, goal, cameFrom, width, height
    }
};


const aStarSolver = (solverState) => {
    if (solverState.openSet.size === 0) {
        return true;
    }

    const current = minScore(Array.from(solverState.openSet), solverState.fScore);
    const currentIdx = genIdx(current.x, current.y);

    solverState.openSet.delete(currentIdx);
    solverState.closedSet.add(currentIdx);

    const addToCurrentMap = addToMap(currentIdx, solverState);
    // const checkCurrentPath = checkPath(gScore, current);

    if (current.x === solverState.goal.x && current.y === solverState.goal.y) {
        return true;
    }

    const neighborsOffset = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    const neighborsToCheck = neighborsOffset
        .map(offset => [current.x + offset[0], current.y + offset[1]])
        .filter(neighbor => neighbor[0] >= 0 && neighbor[0] < solverState.width && neighbor[1] >= 0 && neighbor[1] < solverState.height)
        .map(neighbor => genIdx(neighbor[0],neighbor[1]));

    neighborsToCheck.forEach(addToCurrentMap);

    return false;
};

const genIdx = (() => {
    const memo = {};
    return (x, y) => {
        memo[x] = memo[x] || {};
        if (y in memo[x]) {
            return memo[x][y]
        }
        memo[x][y] = {x, y};
        return memo[x][y];
    };
})();


const makeMaze = (width, height, complexity=0.75, density=0.75) => {
    const oddWidth = Math.floor(width / 2) * 2 + 1;
    const oddHeight = Math.floor(height / 2) * 2 + 1;
    const adjustedComplexity = Math.floor(complexity * (5 * (oddWidth + oddHeight)));

    // Adjust density depending on the maze size
    const adjustedDensity = Math.floor(density *
        (Math.floor(oddWidth / 2) *
        Math.floor(oddHeight / 2)));

    const matrix = genMatrix(oddWidth, oddHeight, 1);

    // Fill borders
    for(let i = 0; i < oddWidth; i++){
        matrix[i][0] = Infinity;
        matrix[i][oddHeight - 1] = Infinity;
    }

    for(let i = 0; i < oddWidth; i++){
        matrix[0][i] = Infinity;
        matrix[oddWidth - 1][i] = Infinity;
    }

    for(let i = 0; i < adjustedDensity; i++){
        let x = Math.floor(Math.random() * Math.floor(oddWidth / 2 + 1)) * 2;
        let y = Math.floor(Math.random() * Math.floor(oddHeight / 2 + 1)) * 2;

        matrix[x][y] = Infinity;
        for(let j = 0; j < adjustedComplexity; j++){
            const neighbours = [];
            if(x > 0){
                neighbours.push([x - 2, y]);
            }
            if(x < oddWidth - 1){
                neighbours.push([x + 2, y]);
            }
            if(y > 0){
                neighbours.push([x, y - 2]);
            }
            if(y < oddHeight - 1){
                neighbours.push([x, y + 2]);
            }
            if(neighbours.length){
                const [_x, _y] = neighbours[Math.floor(Math.random() * neighbours.length)];
                if(matrix[_x][_y] === 1){
                    matrix[_x][_y] = Infinity;
                    matrix[_x + Math.floor((x - _x) / 2)]
                        [_y + Math.floor((y - _y) / 2)] = Infinity;
                    x = _x;
                    y = _y;
                }
            }
        }
    }
    return matrix;
};

const matrix = makeMaze(100, 100, 1.0, 1.0);

const endSubject = new Rx.Subject();

const end = { x: 49, y: 49 };

const solve = (cameFromMatrix, end) => {
   const pathMatrix = genMatrix(cameFromMatrix.length, cameFromMatrix[0].length, 0);
   let location = end;
   while(location){
       pathMatrix[location.x][location.y] = 1;
       location = cameFromMatrix[location.x][location.y];
   }
   return pathMatrix;
};

const search = end => {
    const mapSubject = new Rx.Subject();

    if(matrix[end.x][end.y] === Infinity){
        mapSubject.complete();
    }

    const state = aStarInitialStateFatory({ x: 1, y: 1 }, end, matrix);

    const step = () => {
        let ended;
        for(let i=0; i < 10000; i++){
            ended = aStarSolver(state);
            if(ended) break;
        }

        if(ended){
            const status = {
                matrix,
                gScore: state.gScore,
                cameFrom: state.cameFrom,
                renderMask: solve(state.cameFrom, end),
                done: true
            };
            mapSubject.next(status);
            mapSubject.complete();
            return;
        }else{
            const status = {
                matrix,
                gScore: state.gScore,
                cameFrom: state.cameFrom,
                renderMask: matrix,
                done: false
            };

            mapSubject.next(status);
        }
        requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    return mapSubject;
};


endSubject
    .debounce(() => Rx.Observable.timer(33))
    .startWith(end)
    .concatMap(search)
    .subscribe(status =>
        render(<Grid score={Immutable.fromJS(status.gScore)}
                     onEnter={(e, x, y) => endSubject.next({x, y})}
                     renderMask={Immutable.fromJS(status.renderMask)}
                     matrix={status.matrix}
                     cameFrom={Immutable.fromJS(status.cameFrom)}/>,
            document.getElementById('root')));

