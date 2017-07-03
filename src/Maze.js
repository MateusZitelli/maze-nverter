import { genMatrix } from './Utils';

export const makeMaze = (width, height, complexity=0.75, density=0.75) => {
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

    for(let i = 0; i < oddHeight; i++){
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
