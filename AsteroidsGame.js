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
    this.maxAccel = 1;

    this.elasticity = 0.7;       // collision elasticity: velocity modifier
    this.attachThreshold = 0.01; // min dVelocity before objects become attached
    this.detachThreshold = 0.02; // min dVelocity before attached objects detach

    this.weaponsFired = [];
    this.asteroids = [];
    this.planets = [];

    // hard-code 1 player for now & start co-ords
    this.ship = new Ship(this, {x: 1/5*this.maxX, y: 2/3*this.maxY});

    this.planets.push( new Planet(this, {x: 3/4*this.maxX, y: 1/4*this.maxY, mass: 195, radius: 45, vX: -0.5, vY: 0}) /*,
		       new Planet(this, {x: 1/5*this.maxX, y: 2/5*this.maxY, mass: 15, radius: 15}),
		       new Planet(this, {x: 5/7*this.maxX, y: 4/5*this.maxY, mass: 30, radius: 20}),
		       new Planet(this, {x: 1/2*this.maxX, y: 2/3*this.maxY, mass: 120, radius: 30})*/ );

    this.asteroids.push(new Asteroid(this, {x: 1/10*this.maxX, y: 1/10*this.maxY, mass: 1, radius: 4, vX: 0, vY: 0 }),
			new Asteroid(this, {x: 1/10*this.maxX, y: 2/10*this.maxY, mass: 1, radius: 5, vX: 0, vY: -0.1 }),
			new Asteroid(this, {x: 5/10*this.maxX, y: 1/10*this.maxY, mass: 1, radius: 6, vX: -0.2, vY: 0.3 }),
			new Asteroid(this, {x: 5/10*this.maxX, y: 2/10*this.maxY, mass: 1, radius: 7, vX: -0.3, vY: 0.2 }),
			new Asteroid(this, {x: 6/10*this.maxX, y: 8/10*this.maxY, mass: 1, radius: 6, vX: -0.4, vY: 0.1 }),
			new Asteroid(this, {x: 6/10*this.maxX, y: 9/10*this.maxY, mass: 1, radius: 7, vX: 0.5, vY: -0.5 }),
			new Asteroid(this, {x: 9/10*this.maxX, y: 8/10*this.maxY, mass: 1, radius: 6, vX: 0.6, vY: 0.4 }),
			new Asteroid(this, {x: 9/10*this.maxX, y: 9/10*this.maxY, mass: 1, radius: 7, vX: 0.7, vY: 0.6 }),
			new Asteroid(this, {x: 3/10*this.maxX, y: 1/10*this.maxY, mass: 1, radius: 6, vX: 0.8, vY: -0.2 }),
			new Asteroid(this, {x: 3/10*this.maxX, y: 2/10*this.maxY, mass: 1, radius: 7, vX: 0.9, vY: -0.1 }));

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

AsteroidsGame.prototype.startGameLoop = function() {
    if (this.updateIntervalId || this.drawIntervalId) {
	console.log("startGameLoop aborted: already started with intervals=" +
		    this.updateIntervalId +", "+ this.drawIntervalId );
	return;
    }

    // separate computation from re-drawing...
    var self = this;
    this.updateIntervalId = setInterval(function(){
	try {
	    self.updatePositions();
	} catch (e) {
	    console.log("updatePositions: caught exception " + e);
	    self.stop();
	}
    }, this.refreshRate);

    this.drawIntervalId = setInterval(function(){
	self.draw();
    }, this.refreshRate);
};  

AsteroidsGame.prototype.stop = function() {
    if (this.updateIntervalId) {
	clearInterval(this.updateIntervalId);
	delete this.updateIntervalId;
	console.log( "stopped update loop" );
    }
    if (this.drawIntervalId) {
	clearInterval(this.drawIntervalId);
	delete this.drawIntervalId;
	console.log( "stopped draw loop" );
    }

    this.drawGameOver();
}

AsteroidsGame.prototype.draw = function() {
    this.ctx.clearRect(0,0, this.maxX,this.maxY); // clear canvas

    // TODO: replace with this.objects[]
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

AsteroidsGame.prototype.drawGameOver = function() {
    this.draw();

    var ctx = this.ctx;
    ctx.save();
    ctx.font = "20px Verdana";
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillText("Game Over", this.maxX/2 - 50, this.maxY/2);
    ctx.restore();
}

AsteroidsGame.prototype.updatePositions = function() {
    var objects = [];
    objects = objects.concat(this.planets,
			     this.asteroids,
			     this.weaponsFired,
			     [this.ship]);

    this.ship.updatePositions(objects);
    for (var i=0; i < this.planets.length; i++) {
	this.planets[i].updatePositions(objects);
    }
    for (var i=0; i < this.asteroids.length; i++) {
	this.asteroids[i].updatePositions(objects);
    }
    for (var id in this.weaponsFired) {
	this.weaponsFired[id].updatePositions(objects);
    }
};


AsteroidsGame.prototype.objectDied = function(object) {
    if (object.is_weapon) {
	delete this.weaponsFired['t'+object.timeoutId];
    } else if (object.is_asteroid) {
	var i = this.asteroids.indexOf(object);
	this.asteroids.splice(i,1);
	// spawn new asteroids?
    } else if (object.is_planet) {
	// allowed?
    } else if (object.is_ship) {
	throw "Game Over!";
    }
}


AsteroidsGame.prototype.fireWeapon = function(weapon) {
    var self = this;
    weapon.timeoutId = setTimeout(function(){
	self.weaponTimeout(weapon);
    }, weapon.ttl);
    // force associative array by prepending a 't':
    this.weaponsFired['t'+weapon.timeoutId] = weapon;
}

AsteroidsGame.prototype.weaponTimeout = function(weapon) {
    // let the weapon delete itself
    //delete this.weaponsFired['t'+weapon.timeoutId];
    weapon.weaponTimeout();
}

AsteroidsGame.prototype.impact = function(object1, object2, collision) {

    // ignore attached object impacts
    if (object1.attachedTo(object2) || object2.attachedTo(object1)) {
	return;
    }

    if (object1.mass > 0 && object2.mass > 0) {
	// bounce algorithm from:
	// http://www.emanueleferonato.com/2007/08/19/managing-ball-vs-ball-collision-with-flash/
	collision.angle = Math.atan2(collision.dY, collision.dX);
	var magnitude_1 = Math.sqrt(object1.vX*object1.vX + object1.vY*object1.vY) * this.elasticity;
	var magnitude_2 = Math.sqrt(object2.vX*object2.vX + object2.vY*object2.vY) * this.elasticity;

	var direction_1 = Math.atan2(object1.vY, object1.vX);
	var direction_2 = Math.atan2(object2.vY, object2.vX);
	var new_vX_1 = magnitude_1*Math.cos(direction_1-collision.angle);
	var new_vY_1 = magnitude_1*Math.sin(direction_1-collision.angle);
	var new_vX_2 = magnitude_2*Math.cos(direction_2-collision.angle);
	var new_vY_2 = magnitude_2*Math.sin(direction_2-collision.angle);
	var final_vX_1 = ((object1.mass-object2.mass)*new_vX_1+(object2.mass+object2.mass)*new_vX_2)/(object1.mass+object2.mass);
	var final_vX_2 = ((object1.mass+object1.mass)*new_vX_1+(object2.mass-object1.mass)*new_vX_2)/(object1.mass+object2.mass);
	var final_vY_1 = new_vY_1;
	var final_vY_2 = new_vY_2;

//	if (! object1.is_planet) {
	var cos_collision_angle = Math.cos(collision.angle);
	var sin_collision_angle = Math.sin(collision.angle);
	var cos_collision_angle_halfPI = Math.cos(collision.angle + halfPI);
	var sin_collision_angle_halfPI = Math.sin(collision.angle + halfPI);

	var vX = cos_collision_angle*final_vX_1 + cos_collision_angle_halfPI*final_vY_1;
	var vY = sin_collision_angle*final_vX_1 + sin_collision_angle_halfPI*final_vY_1;
	object1.setVelocity(vX, vY);
//	}
//	if (! object2.is_planet) {
	var vX = cos_collision_angle*final_vX_2 + cos_collision_angle_halfPI*final_vY_2;
	var vY = sin_collision_angle*final_vX_2 + sin_collision_angle_halfPI*final_vY_2;
	object2.setVelocity(vX, vY);
//	}

	// attach objects?
	var dVx = final_vX_1 - final_vX_2;
	var dVy = final_vY_1 - final_vY_2;
	var dMagnitude = Math.sqrt(dVx*dVx + dVy*dVy);
	if (dMagnitude < this.attachThreshold) {
	    object1.attach(object2);
	    object2.attach(object1);
	}
    }

    object1.impacted(object2);
    object2.impacted(object1);
}

AsteroidsGame.prototype.maybeDetachObjects = function(object1, object2) {
    var dVx = object1.vX - object2.vX;
    var dVy = object1.vY - object2.vY;
    var dMagnitude = Math.sqrt(dVx*dVx + dVy*dVy);
    if (dMagnitude > this.detachThreshold) {
	object1.detach(object2);
	object2.detach(object1);
    }
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


