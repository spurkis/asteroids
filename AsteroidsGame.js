/*********************************************************************
 * Asteroids Game Logic
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');
require('Ships.js');
require('Weapons.js');
require('Planets.js');

function AsteroidsGame(ctx) {
    this.ctx = ctx;
    this.refreshRate = 10; // ms
    this.maxX = ctx.canvas.width;
    this.maxY = ctx.canvas.height;
    this.weaponsFired = [];
    this.asteroids = [];
    this.planets = [];

    // hard-code 1 player for now & start co-ords
    this.ship = new Ship(this, 1/5*this.maxX, 2/3*this.maxY);

    this.planets.push(new Planet(this, 3/4*this.maxX, 1/4*this.maxY, 20, 25),
		      new Planet(this, 1/5*this.maxX, 2/5*this.maxY, 5, 10),
		      new Planet(this, 5/7*this.maxX, 4/5*this.maxY, 10, 10),
		      new Planet(this, 1/2*this.maxX, 2/3*this.maxY, 10, 20) );

    this.asteroids.push(new Asteroid(this, 1/10*this.maxX, 1/10*this.maxY, 1, 4, -0.1, 0.5, 0, 0 ),
			new Asteroid(this, 1/10*this.maxX, 2/10*this.maxY, 1, 5, -0.1, 0.4, 0, 0 ),
			new Asteroid(this, 5/10*this.maxX, 1/10*this.maxY, 1, 6, -0.2, 0.3, 0, 0 ),
			new Asteroid(this, 5/10*this.maxX, 2/10*this.maxY, 1, 7, -0.3, 0.2, 0, 0 ),
			new Asteroid(this, 6/10*this.maxX, 8/10*this.maxY, 1, 6, -0.4, 0.1, 0, 0 ),
			new Asteroid(this, 6/10*this.maxX, 9/10*this.maxY, 1, 7, 0.5, -0.5, 0, 0 ),
			new Asteroid(this, 9/10*this.maxX, 8/10*this.maxY, 1, 6, 0.6, 0.4, 0, 0 ),
			new Asteroid(this, 9/10*this.maxX, 9/10*this.maxY, 1, 7, 0.7, 0.6, 0, 0 ),
			new Asteroid(this, 3/10*this.maxX, 1/10*this.maxY, 1, 6, 0.8, -0.2, 0, 0 ),
			new Asteroid(this, 3/10*this.maxX, 2/10*this.maxY, 1, 7, 0.9, -0.1, 0, 0 ) );

    this.setDefaultCanvasState();
    this.bindDefaultKeys();
}

AsteroidsGame.prototype.setDefaultCanvasState = function() {
    var ctx = this.ctx;
    // set & save default canvas state
    ctx.globalCompositeOperation = 'destination-over';  
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.save();
}

AsteroidsGame.prototype.bindDefaultKeys = function() {
    var self = this;
    $("#controls").keydown(function(event) {self.handleKeyEvent(event)});
    $("#controls").keyup(function(event) {self.handleKeyEvent(event)});
}

AsteroidsGame.prototype.handleKeyEvent = function(event) {
    // TODO: send events, get rid of ifs.
    switch (event.which) {
    case 38: // up = accel
	if (event.type == 'keydown') {
	    this.ship.startAccelerate();
	} else { // assume keyup
	    this.ship.stopAccelerate();
	}
	event.preventDefault();
	break;
    case 40: // down = decel
	if (event.type == 'keydown') {
	    this.ship.startDecelerate();
	} else { // assume keyup
	    this.ship.stopDecelerate();
	}
	event.preventDefault();
	break;
    case 37: // left = accel ccw
	if (event.type == 'keydown') {
	    this.ship.startDecreaseSpin();
	} else { // assume keyup
	    this.ship.stopDecreaseSpin();
	}
	event.preventDefault();
	break;
    case 39: // right = accel cw
	if (event.type == 'keydown') {
	    this.ship.startIncreaseSpin();
	} else { // assume keyup
	    this.ship.stopIncreaseSpin();
	}
	event.preventDefault();
	break;
    case 32: // space = fire
	if (event.type == 'keydown') {
	    this.ship.startFireWeapon();
	} else { // assume keyup
	    this.ship.stopFireWeapon();
	}
	event.preventDefault();
	break;

	// alternate
    case 101: // e = up
	break;
    case 100: // d = down
	break;
    case 115: // s = accel ccw
	break;
    case 102: // f = accel cw
	break;

    case 13:  // <enter>
	event.preventDefault();
	break;
    }
}


AsteroidsGame.prototype.startGameLoop = function() {
    if (this.intervalId) {
	console.log("startGameLoop aborted: already started with interval="+ this.intervalId);
	return;
    }

    // separate computation from re-drawing...
    var self = this;
    this.intervalId = setInterval(function(){
	self.updatePositions();
    }, this.refreshRate);
    this.intervalId = setInterval(function(){
	self.draw();
    }, this.refreshRate);
};  

AsteroidsGame.prototype.draw = function() {
    this.ctx.clearRect(0,0, this.maxX,this.maxY); // clear canvas
    for (var i=0; i < this.planets.length; i++) {
	this.planets[i].draw();
    }
    for (var i=0; i < this.asteroids.length; i++) {
	this.asteroids[i].draw();
    }
    this.ship.draw();
    for (var id in this.weaponsFired) {
	this.weaponsFired[id].draw();
    }
};

AsteroidsGame.prototype.updatePositions = function() {
    this.ship.updatePositions(this.planets);
    for (var i=0; i < this.asteroids.length; i++) {
	this.asteroids[i].updatePositions(this.planets);
    }
    for (var id in this.weaponsFired) {
	this.weaponsFired[id].updatePositions(this.planets);
    }
};

AsteroidsGame.prototype.fireWeapon = function(weapon) {
    var self = this;
    weapon.timeoutId = setTimeout(function(){
	self.weaponTimeout(weapon);
    }, weapon.ttl);
    // force associative array by prepending a 't':
    this.weaponsFired['t'+weapon.timeoutId] = weapon;
}

AsteroidsGame.prototype.weaponTimeout = function(weapon) {
    delete this.weaponsFired['t'+weapon.timeoutId];
    weapon.weaponTimeout();
}

