/*********************************************************************
 * Level - base class for a level
 * Copyright (c) 2012 Steve Purkis
 *
 * Note: always use game.setTimeout to avoid random timeouts hanging
 * around if the user switches levels.
 *
 * var l = new Level( game );
 */

require('asteroidUtils.js');

var gameLevels = [];

function Level(game) {
    if (game) return this.initialize(game);
    return this;
}
Level.images = []; // populate to auto-load images

Level.prototype.initialize = function(game) {
    this.game = game;

    var canvas = this.game.ctx.canvas;
    this.maxX = canvas.width;
    this.maxY = canvas.height;
    this.canvas = canvas;

    this.backgroundColor = "#fff";
    this.images = {};

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
 * TrainingLevel: big planet out of field of view with falling asteroids.
 */

function TrainingLevel(game) {
    if (game) return this.initialize(game);
    return this;
}

TrainingLevel.inheritsFrom( Level );
TrainingLevel.description = "Training Level - learn how to fly!";
TrainingLevel.images = [ "planet.png", "planet-80px-green.png" ];

gameLevels.push(TrainingLevel);

TrainingLevel.prototype.initialize = function(game) {
    TrainingLevel.prototype.parent.initialize.call(this, game);
    this.wrapX = false;
    this.wrapY = false;

    var maxX = this.maxX;
    var maxY = this.maxY;

    var canvas = this.game.ctx.canvas;
    this.planets.push(
	{x: 1/2*maxX, y: 1/2*maxY, mass: 100, radius: 50, damage: 5, stationary: true, image_src: "planet.png" }
	, {x: 40, y: 40, mass: 5, radius: 20, vX: 2, vY: 0, image_src:"planet-80px-green.png"}
	, {x: maxX-40, y: maxY-40, mass: 5, radius: 20, vX: -2, vY: 0, image_src:"planet-80px-green.png"}
    );

    this.ships.push(
	{x: 4/5*canvas.width, y: 1/3*canvas.height}
    );

    this.asteroids.push(
	{x: 1/10*maxX, y: 6/10*maxY, mass: 0.5, radius: 14, vX: 0, vY: 0, spawn: 1, health: 1},
        {x: 1/10*maxX, y: 2/10*maxY, mass: 1, radius: 5, vX: 0, vY: -0.1, spawn: 3 },
        {x: 5/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: -0.2, vY: 0.25, spawn: 4 },
        {x: 5/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: -0.22, vY: 0.2, spawn: 7 }
    );
}

/******************************************************************************
 * Level0: big planet out of field of view with falling asteroids.
 */

function Level0(game) {
    if (game) return this.initialize(game);
    return this;
}

Level0.inheritsFrom( Level );
Level0.description = "Level 0 - Five planets";
Level0.images = [ "planet.png", "planet-80px-green.png" ];

gameLevels.push(Level0);

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
	{x: 1/2*maxX, y: 1/2*maxY, mass: 500, radius: 100, damage: 5, stationary: true, image_src: "planet.png" }
	, {x: 40, y: 40, mass: 5, radius: 20, stationary: true, image_src:"planet-80px-green.png"}
	, {x: maxX-40, y: maxY-40, mass: 5, radius: 20, stationary: true, image_src:"planet-80px-green.png"}
	, {x: maxX-40, y: 40, mass: 5, radius: 20, stationary: true, image_src:"planet-80px-green.png"}
	, {x: 40, y: maxY-40, mass: 5, radius: 20, stationary: true, image_src:"planet-80px-green.png"}
    );

    this.ships.push(
	{x: 4/5*canvas.width, y: 1/3*canvas.height}
	, {x: 1/5*maxX, y: 1/3*maxY, color: {r: 0,g:100,b:100}, healthX: 10}
    );

    this.asteroids.push(
	{x: 1/10*maxX, y: 6/10*maxY, mass: 0.5, radius: 14, vX: 0, vY: 0, spawn: 3, health: 1},
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
Level1.description = "Level 1 - Planetside, falling asteroids";
Level1.images = [ "planet-2000px.png", "planet.png", "planet-40px-brown.png" ];
gameLevels.push(Level1);

Level1.prototype.initialize = function(game) {
    Level1.prototype.parent.initialize.call(this, game);
    this.maxX = 1500;
    this.maxY = 700;
    this.wrapX = false;
    this.wrapY = false;
//    this.backgroundColor = "black";

    var maxX = this.maxX;
    var maxY = this.maxY;

    var canvas = this.game.ctx.canvas;
    this.planets.push(
	{x: 1/2*maxX, y: canvas.height + 900, mass: 5000, radius: 1000, stationary: true, image_src: "planet-2000px.png"}
    );

    this.ships.push(
	{x: 4/5*maxX, y: 2/3*canvas.height, color: {r:0,g:0,b:0}}
	, {x: 1/5*maxX, y: 2/3*canvas.height, color: {r:0,g:100,b:100}, healthX: 10}
    );

/**/
    this.asteroids.push(
	{x: 1/10*maxX, y: 6/10*maxY, mass: 0.5, radius: 14, vX: 0, vY: 0, spawn: 3, health: 1, image_src: "planet-40px-brown.png" },
        {x: 1/10*maxX, y: 2/10*maxY, mass: 1, radius: 5, vX: 0, vY: -0.1, image_src: "planet-40px-brown.png" },
        {x: 5/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: -0.2, vY: 0.25, image_src: "planet-40px-brown.png" },
        {x: 5/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: -0.22, vY: 0.2, image_src: "planet-40px-brown.png" },
        {x: 6/10*maxX, y: 8/10*maxY, mass: 2, radius: 6, vX: -0.4, vY: 0.1, image_src: "planet-40px-brown.png" },
        {x: 6/10*maxX, y: 9/10*maxY, mass: 3, radius: 8, vX: 0.5, vY: -0.5, image_src: "planet-40px-brown.png" },
        {x: 9/10*maxX, y: 8/10*maxY, mass: 2, radius: 6, vX: 0.6, vY: 0.4, image_src: "planet-40px-brown.png" },
        {x: 9/10*maxX, y: 9/10*maxY, mass: 3, radius: 8, vX: 0.7, vY: 0.6, image_src: "planet-40px-brown.png" },
	{x: 3/10*maxX, y: 1/10*maxY, mass: 2, radius: 6, vX: 0.8, vY: -0.2, image_src: "planet-40px-brown.png" },
	{x: 3/10*maxX, y: 2/10*maxY, mass: 3, radius: 8, vX: 0.9, vY: -0.1, image_src: "planet-40px-brown.png" }
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
	    spawn: 0,
	    image: self.game.images["planet-40px-brown.png"]
	});
	self.game.addObject(asteroid);
	self.spawnTimeout = self.game.setTimeout(spawnAsteroid, 1000);
    }

    spawnAsteroid();
}


/******************************************************************************
 * Level2: random asteroid field with 2 ships
 */

function Level2(game) {
    if (game) return this.initialize(game);
    return this;
}

Level2.inheritsFrom( Level );
Level2.description = "Level 2 - Random asteroid field, moving planets, wrapped map";
Level2.images = [ "planet.png", "planet-40px-brown.png", "planet-80px-green.png" ];
gameLevels.push(Level2);

Level2.prototype.initialize = function(game) {
    Level2.prototype.parent.initialize.call(this, game);
    //this.maxX = 500;
    //this.maxy = 500;
    this.wrapX = true;
    this.wrapY = true;

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.planets.push(
	{x: 3/4*maxX, y: 1/4*maxY, mass: 195, radius: 65, vX: -0.5, vY: 0, image_src: "planet-80px-green.png"}
	, {x: 1/5*maxX, y: 2/5*maxY, mass: 15, radius: 15, vX: -0.5, vY: 0.5, image_src: "planet-40px-brown.png" }
	, {x: 5/7*maxX, y: 4/5*maxY, mass: 30, radius: 40, image_src: "planet.png"}
	, {x: 1/2*maxX-60, y: 1/2*maxY, mass: 15, radius: 15, vY: 0.5, image_src: "planet-40px-brown.png"}
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
Level3.description = "Level 3 - Basic asteroid field, wrapped map";
gameLevels.push(Level3);

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

/******************************************************************************
 * Level4: horizontal scroller
 */

function Level4(game) {
    if (game) return this.initialize(game);
    return this;
}

Level4.inheritsFrom( Level );
Level4.description = "Level 4 - horizontal scroller, bad guy at end";
Level4.images = [ "planet.png", "planet-40px-brown.png", "planet-80px-green.png" ];
gameLevels.push(Level4);

Level4.prototype.initialize = function(game) {
    Level4.prototype.parent.initialize.call(this, game);

    this.maxX = 2000;
    this.maxY = this.canvas.height;
    this.wrapX = false;
    this.wrapY = false;
    this.backgroundColor = "#000";

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.ships.push(
	{x: 1/10*maxX, y: 1/2*maxY, color: {r: 220, g:220, b:100}}
    );

    this.planets.push(
	{x: 1/5*maxX, y: 2/3*maxY, mass: 100, radius: 60, damage: 5, stationary: true, image_src: "planet.png" }
	, {x: 7/10*maxX, y: 1/2*maxY, mass: 400, radius: 100, stationary: true, image_src: "planet-80px-green.png"}
    );


/**/
    for (var i=50; i<this.maxX; i+= getRandomInt(120,220)) {
	for (var j=50; j<this.maxY; j+= getRandomInt(80,120)) {
	    var asteroid = new Asteroid(this, {
		x: i + getRandomInt(0, 80),
		y: j + getRandomInt(0, 80),
		mass: getRandomInt(1, 3),
		radius: getRandomInt(3, 10),
		vX: -Math.random(),  // always come from the right.
		vY: Math.random(),
		image: this.game.images["planet-40px-brown.png"]
	    });
	    // vary the velocities:
	    if (j%2) asteroid.vY = -asteroid.vY;
	    this.asteroids.push(asteroid);
	}
    }

    // spawn falling asteroid
    var self = this;
    var spawnAsteroid = function() {
	var radius = getRandomInt(3,7);
	var negative_vY = -1 * getRandomInt(0,1);
	var offscreenX = self.game.viewOffset.x + self.canvas.width - radius;
	var asteroid = new Asteroid(self.game, {
	    radius: radius,
	    x: getRandomInt(offscreenX, maxX),
	    y: getRandomInt(0, self.maxY),
	    vX: -1,
	    vY: negative_vY * Math.random(),
	    health: 2,
	    spawn: 0,
	    image: self.game.images["planet-40px-brown.png"]
	});
	self.game.addObject(asteroid);
	self.spawnTimeout = self.game.setTimeout(spawnAsteroid, 1000);
    }

    spawnAsteroid();

    var spawnBadGuy = function() {
	var offset = self.game.viewOffset;
	if (self.game.ship.x > 4/5*self.maxX) {
	    var badGuy = new ComputerShip(self.game, {
		x: 9/10*maxX,
		y: -14,
		color: {r: 200,g:225,b:225},
		healthX: 10
	    });
	    self.game.addObject(badGuy);
	    return; // only spawn once
	}
	self.badGuyTimeout = self.game.setTimeout(spawnBadGuy, 1500);
    }

    spawnBadGuy();
}


/******************************************************************************
 * Level5: blank
 */

function Level5(game) {
    if (game) return this.initialize(game);
    return this;
}

Level5.inheritsFrom( Level );
Level5.description = "Level 5 - blank, unwrapped for demo";
Level5.images = [ "planet.png" ];
gameLevels.push(Level5);

Level5.prototype.initialize = function(game) {
    Level5.prototype.parent.initialize.call(this, game);

    this.maxX = this.canvas.width;
    this.maxY = this.canvas.height;
    this.wrapX = false;
    this.wrapY = false;

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.ships.push(
	{x: 1/10*maxX, y: 1/2*maxY}
    );

}

/******************************************************************************
 * Level6: hairballs & chainsaws?
 */

function Level6(game) {
    if (game) return this.initialize(game);
    return this;
}

Level6.inheritsFrom( Level );
Level6.description = "Level 6 - another game demo";
Level6.images = [ "hairball-145px.jpg", "planet.png", "chainsaw.jpg" ];
gameLevels.push(Level6);

Level6.prototype.initialize = function(game) {
    Level6.prototype.parent.initialize.call(this, game);

    this.maxX = this.canvas.width;
    this.maxY = this.canvas.height;
    this.wrapX = true;
    this.wrapY = true;

    var maxX = this.maxX;
    var maxY = this.maxY;

    this.ships.push(
	{x: 1/10*maxX, y: 1/2*maxY}
    );

    this.planets.push(
	{x: 3/4*maxX, y: 1/4*maxY, mass: 195, radius: 65, vX: -0.5, vY: 0, image_src: "planet.png"}
    );

    for (var i=50; i<this.maxX; i+= getRandomInt(120,220)) {
	for (var j=50; j<this.maxY; j+= getRandomInt(80,120)) {
	    var asteroid = new Asteroid(this, {
		x: i + getRandomInt(0, 80),
		y: j + getRandomInt(0, 80),
		mass: getRandomInt(1, 3),
		radius: getRandomInt(15, 40),
		health: getRandomInt(10, 30),
		vX: -Math.random(),  // always come from the right.
		vY: Math.random(),
		image: this.game.images["hairball-145px.jpg"]
	    });
	    // vary the velocities:
	    if (j%2) asteroid.vY = -asteroid.vY;
	    this.asteroids.push(asteroid);
	}
    }


}
