import React from 'react';
import { render } from 'react-dom';
import Immutable from 'immutable';
import Rx from "rxjs";
import 'babel-core/register';
import 'babel-polyfill';
import AstartSolver$ from "./Astar";
import { makeMaze } from './Maze';

import Maze from './components/Maze';

const start = { x: 1, y: 1 };
const heuristic = 'manhattan';

const startSubject = new Rx.Subject();
const mouseEvent$ = new Rx.Subject();
const heuristicSubject = new Rx.Subject();
const createMazeSubject = new Rx.Subject();

const mazeRows = new Rx.Subject();
const mazeColumns = new Rx.Subject();

const mazeSize$ = Rx.Observable
    .combineLatest(mazeRows, mazeColumns)
    .startWith([20, 20]);

const newMazeSize$ = createMazeSubject
    .startWith(true)
    .withLatestFrom(mazeSize$)
    .map(([event, mazeSize]) => mazeSize);

const newMazeEnd$ = newMazeSize$
    .map(size => ({
        x: size[0] - 1,
        y: size[1] - 1
    }));

const map$ = newMazeSize$
    .map(size => makeMaze(size[0], size[1], 1.0, 1.0));

const goal$ = Rx.Observable.merge(mouseEvent$, newMazeEnd$);

const resetMaze = () => {
    createMazeSubject.next(true);
};

const setHeuristic = (heuristic) => {
    heuristicSubject.next(heuristic);
};

const container = {
    display: 'grid',
    gridTemplateColumns: "auto auto",
    gridTemplateRows: "auto auto",
};

const column = {
    display: 'grid'
};

const renderStatus = status => render(
    <div>
        <header>
            <h1>Maze Solver</h1>
            <h2>A* maze solver made with React.js and RxJs.</h2>
            <p>Move the pointer or touch around the maze to redefine the goal.</p>
            <a href="https://github.com/MateusZitelli/maze-nverter">GitHub</a>
        </header>
        <content style={container}>
            <Maze score={Immutable.fromJS(status.gScore)}
                  onEnter={(e, x, y) => mouseEvent$.next({x, y})}
                  renderMask={Immutable.fromJS(status.renderMask)}
                  matrix={Immutable.fromJS(status.matrix)}
                  cameFrom={Immutable.fromJS(status.cameFrom)}/>
            <div>
                <h3>A* properties</h3>
                <label style={{display: 'block'}}>Heuristic</label>
                <select onChange={e => setHeuristic(e.target.value)}>
                    <option value="manhattan">Manhattan</option>
                    <option value="euclidean">Euclidean</option>
                    <option value="euclideanSquared">Euclidean Squared</option>
                </select>
                <h3>Maze properties</h3>
                <input placeholder="Rows"
                       onChange={e => mazeRows.next(e.target.value)}/>
                X
                <input placeholder="Columns"
                       onChange={e => mazeColumns.next(e.target.value)}/>
                <br/>
                <small>Take care with sizes > 100x100</small>
                <br/>
                <button onClick={resetMaze}>Generate Maze</button>
            </div>
        </content>
    </div>,
    document.getElementById('root'))

Rx.Observable
    .combineLatest(
        startSubject.startWith(start),
        goal$,
        map$,
        heuristicSubject.startWith(heuristic))
    .debounce(() => Rx.Observable.timer(33))
    .switchMap(args => AstartSolver$.apply(null, args))
    .subscribe(renderStatus);

