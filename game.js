'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}





class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector)) {
      throw new Error('Можно передавать только вектор типа Vector в качестве расположения');
    }

    if (!(size instanceof Vector)) {
      throw new Error('Можно передавать только вектор типа Vector в качестве размера');
    }

    if (!(speed instanceof Vector)) {
      throw new Error('Можно передавать только вектор типа Vector в качестве скорости');
    }
    
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get type() {
    return 'actor';
  }

  act() {}

  get left() {
    return Math.min(this.pos.x, this.pos.x + this.size.x);
  }

  get top() {
    return Math.min(this.pos.y, this.pos.y + this.size.y);
  }

  get right() {
    return Math.max(this.pos.x + this.size.x, this.pos.x);
  }

  get bottom() {
    return Math.max(this.pos.y + this.size.y, this.pos.y);
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Можно передавать только объект типа Actor');
    }

    if (actor === this) {
      return false;
    }

    return this.right > actor.left && this.left < actor.right && this.bottom > actor.top && this.top < actor.bottom;
  }
}





class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.player = actors.find(el => el.type === 'player');
    this.height = grid.length;
    this.width = Math.max(0, ...grid.map(el => el.length));
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error('Необходимо передать объект типа Actor');
    }

    return this.actors.find(el => el.isIntersect(actor));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Необходимо передать объект типа Vector');
    }

    let right = Math.ceil(position.y + size.y);
    let bottom = Math.ceil(position.x + size.x);
    for (let y = Math.floor(position.y); y < right; y++) {
      for (let x = Math.floor(position.x); x < bottom; x++) {
        if (x < 0 || x + size.x > this.width || y < 0) {
          return 'wall';
        }

        if (y + size.y > this.height) {
          return 'lava';
        }
        
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x];
        }
      }
    }
    return undefined;
  }

  removeActor(actor) {
    this.actors.splice(this.actors.findIndex(el => el === actor), 1);
  }

  noMoreActors(type) {
    return !this.actors.some(el => el.type === type);
  }

  playerTouched(type, actor = undefined) {
    if (this.status !== null) {
      return;
    }
    
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }

    if (type === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
        if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}





class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = Object.assign({}, dictionary);
  }

  actorFromSymbol(symbol) {
    return this.dictionary[symbol];
  }

  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    }
    if (symbol === '!') {
      return 'lava';
    }
  }

  createGrid(plan) {
    return plan.reduce((memo, el) => {
      memo.push(el.split('').reduce((memo, el) => {
        memo.push(this.obstacleFromSymbol(el));
        return memo;
      }, []));
      return memo;
    }, []);
  }

  createActors(plan) {
    let actors = [];
    for (let y = 0; y < plan.length; y++) {
      let line = plan[y].split('');
      for (let x = 0; x < line.length; x++) {
        let symbol = this.dictionary[line[x]];
        if (typeof symbol === 'function') {
          let actor = new symbol(new Vector(x, y));
          if (actor instanceof Actor) {
            actors.push(actor);
          }
        }
      }
    }
    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}





class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    let size = new Vector(1, 1);
    super(pos, size, speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPos = this.getNextPosition(time);
    if (!(level.obstacleAt(nextPos, this.size))) {
      this.pos = nextPos;
    } else {
      this.handleObstacle();
    }
  }
}





class HorizontalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(2, 0);
    super(pos, speed);
    this.size = new Vector(1, 1);
  }
}





class VerticalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 2);
    super(pos, speed);
    this.size = new Vector(1, 1);
  }
}





class FireRain extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 3);
    super(pos, speed);
    this.size = new Vector(1, 1);
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}





class Coin extends Actor {
  constructor(position = new Vector(0, 0)) {
    let pos = position.plus(new Vector(0.2, 0.1));
    let size = new Vector(0.6, 0.6);
    super(pos, size);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.pos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}





class Player extends Actor {
  constructor(position = new Vector(0, 0)) {
    let pos = position.plus(new Vector(0, -0.5));
    let size = new Vector(0.8, 1.5);
    let speed = new Vector(0, 0);
    super(pos, size, speed);
  }

  get type() {
    return 'player';
  }
}





const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
}

const parser = new LevelParser(actorDict);

loadLevels()
  .then(schemas => runGame(JSON.parse(schemas), parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!')));
