export const range = (start, count) =>
    Array.apply(0, new Array(count))
        .map((element, index) => index + start);

export const genMatrix = (x, y, val) => range(0, x)
    .map(() => range(0, y).map(() => val));

export const minScore = (set, scores) => set
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

export const genIdx = (() => {
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
