import React from 'react';

class Cell extends React.Component {
    shouldComponentUpdate(nextProps, nextState){
        return nextProps.color !== this.props.color ||
            nextProps.cameFrom !== this.props.cameFrom ||
            nextProps.matrix !== this.props.matrix ||
            nextProps.rows !== this.props.rows ||
            nextProps.columns !== this.props.columns;
    }

    render() {
        const props = this.props;
        const genColor = intensity => `hsl(${intensity}, 100%, 50%)`;
        const boxStyle = color => ({ fill: color });
        let color;
        if(props.matrix === Infinity){
            color = '#000';
        }else if (props.cameFrom === null){
            color = '#fff';
        }else{
            color = genColor(props.color * 255);
        }
        const x = props.x / props.rows * 100;
        const y = props.y  / props.columns * 100;
        const sendEnterEvent = e => this.props.onEnter(e, this.props.x, this.props.y);
        return <rect width={`${100 / props.rows}%`}
                     height={`${100 / props.columns}%`}
                     onMouseEnter={sendEnterEvent}
                     x={`${x}%`}
                     y={`${y}%`}
                     style={boxStyle(color)}>
        </rect>;
    }
}

class Path extends React.Component {
    shouldComponentUpdate(nextProps, nextState){
        return this.props.cameFrom !== nextProps.cameFrom
            || this.props.renderMask !== nextProps.renderMask;
    }

    render() {
        const {cameFrom, x, y, rows, columns} = this.props;
        let dx, dy;
        if(cameFrom !== null){
            dx = (cameFrom.get('x') - x) / rows;
            dy = (cameFrom.get('y') - y) / columns;
        }

        const color = this.props.renderMask ? "rgba(180,0,0,1)": "black";
        const thickness = this.props.renderMask ? 4: 1;

        const x1 = ((x + 0.5) / rows) * 100;
        const y1 = ((y + 0.5)  / columns) * 100;
        const x2 = ((x + 0.5) / rows + dx) * 100;
        const y2 = ((y + 0.5)  / columns + dy) * 100;

        const line = <g>
            <line
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                style={{stroke: color, strokeWidth: thickness}} />
        </g>;
        return dx || dy ? line: null;
    }
}

class GridRow extends React.Component {
    shouldComponentUpdate(nextProps){
        return !nextProps.values.equals(this.props.values) ||
            !nextProps.cameFrom.equals(this.props.cameFrom) ||
            !nextProps.matrix.equals(this.props.matrix);
    }
    render() {
        const {x, rows, columns, values, cameFrom, matrix, onEnter} = this.props;
        const row = values.zip(cameFrom, matrix)
            .map(([intensity, cameFromValue, m], i) =>
                <Cell
                    rows={rows}
                    columns={columns}
                    key={i}
                    x={x}
                    y={i}
                    onEnter={onEnter}
                    cameFrom={cameFromValue}
                    matrix={m}
                    color={intensity}/>);

        return <g>{row}</g>;
    }
}

class PathRow extends React.Component {
    shouldComponentUpdate(nextProps){
        return !nextProps.cameFrom.equals(this.props.cameFrom) ||
            !nextProps.renderMask.equals(this.props.renderMask);
    }
    render() {
        const {x, cameFrom, renderMask, rows, columns} = this.props;
        const row = cameFrom
            .zip(renderMask)
            .map(([val, renderMaskValue], i) =>
                <Path
                    rows={rows}
                    columns={columns}
                    key={i}
                    x={x}
                    y={i}
                    renderMask={renderMaskValue}
                    cameFrom={val} />);

        return <g>{row}</g>;
    }
}

const Maze = (props) => {
    const {
        score,
        cameFrom,
        matrix,
        renderMask,
        onEnter
    } = props;

    const rows = props.matrix.count();
    const columns = props.matrix.get(0).count();

    const max = score.map(line => line
        .filter(v => v !== Infinity).max())
        .filter(v => v).max();
    const min = score.map(line => line.min()).min();
    const diff = !max || max === min ? 1 : max - min;
    const relativeScore = score.map(line => line.map(val => (val - min) / diff));

    const gridRows = relativeScore
        .zip(cameFrom, matrix)
        .map(([intensity, cameFromRow, m], i) => <GridRow
            key={i}
            x={i}
            rows={rows}
            columns={columns}
            matrix={m}
            values={intensity}
            onEnter={onEnter}
            cameFrom={cameFromRow}
        />);

    const pathRows = props.cameFrom
        .zip(renderMask)
        .map(([cameFromRow, renderMaskRow], i) => <PathRow
            key={i}
            x={i}
            rows={rows}
            columns={columns}
            renderMask={renderMaskRow}
            cameFrom={cameFromRow}/>);

    return <svg width="100%" height="100%" style={{width:"50vw", height:"50vw", maxHeight: '600px'}}>
        {gridRows}
        {pathRows}
    </svg>;
};

export default Maze;
