/*********************************************************************
 * Level - base class for a level
 * Copyright (c) 2012 Steve Purkis
 *
 * var l = new Level( game, levelDetails );
 */

require('asteroidUtils.js');

function Level(game) {
    if (game) return this.initialize(game);
    return this;
}

Level.prototype.initialize = function(game) {
    this.game = game;

    var canvas = this.game.ctx.canvas;
    this.maxX = canvas.width;
    this.maxY = canvas.height;

    this.asteroids = [];
    this.planets = [];
    this.suns = [];
    this.ships = [];
    this.weapons = {};
    this.respawn = {};

    this.wrapX = false;
    this.wrapY = false;

    return this;
}


/******************************************************************************
 * Level0: big planet out of field of view with falling asteroids.
 */

function Level0(game) {
    if (game) return this.initialize(game);
    return this;
}

Level0.inheritsFrom( Level );

Level0.prototype.initialize = function(game) {
    Level0.prototype.parent.initialize.call(this, game);
    this.maxX = 1000;
    this.maxY = 700;
    this.wrapX = false;
    this.wrapY = false;

    var maxX = this.maxX;
    var maxY = this.maxY;

    var canvas = this.game.ctx.canvas;
    this.planets.push(
	{x: 1/2*maxX, y: 1/2*maxY, mass: 500, radius: 100, damage: 5, stationary: true}
	, {x: 0, y: 0, mass: 5, radius: 40, stationary: true}
	, {x: maxX, y: maxY, mass: 5, radius: 40, stationary: true}
	, {x: maxX, y: 0, mass: 5, radius: 40, stationary: true}
	, {x: 0, y: maxY, mass: 5, radius: 40, stationary: true}
    );

    this.ships.push(
	{x: 4/5*canvas.width, y: 1/3*canvas.height}
	, {x: 1/5*maxX, y: 1/3*maxY, color: {r: 0,g:100,b:100}, healthX: 10}
    );

    this.asteroids.push(
	{x: 1/10*maxX, y: 6/10*maxY, mass: 0.5, radius: 14, vX: 0, vY: 0, spawn: 3, health: 1 },
        {x: 1/10*maxX, y: 2/10*maxY, mass: 1, radius: 5, vX: 0, vY: -0.1 },
        {x: 5/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: -0.2, vY: 0.25 },
        {x: 5/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: -0.22, vY: 0.2 }
    );
}

/******************************************************************************
 * Level1: big planet out of field of view with falling asteroids.
 */

function Level1(game) {
    if (game) return this.initialize(game);
    return this;
}

Level1.inheritsFrom( Level );

Level1.prototype.initialize = function(game) {
    Level1.prototype.parent.initialize.call(this, game);
    //this.maxX = 500;
    //this.maxy = 500;
    this.wrapX = true;
    this.wrapY = false;

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.planets.push(
	{x: 1/2*maxX, y: maxY + 900, mass: 5000, radius: 1000, stationary: true}
    );

    this.ships.push(
	{x: 4/5*maxX, y: 2/3*maxY}
	, {x: 1/5*maxX, y: 2/3*maxY, color: {r: 0,g:100,b:100}, healthX: 10}
    );

/**/
    this.asteroids.push(
	{x: 1/10*maxX, y: 6/10*maxY, mass: 0.5, radius: 14, vX: 0, vY: 0, spawn: 3, health: 1 },
        {x: 1/10*maxX, y: 2/10*maxY, mass: 1, radius: 5, vX: 0, vY: -0.1 },
        {x: 5/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: -0.2, vY: 0.25 },
        {x: 5/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: -0.22, vY: 0.2 },
        {x: 6/10*maxX, y: 8/10*maxY, mass: 2, radius: 6, vX: -0.4, vY: 0.1 },
        {x: 6/10*maxX, y: 9/10*maxY, mass: 3, radius: 8, vX: 0.5, vY: -0.5 },
        {x: 9/10*maxX, y: 8/10*maxY, mass: 2, radius: 6, vX: 0.6, vY: 0.4 },
        {x: 9/10*maxX, y: 9/10*maxY, mass: 3, radius: 8, vX: 0.7, vY: 0.6 },
	{x: 3/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: 0.8, vY: -0.2 },
	{x: 3/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: 0.9, vY: -0.1 }
    );
/**/

    // spawn falling asteroid
    var self = this;
    var spawnAsteroid = function() {
	var radius = getRandomInt(3,7);
	var negative_vX = -1 * getRandomInt(0,1);
	var asteroid = new Asteroid(self.game, {
	    radius: radius,
	    x: getRandomInt(0,maxX),
	    y: -radius,
	    vX: negative_vX * Math.random(),
	    vY: getRandomInt(0,10)/10,
	    health: 2,
	    spawn: 0
	});
	self.game.addObject(asteroid);
    }

    this.spawnInterval = setInterval(spawnAsteroid, 1000);
}


/******************************************************************************
 * Level2: random asteroid field with 2 ships
 */

function Level2(game) {
    if (game) return this.initialize(game);
    return this;
}

Level2.inheritsFrom( Level );

Level2.prototype.initialize = function(game) {
    Level2.prototype.parent.initialize.call(this, game);
    //this.maxX = 500;
    //this.maxy = 500;
    this.wrapX = true;
    this.wrapY = true;

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.planets.push(
	{x: 3/4*maxX, y: 1/4*maxY, mass: 195, radius: 45, vX: -0.5, vY: 0}
	, {x: 1/5*maxX, y: 2/5*maxY, mass: 15, radius: 15, vX: -0.5, vY: 0.5, image: this.game.planetImg }
	, {x: 5/7*maxX, y: 4/5*maxY, mass: 30, radius: 20}
	, {x: 1/2*maxX-60, y: 1/2*maxY, mass: 15, radius: 15, vY: 0.5}
    );

    this.ships.push(
	{x: 4/5*maxX, y: 2/3*maxY}
	, {x: 1/5*maxX, y: 2/3*maxY, color: {r: 0,g:100,b:100}, healthX: 10}
    );

/**/
    for (var i=50; i<this.maxX; i+= getRandomInt(80,120)) {
	for (var j=50; j<this.maxY; j+= getRandomInt(80,120)) {
	    var asteroid = new Asteroid(this, {
		x: i + getRandomInt(0, 80),
		y: j + getRandomInt(0, 80),
		mass: getRandomInt(1, 3),
		radius: getRandomInt(3, 10),
		vX: Math.random(),
		vY: Math.random(),
	    });
	    // vary the velocities:
	    if (i%2) asteroid.vX = -asteroid.vX;
	    if (j%2) asteroid.vY = -asteroid.vY;
	    this.asteroids.push(asteroid);
	}
    }
/**/
}

/******************************************************************************
 * Level3: basic asteroid field with 1 ship
 */

function Level3(game) {
    if (game) return this.initialize(game);
    return this;
}

Level3.inheritsFrom( Level );

Level3.prototype.initialize = function(game) {
    Level3.prototype.parent.initialize.call(this, game);
    //this.maxX = 500;
    //this.maxy = 500;
    this.wrapX = true;
    this.wrapY = true;

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.ships.push(
	{x: 4/5*maxX, y: 2/3*maxY}
    );

/**/
    this.asteroids.push(
	{x: 1/10*maxX, y: 6/10*maxY, mass: 0.5, radius: 14, vX: 0, vY: 0, spawn: 3, health: 1 },
        {x: 1/10*maxX, y: 2/10*maxY, mass: 1, radius: 5, vX: 0, vY: -0.1 },
        {x: 5/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: -0.2, vY: 0.25 },
        {x: 5/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: -0.22, vY: 0.2 },
        {x: 6/10*maxX, y: 8/10*maxY, mass: 2, radius: 6, vX: -0.4, vY: 0.1 },
        {x: 6/10*maxX, y: 9/10*maxY, mass: 3, radius: 8, vX: 0.5, vY: -0.5 },
        {x: 9/10*maxX, y: 8/10*maxY, mass: 2, radius: 6, vX: 0.6, vY: 0.4 },
        {x: 9/10*maxX, y: 9/10*maxY, mass: 3, radius: 8, vX: 0.7, vY: 0.6 },
	{x: 3/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: 0.8, vY: -0.2 },
	{x: 3/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: 0.9, vY: -0.1 }
    );
/**/
}
