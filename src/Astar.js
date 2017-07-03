import Rx from "rxjs";
import { genIdx, genMatrix, minScore } from "./Utils";

export const heuristics = {
    manhattan: (x, y) => x + y,
    euclidean: (x, y) => Math.sqrt(x * x + y * y),
    euclideanSquared: (x, y) => x * x + y * y
};

const AStarSolver$ = (start, goal, matrix, heuristic) => {
    const heuristicCostEstimate = (startIdx) => {
        const dx = Math.abs(startIdx.x - goal.x);
        const dy = Math.abs(startIdx.y - goal.y);
        return heuristics[heuristic](dx, dy);
    };

    const distBetween = (current, neighbor) => matrix[neighbor.x][neighbor.y];

    const addToMap = (current, state) => (neighbor) => {
        const tentativeGScore = state.gScore[current.x][current.y] + distBetween(current, neighbor);

        if(state.openSet.has(neighbor) && tentativeGScore < state.gScore[neighbor.x][neighbor.y]){
            state.openSet.delete(neighbor);
            return;
        }

        if(state.closedSet.has(neighbor) && tentativeGScore < state.gScore[neighbor.x][neighbor.y]){
            state.closedSet.delete(neighbor);
            return;
        }

        if(!state.openSet.has(neighbor) &&
            !state.closedSet.has(neighbor) &&
            tentativeGScore < state.gScore[neighbor.x][neighbor.y]){
            state.openSet.add(neighbor);
            state.cameFrom[neighbor.x][neighbor.y] = current;
            state.gScore[neighbor.x][neighbor.y] = tentativeGScore;
            state.fScore[neighbor.x][neighbor.y] = tentativeGScore + heuristicCostEstimate(neighbor);
        }
    };

    const initialStateFatory = (start, goal, matrix) => {
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

    const solver = (solverState) => {
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

    const solve = (cameFromMatrix, end) => {
        const pathMatrix = genMatrix(cameFromMatrix.length, cameFromMatrix[0].length, 0);
        let location = end;
        while(location){
            pathMatrix[location.x][location.y] = 1;
            location = cameFromMatrix[location.x][location.y];
        }
        return pathMatrix;
    };
    const path$ = new Rx.Subject();

    /*if(matrix[goal.x][goal.y] === Infinity){
        path$.complete();
    }*/

    const state = initialStateFatory(start, goal, matrix);

    const step = () => {
        let ended;
        for(let i=0; i < 10000; i++){
            ended = solver(state);
            if(ended) break;
        }

        if(ended){
            const status = {
                matrix,
                gScore: state.gScore,
                cameFrom: state.cameFrom,
                renderMask: solve(state.cameFrom, goal),
                done: true
            };
            path$.next(status);
            path$.complete();
            return;
        }else{
            const status = {
                matrix,
                gScore: state.gScore,
                cameFrom: state.cameFrom,
                renderMask: matrix,
                done: false
            };

            path$.next(status);
        }
        requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    return path$;
};

export default AStarSolver$;
