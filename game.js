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
