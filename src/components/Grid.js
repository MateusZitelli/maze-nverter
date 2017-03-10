import React from 'react';

class Cell extends React.Component {
  shouldComponentUpdate(nextProps, nextState){
    return nextProps.color !== this.props.color;
  }

  render() {
    const boxStyle = color => ({
      display: 'inline-block',
      backgroundColor: color,
      width: '50px',
      height: '50px',
      lineHeight: '50px',
      textAlign: 'center',
      verticalAlign: 'middle',
      border: '1px solid black',
    });
    const cameFrom = this.props.cameFrom;
    let text;
    if(cameFrom !== null){
      const dx = cameFrom.x - this.props.x;
      const dy = cameFrom.y - this.props.y;

      if(dx == -1){
        text = "↑";
      }else if(dx == 1){
        text = "↓";
      }else if(dy == -1){
        text = "←";
      }else if(dy == 1){
        text = "→";
      }
    }else{
      text = '-';
    }

    return <div style={boxStyle(this.props.color)}>{text}</div>;
  }
}

class Line extends React.Component {
  shouldComponentUpdate(nextProps, nextState){
    for(let i = 0; i < nextProps.values.length; i++){
      if(nextProps.values[i] !== this.props.values[i])
        return true;
    }
    return false;
  }
  render() {
    const props = this.props;
    const genColor = intensity => `hsl(${intensity}, 100%, 50%)`;

    const lineStyle = {
      display: 'block',
      margin: 0,
      padding: 0,
      lineHeight: '0px',
    };

    const columns = props.values.map((val, i) =>
      <Cell
        key={i}
        x={this.props.x}
        y={i}
        cameFrom={this.props.cameFrom[i]}
        color={genColor(val * 255)}/>);

    return <div style={lineStyle}>{columns}</div>;
  }
}

const Grid = (props) => {
  const score = props.score;

  const max = Math.max
    .apply(null, score
      .map(line => Math.max.apply(null, line.filter(v => v !== Infinity))));

  const min = Math.min
    .apply(null, score
      .map(line => Math.min.apply(null, line)));
  const diff = max === min ? 1 : max - min;

  const relativeScore = score.map(line => line.map(val => (val - min) / diff));

  const lines = relativeScore
    .map((val, i) => <Line key={i} x={i} values={val} cameFrom={props.cameFrom[i]}/>);

  return <div style={{ display: 'block' }}>{lines}</div>;
};

export default Grid;
