import React from 'react';

const CELL_SIZE = 4;

class Cell extends React.Component {
    shouldComponentUpdate(nextProps, nextState){
        return nextProps.color !== this.props.color ||
            nextProps.cameFrom !== this.props.cameFrom;
    }

    render() {
        const genColor = intensity => `hsl(${intensity}, 100%, 50%)`;
        const boxStyle = color => ({ fill: color });
        let color;
        if(this.props.matrix === Infinity){
            color = '#000';
        }else if (this.props.cameFrom === null){
            color = '#fff';
        }else{
            color = genColor(this.props.color * 255);
        }
        const x = this.props.x * CELL_SIZE;
        const y = this.props.y * CELL_SIZE;
        const sendEnterEvent = e => this.props.onEnter(e, this.props.x, this.props.y);
        return <rect width={CELL_SIZE}
                     height={CELL_SIZE}
                     onMouseEnter={sendEnterEvent}
                     x={x}
                     y={y}
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
        const cameFrom = this.props.cameFrom;
        let dx, dy;

        if(cameFrom !== null){
            dx = (cameFrom.get('x') - this.props.x) * CELL_SIZE;
            dy = (cameFrom.get('y') - this.props.y) * CELL_SIZE;
        }

        const color = this.props.renderMask ? "rgba(180,0,0,1)": "black";
        const width = this.props.renderMask ? 4: 1;
        const x = this.props.x * CELL_SIZE;
        const y = this.props.y * CELL_SIZE;
        const line = <g>
            <line
                x1={x + CELL_SIZE / 2.0}
                y1={y + CELL_SIZE / 2.0}
                x2={x + dx + CELL_SIZE / 2.0}
                y2={y + dy + CELL_SIZE / 2.0}
                style={{stroke: color, strokeWidth: width}} />
        </g>;
        return dx || dy ? line: null;
    }
}

class Line extends React.Component {
    shouldComponentUpdate(nextProps, nextState){
        return !nextProps.values.equals(this.props.values) ||
            !nextProps.cameFrom.equals(this.props.cameFrom);
    }
    render() {
        const props = this.props;
        const columns = props.values.zip(props.cameFrom, props.matrix)
            .map(([intensity, cameFrom, m], i) =>
            <Cell
                key={i}
                x={props.x}
                y={i}
                onEnter={props.onEnter}
                cameFrom={cameFrom}
                matrix={m}
                color={intensity}/>);

        return <g>{columns}</g>;
    }
}

class PathLine extends React.Component {
    shouldComponentUpdate(nextProps, nextState){
        return !nextProps.cameFrom.equals(this.props.cameFrom) ||
            !nextProps.renderMask.equals(this.props.renderMask);
    }
    render() {
        const props = this.props;
        const columns = props.cameFrom
            .zip(props.renderMask)
            .map(([val, renderMask], i) =>
                <Path
                    key={i}
                    x={props.x}
                    y={i}
                    renderMask={renderMask}
                    cameFrom={val} />);

        return <g>{columns}</g>;
    }
}

const Grid = (props) => {
    const score = props.score;

    const max = score.map(line => line
        .filter(v => v !== Infinity).max())
        .filter(v => v).max();
    const min = score.map(line => line.min()).min();

    const diff = !max || max === min ? 1 : max - min;

    const relativeScore = score.map(line => line.map(val => (val - min) / diff));

    const squareLines = relativeScore
        .zip(props.cameFrom, props.matrix)
        .map(([intensity, cameFrom, m], i) => <Line
            key={i}
            matrix={m}
            values={intensity}
            onEnter={props.onEnter}
            cameFrom={cameFrom}
            x={i} />);

    const pathLines = props.cameFrom
        .zip(props.renderMask)
        .map(([cameFrom, renderMask], i) => <PathLine
            key={i}
            x={i}
            renderMask={renderMask}
            cameFrom={cameFrom}/>);

    return <svg style={{ display: 'block', width: "100%", height: "1200px"}}>
        {squareLines}
        {pathLines}
    </svg>;
};

export default Grid;
