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
  constructor(pos = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
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
    return (this.size.x > 0) ? this.pos.x : this.pos.x + this.size.x;
  }

  get top() {
    return (this.size.y > 0) ? this.pos.y : this.pos.y + this.size.y;
  }

  get right() {
    return (this.size.x > 0) ? this.pos.x + this.size.x : this.pos.x;
  }

  get bottom() {
    return (this.size.y > 0) ? this.pos.y + this.size.y : this.pos.y;
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
    this.player = actors.find(el => {
      if (el.type === 'player') {
        return el;
      }
    });
    this.height = grid.length;
    this.width = Math.max(0, ...grid.map((el) => {
      return el.length;
    }));
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

    return this.actors.find(function (el) {
      return el.isIntersect(actor);
    });
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Необходимо передать объект типа Vector');
    }

    for (let y = Math.floor(position.y); y < Math.ceil(position.y + size.y); y++) {
      for (let x = Math.floor(position.x); x < Math.ceil(position.x + size.x); x++) {
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
    this.actors.splice(this.actors.findIndex(el => {
      return el === actor;
    }), 1);
  }

  noMoreActors(type) {
    return (this.actors.find(el => {
      return el.type === type;
    }) === undefined);
  }

  playerTouched(type, actor = undefined) {
    if (this.status === null) {
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
}





class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = Object.create(dictionary);
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
    let grid = [];
    for (let y = 0; y < plan.length; y++) {
      let line = plan[y].split('');
      grid[y] = [];
      for (let x = 0; x < line.length; x++) {
        grid[y].push(this.obstacleFromSymbol(line[x]));
      }
    }
    return grid;
  }

  createActors(plan) {
    let actors = [];
    for (let y = 0; y < plan.length; y++) {
      let line = plan[y].split('');
      for (let x = 0; x < line.length; x++) { 
        if (typeof this.dictionary[line[x]] === 'function') {
          let actor = new this.dictionary[line[x]](new Vector(x, y));
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
  constructor(pos, speed, size) {
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
  constructor(pos, size) {
    super(pos, size);
    this.speed = new Vector(2, 0);
  }
}





class VerticalFireball extends Fireball {
  constructor(pos, size) {
    super(pos, size);
    this.speed = new Vector(0, 2);
  }
}





class FireRain extends Fireball {
  constructor(pos, size) {
    super(pos, size);
    this.speed = new Vector(0, 3);
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}





class Coin extends Actor {
  constructor(pos = new Vector()) {
    super();
    this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
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
  constructor(pos = new Vector()) {
    super();
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector();
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
  