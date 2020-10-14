"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import Strings from 'src/client/strings.js';
import MCTS from './jumping-cubes-mcts.js';

import { shake } from 'utils';

class Matrix {

  constructor(size) {
    this.size = size;
    this.inner = size.times(() => []);
  }

  get(i, j) {
    return this.inner[i][j];
  }

  set(i, j, value) {
    return this.inner[i][j] = value;
  }

  static init(size, fn) {
    const result = new Matrix(size);
    result.forEach((_, i, j) => {
      result.set(i, j, fn(i, j));
    });
    return result;
  }

  forEach(fn) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        fn(this.get(i, j), i, j, this);
      }
    }
  }

  map(fn) {
    const result = new Matrix(this.size);
    this.forEach((item, i, j) => {
      result.set(i, j, fn(item, i, j, this));
    });
    return result;
  }

  indexOf(item) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.get(i, j) === item) {
          return { i, j };
        }
      }
    }
  }
  getNeighboursOf(i, j) {
    return [{ i: i - 1, j }, { i, j: j - 1 }, { i: i + 1, j }, { i, j: j + 1 }].filter(({ i, j }) => i >= 0 && i < this.size && j >= 0 && j < this.size).map(({ i, j }) => this.get(i, j));
  }

  sumBy(accessor) {
    const iter = iteratee(accessor);

    let sum = 0;
    this.forEach(item => sum += iter(item));
    return sum;
  }

  count(predicate) {
    const iter = iteratee(predicate);

    let counter = 0;
    this.forEach(item => {
      if (iter(item)) {
        counter++;
      }
    });
    return counter;
  }

  toJSON() {
    const json = [];
    this.forEach((item, i, j) => {
      json[i] = json[i] || [];
      json[i][j] = item.toJSON();
    });
    return json;
  }

  static fromJSON(json, builder) {
    if (!Array.isArray(json)) {
      throw new Error('json for Matrix is no Array');
    }

    const iter = iteratee(builder);
    return this.init(json.length, (i, j) => iter(json[i][j]));
  }
}

function iteratee(value) {
  if (typeof value == 'function') {
    return value;
  }

  if (value == null) {
    return Function.identity;
  }

  if (typeof value == 'string') {
    return function (object) {
      return object == null ? undefined : object[value];
    };
  }

  return () => {};
}

class Cube {

  constructor(jc, { value, color }) {
    this.jc = jc;

    this.value = value;
    this.color = color;

    this.initElement();
  }

  initElement() {
    this.button = <button class="cube" click={evt => this.onClick(evt)}>~</button>;
    this.shaker = <div class="shaker">{this.button}</div>;
    this.bouncer = <div class="bouncer">{this.shaker}</div>;
    this.exploder = <div class="exploder">{this.bouncer}</div>;
    this.container = <div class="cube-container" mouseleave={evt => {
      this.button.style.transform = 'rotateX(0deg) rotateY(0deg)';
      this.button.style.filter = 'brightness(1)';
    }} mousemove={evt => {
      const width = this.button.clientWidth;
      const height = this.button.clientHeight;
      const mouseX = evt.offsetX;
      const mouseY = evt.offsetY;
      const rotateY = mouseX.remap([0, width], [-35, 35], true);
      const rotateX = mouseY.remap([0, height], [35, -35], true);
      const brightness = mouseY.remap([0, height], [1.5, 0.5], true) * mouseX.remap([0, width], [1.25, 0.75], true);

      this.button.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      this.button.style.filter = `brightness(${brightness})`;
    }}>{this.exploder}</div>;
  }

  async onClick(evt) {
    if (!this.jc.handleClickOn(this)) {
      shake(this.shaker);
    }
  }

  get neighbours() {
    if (this._neighbours) {
      return this._neighbours;
    }

    const cubes = this.jc.cubes;

    const index = cubes.indexOf(this);
    if (!index) {
      return [];
    }

    return this._neighbours = cubes.getNeighboursOf(index.i, index.j);
  }

  toJSON() {
    return {
      color: this.color,
      value: this.value
    };
  }
}

const EFFECT_DURATION = 400;

class Animation {
  constructor(jc) {
    this.jc = jc;
    this.gameNumber = jc.gameNumber;
  }
}

class Increment extends Animation {
  constructor(cube, color, jc) {
    super(jc);
    this.cube = cube;
    this.color = color;
  }

  async run() {
    const duration = this.jc.duration(EFFECT_DURATION);

    this.cube.bouncer.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-30px)' }, { transform: 'translateY(0px)' }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.bouncer.animate([{ transform: 'scale(1, 1.3)', offset: 0.35 }, { transform: 'scale(1.1, 0.9)', offset: 0.5 }, { transform: 'scale(1, 1.3)', offset: 0.65 }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.button.animate([{ backgroundColor: 'white' }, { backgroundColor: COLOR_MAP.get(this.color) }], {
      duration,
      easing: 'ease-in-out',
      fill: 'both'
    }, 'accumulate');

    await lively.sleep(duration / 2);
    if (this.gameNumber < this.jc.gameNumber) {
      return;
    }
    this.cube.color = this.color;
    this.cube.value++;
    return lively.sleep(duration / 2);
  }
}

class Explode extends Animation {
  constructor(cube, jc) {
    super(jc);
    this.cube = cube;
  }

  async run() {
    const duration = this.jc.duration(EFFECT_DURATION);
    const jc = this.jc;

    const neighbours = this.cube.neighbours;
    if (this.cube.value <= neighbours.length) {
      return;
    }

    this.cube.exploder.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-20px)' }, { transform: 'translateY(0px)' }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.exploder.animate([{ transform: 'scale(1, 1.3)', offset: 0.35 }, { transform: 'scale(1.1, 0.9)', offset: 0.5 }, { transform: 'scale(1, 1.3)', offset: 0.65 }], {
      duration,
      easing: 'ease-in-out',
      composite: 'accumulate'
    });

    this.cube.button.animate([{ backgroundColor: 'black' }, { backgroundColor: COLOR_MAP.get(jc.player.color) }], {
      duration,
      easing: 'ease-in-out',
      fill: 'both'
    }, 'accumulate');

    await lively.sleep(duration / 2);
    if (this.cube.value <= neighbours.length) {
      return;
    }
    if (this.gameNumber < this.jc.gameNumber) {
      return;
    }
    this.cube.color = jc.player.color;
    this.cube.value -= neighbours.length;
    neighbours.forEach(neighbour => {
      jc.addAnimation(new Increment(neighbour, this.cube.color, jc));
    });

    return lively.sleep(duration / 2);
  }
}

const COLOR_MAP = new Map([['red', 'rgba(255, 126, 126, 1.0)'], ['green', 'rgba(126, 255, 126, 1.0)'], ['gray', 'rgba(176, 176, 176, 1.0)']]);

class AnimationQueue {
  constructor(jc) {
    this.jc = jc;
    this.gameNumber = jc.gameNumber;
    this.inner = [];
  }

  add(animation) {
    this.inner.push(animation);
    this.resolveAnim && this.resolveAnim();
  }

  async process() {
    const TASK_DURATION = this.jc.duration(100);

    let lastAnim;
    while (true) {
      while (this.inner.length > 0) {
        // that.innerHTML = this.inner.length;
        const next = this.inner.shift();
        lastAnim = next.run();
        await lively.sleep(TASK_DURATION);
      }

      await Promise.race([lastAnim, new Promise(resolve => this.resolveAnim = resolve)]);

      if (this.inner.length === 0) {
        return;
      }
    }
  }

  clear() {
    this.inner.length = 0;
  }
}

class Player {
  constructor(color, ai) {
    this.color = color;
    this.ai = ai;
  }

  startTurn(jc) {
    if (this.ai) {
      jc.classList.add('noClickAllowed');
      this.gameNumber = jc.gameNumber;
      this.aiTurn(jc);
    } else {
      jc.classList.remove('noClickAllowed');
    }
  }

  async aiTurn(jc) {
    function getInitialState(jc) {
      const cubes = jc.cubes;
      const color = jc.player.color;

      const field = cubes.toJSON();

      field.forEach(line => line.forEach(cube => cube.numNeighbours = 4));
      field.forEach(line => {
        line.first.numNeighbours--;
        line.last.numNeighbours--;
      });
      field.first.forEach(cube => cube.numNeighbours--);
      field.last.forEach(cube => cube.numNeighbours--);

      return { field, color };
    }

    const mcts = new MCTS(getInitialState(jc));
    const move = await mcts.run(200);

    if (this.gameNumber < jc.gameNumber) {
      return;
    }

    jc.processQueue(jc.cubes.get(move.i, move.j));
  }

  static fromJSON(json) {
    return new Player(json.color, json.ai);
  }
  toJSON() {
    return {
      color: this.color,
      ai: this.ai
    };
  }
}

export default class JumpingCubes extends Morph {

  get field() {
    return this.get('#field');
  }

  set energy(value) {
    return this.get('#energy').innerHTML = value;
  }

  defaultStart() {
    const { startingValue, fieldSize } = this.getConfig();
    return Matrix.init(fieldSize, () => ({
      value: startingValue,
      color: 'gray'
    }));
  }

  async initialize() {
    this.windowTitle = "Jumping Cubes";

    this.init();

    const state = this.getJSONAttribute('state');
    this.reset(state);

    this.get('#gameEnd-container').addEventListener('click', ::this.restart);
  }

  get fieldSize() {
    return this.cubes.size;
  }
  init() {
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);
    this.gameNumber = 0;
    this.aexprs = new Set();
  }

  reset(state) {
    this.blinkOut();

    this.gameNumber++;
    this.animationSpeed = this.getConfig().animationSpeed;
    this.animations = new AnimationQueue(this);

    let startingInfo;
    if (state) {
      this.players = state.players.map(Player.fromJSON);
      this.setPlayerForIndex(state.currentPlayerIndex);
      startingInfo = Matrix.fromJSON(state.cubes, cubeDesc => _.pick(cubeDesc, ['value', 'color']));
    } else {
      this.createPlayers();
      this.initStartingPlayer();
      startingInfo = this.defaultStart();
    }

    this.buildFieldOfCubes(startingInfo);

    // #TODO connect: this.energy <= this.cubes.sumBy('value')
    this.ae(() => this.cubes.sumBy('value')).dataflow(v => this.energy = v);

    const checkEnd = (color, v) => {
      const numCubes = this.fieldSize * this.fieldSize;
      if (v >= numCubes) {
        this.win(color);
      }
    };
    this.ae(() => this.cubes.count(cube => cube.color === 'green')).dataflow(v => this.get('#greenPlayer').innerHTML = v).onChange(v => checkEnd('green', v));
    this.ae(() => this.cubes.count(cube => cube.color === 'red')).dataflow(v => this.get('#redPlayer').innerHTML = v).onChange(v => checkEnd('red', v));

    this.saveToAttribute();
    this.startTurnForCurrentPlayer();
  }

  createPlayers() {
    this.currentPlayerIndex = 0;
    this.players = this.getConfig().players.map(Player.fromJSON);
  }

  buildFieldOfCubes(startingInfo) {
    this.field.innerHTML = '';
    this.cubes = startingInfo.map(info => {
      const cube = new Cube(this, info);

      this.field.appendChild(cube.container);

      return cube;
    });

    this.cubes.forEach(cube => {
      this.ae(() => cube.value).dataflow(value => cube.button.innerHTML = value).dataflow(value => {
        if (value > cube.neighbours.length) {
          this.addAnimation(new Explode(cube, this));
        }
      });
      this.ae(() => cube.color).dataflow(value => cube.button.style.background = COLOR_MAP.get(value));
    });

    const fieldSize = this.cubes.size;
    this.field.style.setProperty('grid-template-columns', `repeat(${fieldSize}, 40px)`);
    this.field.style.setProperty('grid-template-rows', `repeat(${fieldSize}, 40px)`);
  }

  initStartingPlayer() {
    this.setPlayerForIndex(0);
  }
  nextPlayer() {
    this.setPlayerForIndex(this.currentPlayerIndex + 1);
  }
  setPlayerForIndex(index) {
    this.currentPlayerIndex = index % this.players.length;
    this.player = this.players[this.currentPlayerIndex];
    this.style.setProperty('--playerOnTurn', this.player.color);
  }

  startTurnForCurrentPlayer() {
    this.player.startTurn(this);
  }
  clickRandomCube() {
    const color = this.player.color;
    function canClick(cube) {
      return cube.color === color || cube.color === 'gray';
    }

    const clickables = [];
    this.cubes.forEach(cube => {
      if (canClick(cube)) {
        clickables.push(cube);
      }
    });

    this.processQueue(clickables.sample());
  }

  ae(fn, ...opts) {
    const ae = aexpr(fn, ...opts);
    this.aexprs.add(ae);
    return ae;
  }

  handleClickOn(cube) {
    if (cube.color === this.player.color || cube.color === 'gray') {
      if (!this.classList.contains('noClickAllowed')) {
        this.processQueue(cube);
        return true;
      }
    }
    return false;
  }

  // #important
  async processQueue(cube) {
    this.animationSpeed = this.getConfig().animationSpeed;
    this.classList.add('noClickAllowed');
    this.addAnimation(new Increment(cube, this.player.color, this));

    const animationQueue = this.animations;
    await animationQueue.process();
    if (animationQueue.gameNumber < this.gameNumber) {
      return;
    }
    this.nextPlayer();
    this.saveToAttribute();
    this.startTurnForCurrentPlayer();
  }
  addAnimation(animation) {
    this.animations.add(animation);
  }
  duration(duration) {
    const speed = this.animationSpeed;
    if (speed === 'Instantaneous') {
      return 0;
    }
    if (_.isNumber(speed)) {
      return duration / speed;
    }
    return 1;
  }

  detachedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.aexprs.forEach(ae => ae.dispose());
    this.aexprs.clear();
  }

  defaultConfig() {
    return {
      fieldSize: 5,
      startingValue: 2,
      animationSpeed: 1,
      players: [{
        color: 'green',
        ai: false
      }, {
        color: 'red',
        ai: true
      }]
    };
  }
  getConfig() {
    function loadJSON(key) {
      const stringValue = this.getItem(key);
      if (!stringValue) {
        return undefined;
      }
      return JSON.parse(stringValue);
    }

    const config = localStorage::loadJSON('JumpingCubes');
    if (config) {
      return config;
    }
    return this.defaultConfig();
  }
  setConfig(config) {
    function saveJSON(key, json) {
      const stringValue = JSON.stringify(json, undefined, 2);
      return this.setItem(key, stringValue);
    }

    return localStorage::saveJSON('JumpingCubes', config);
  }
  resetConfig() {
    return localStorage.removeItem('JumpingCubes');
  }
  configure(callback) {
    const config = this.getConfig();
    callback(config);
    this.setConfig(config);
  }

  onContextMenu(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    function fa4(classes) {
      return '<i class="fa fa-' + classes + '" aria-hidden="true"></i>';
    }

    const players = this.getConfig().players.map((player, index) => {
      function checkIcon(enabled) {
        return enabled ? fa4('check-square-o') : fa4('square-o');
      }

      return [`player ${player.color}`, (evt, item) => {
        evt.stopPropagation();
        evt.preventDefault();

        let isAI;
        this.configure(conf => isAI = conf.players[index].ai = !conf.players[index].ai);
        item.querySelector(".icon").innerHTML = checkIcon(isAI);
      }, '', { toString: () => checkIcon(this.getConfig().players[index].ai) }];
    });

    const radioButtonList = (values, configProperty) => {
      function radioIcon(enabled) {
        return enabled ? fa4('dot-circle-o') : fa4('circle-o');
      }

      return values.map((value, index) => [value + '', (evt, item) => {
        evt.stopPropagation();
        evt.preventDefault();

        this.configure(conf => conf[configProperty] = value);
        item.parentElement.querySelectorAll(".icon").forEach((icon, iconIndex) => {
          icon.innerHTML = radioIcon(index === iconIndex);
        });
      }, '', { toString: () => radioIcon(value === this.getConfig()[configProperty]) }]);
    };
    const fieldSizes = radioButtonList(1 .to(13), 'fieldSize');
    const startingValues = radioButtonList([1, 2], 'startingValue');
    const animationSpeed = radioButtonList([0.5, 0.75, 1, 1.25, 1.5, 2, 4, 'Instantaneous'], 'animationSpeed');

    const items = [];
    items.push(["restart game", ::this.restart, '', fa4('fast-backward')]);
    items.push(["new game", () => lively.openComponentInWindow('jumping-cubes')]);
    items.push(["players", players, '', fa4('users')]);
    items.push(["field size", fieldSizes, '', fa4('cubes')]);
    items.push(["starting value", startingValues, '', fa4('cube')]);
    items.push(["animation speed", animationSpeed, '', fa4('cube')]);
    items.push(["reset to default", ::this.resetConfig, '', fa4('trash-o')]);

    const menu = new ContextMenu(this, items);
    menu.openIn(document.body, evt, this);
  }

  restart() {
    this.cleanup();
    this.reset();
  }

  async blinkOut() {
    if (!this.blinked) {
      return;
    }
    this.blinked = false;

    const container = this.get('#gameEnd-container');
    const winText = this.get('#gameEnd-message');
    const clickText = this.get('#gameEnd-newGame');

    const mainDuration = 300;
    container.animate([{ 'backgroundColor': 'rgba(255, 255, 255, 0.1)' }, { 'backgroundColor': 'rgba(255, 255, 255, 0)' }], {
      duration: mainDuration,
      easing: 'ease-out',
      fill: 'forwards'
    });
    winText.animate([{ 'opacity': 1, 'transform': 'scaleY(1)' }, { 'opacity': 0, 'transform': 'scaleY(0.5)' }], {
      duration: mainDuration,
      easing: 'ease-out',
      fill: 'forwards'
    });
    clickText.style.setProperty('opacity', 0);
    clickText.animate([{ 'opacity': 1 }, { 'opacity': 0 }], {
      duration: mainDuration,
      easing: 'ease-out',
      fill: 'forwards'
    });

    await lively.sleep(mainDuration);
    container.style.setProperty('display', 'none');
  }

  blinkIn(color) {
    if (this.blinked) {
      return;
    }
    this.blinked = true;

    const container = this.get('#gameEnd-container');
    const winText = this.get('#gameEnd-message');
    const clickText = this.get('#gameEnd-newGame');

    winText.innerHTML = `Player ${Strings.toUpperCaseFirst(color)} Wins!`;
    winText.style.setProperty('background-color', COLOR_MAP.get(color));

    const mainDuration = 300;
    container.style.setProperty('display', 'grid');
    container.animate([{ 'backgroundColor': 'rgba(255, 255, 255, 0)' }, { 'backgroundColor': 'rgba(255, 255, 255, 0.7)' }, { 'backgroundColor': 'rgba(255, 255, 255, 0.1)' }], {
      duration: mainDuration * 1.5,
      easing: 'ease-out',
      fill: 'forwards'
    });
    winText.animate([{ 'opacity': 0, 'transform': 'scaleY(0.5)' }, { 'opacity': 1, 'transform': 'scaleY(1)' }], {
      duration: mainDuration,
      easing: 'cubic-bezier(0.34, 2.56, 0.64, 1)',
      fill: 'forwards'
    });
    clickText.style.setProperty('opacity', 0);
    clickText.animate([{ 'opacity': 0 }, { 'opacity': 1 }], {
      duration: 1000,
      easing: 'ease-out',
      delay: mainDuration,
      fill: 'forwards'
    });
  }

  cleanup() {
    this.disposeBindings();
    this.classList.remove('noClickAllowed');
    this.gameNumber++;
  }

  win(color) {
    this.cleanup();
    this.blinkIn(color);
  }

  /* Lively-specific API */

  toJSON() {
    return {
      currentPlayerIndex: this.currentPlayerIndex,
      players: this.players.map(p => p.toJSON()),

      fieldSize: this.cubes.size,
      cubes: this.cubes.toJSON()
    };
  }

  saveToAttribute() {
    this.setJSONAttribute('state', this.toJSON());
  }

  // store something that would be lost
  livelyPrepareSave() {
    // this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {
    this.disposeBindings();
  }

  livelyMigrate(other) {
    const state = other.getJSONAttribute('state');
    this.setJSONAttribute('state', state);
    this.classList.remove('noClickAllowed');
  }

  async livelyExample() {
    this.style.backgroundColor = "lightgray";
  }

}