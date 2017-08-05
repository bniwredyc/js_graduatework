'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error(`Можно прибавлять к вектору только вектор типа Vector`);
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
      throw new Error(`Можно передавать только вектор типа Vector в качестве расположения`);
    }

    if (!(size instanceof Vector)) {
      throw new Error(`Можно передавать только вектор типа Vector в качестве размера`);
    }

    if (!(speed instanceof Vector)) {
      throw new Error(`Можно передавать только вектор типа Vector в качестве скорости`);
    }
    
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get type() {
    return `actor`;
  }

  act() {}

  get left() {
    return (this.pos.x < this.pos.x + this.size.x) ? this.pos.x : this.pos.x + this.size.x;
  }

  get top() {
    return (this.pos.y < this.pos.y + this.size.y) ? this.pos.y : this.pos.y + this.size.y;
  }

  get right() {
    return (this.pos.x + this.size.x > this.pos.x) ? this.pos.x + this.size.x : this.pos.x;
  }

  get bottom() {
    return (this.pos.y + this.size.y > this.pos.y) ? this.pos.y + this.size.y : this.pos.y;
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error(`Можно передавать только объект типа Actor`);
    }

    if (actor === this) {
      return false;
    }

    if ((this.left + this.size.x > actor.left) && (this.left < actor.left + actor.size.x) && (this.top + this.size.y > actor.top) && (this.top < actor.top + actor.size.y)) {
      return true;
    } 
    return false;
  }
}





class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find(function (el) {
      if (el.type == `player`) {
        return el;
      }
    });
    this.height = grid.length;
    this.width = Math.max(...grid.reduce(function (memo, el) {
      memo.push(el.length);
      return memo;
    }, [0]));
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return (this.status !== null && this.finishDelay < 0);
  }

  actorAt(actor) {
    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error(`Необходимо передать объект типа Actor`);
    }

    return this.actors.find(function (el) {
      return el.isIntersect(actor);
    });
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new Error(`Необходимо передать объект типа Vector`);
    }

    for (let y = Math.floor(position.y); y < Math.ceil(position.y + size.y); y++) {
      for (let x = Math.floor(position.x); x < Math.ceil(position.x + size.x); x++) {
        if (x < 0 || x + size.x > this.width || y < 0) {
          return `wall`;
        }

        if (y + size.y > this.height) {
          return `lava`;
        }
        
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x];
        }
      }
    }
    return undefined;
  }

  removeActor(actor) {
    this.actors.splice(this.actors.findIndex(function (el) {
      return el == actor;
    }), 1);
  }

  noMoreActors(type) {
    return (this.actors.find(function (el) {
      return el.type == type;
    }) === undefined);
  }

  playerTouched(type, actor = undefined) {
    if (this.status === null) {
      if (type == `lava` || type == `fireball`) {
        this.status = `lost`;
      }

      if (type == `coin` && actor.type == `coin`) {
        this.removeActor(actor);
          if (this.noMoreActors(`coin`)) {
          this.status = `won`;
        }
      }
    }  
  }
}

const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);


const items = new Map();
const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
  return ['left', 'top', 'right', 'bottom']
    .map(side => `${side}: ${item[side]}`)
    .join(', ');  
}

function movePlayer(x, y) {
  player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
  console.log(`${title}: ${position(item)}`);
  if (player.isIntersect(item)) {
    console.log(`Игрок подобрал ${title}`);
  }
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status);


const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(undefined, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}


const grid = [
  new Array(3),
  ['wall', 'wall', 'lava']
];
const level = new Level(grid);
runLevel(level, DOMDisplay);
