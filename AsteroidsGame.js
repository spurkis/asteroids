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
    this.ship = new Ship(this, 1/5*this.maxX, 2/3*this.maxY);

    this.planets.push( new Planet(this, 3/4*this.maxX, 1/4*this.maxY, 20, 25),
		       new Planet(this, 1/5*this.maxX, 2/5*this.maxY, 5, 10),
		       new Planet(this, 5/7*this.maxX, 4/5*this.maxY, 10, 10),
		       new Planet(this, 1/2*this.maxX, 2/3*this.maxY, 10, 20) );

    this.asteroids.push(new Asteroid(this, 1/10*this.maxX, 1/10*this.maxY, 0.1, 4, 0, 0, 0, 0 ),
			new Asteroid(this, 1/10*this.maxX, 2/10*this.maxY, 0.1, 5, 0, -0.1, 0, 0 ),
			new Asteroid(this, 5/10*this.maxX, 1/10*this.maxY, 0.1, 6, -0.2, 0.3, 0, 0 ),
			new Asteroid(this, 5/10*this.maxX, 2/10*this.maxY, 0.1, 7, -0.3, 0.2, 0, 0 ),
			new Asteroid(this, 6/10*this.maxX, 8/10*this.maxY, 0.1, 6, -0.4, 0.1, 0, 0 ),
			new Asteroid(this, 6/10*this.maxX, 9/10*this.maxY, 0.1, 7, 0.5, -0.5, 0, 0 ),
			new Asteroid(this, 9/10*this.maxX, 8/10*this.maxY, 0.1, 6, 0.6, 0.4, 0, 0 ),
			new Asteroid(this, 9/10*this.maxX, 9/10*this.maxY, 0.1, 7, 0.7, 0.6, 0, 0 ),
			new Asteroid(this, 3/10*this.maxX, 1/10*this.maxY, 0.1, 6, 0.8, -0.2, 0, 0 ),
			new Asteroid(this, 3/10*this.maxX, 2/10*this.maxY, 0.1, 7, 0.9, -0.1, 0, 0 ));

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
    var objects = [];
    objects = objects.concat(this.planets,
			     this.asteroids,
			     this.weaponsFired,
			     [this.ship]);

    this.ship.updatePositions(objects);
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

AsteroidsGame.prototype.impact = function(object1, object2) {

    // ignore attached object impacts
    if (object1.attachedTo(object2) || object2.attachedTo(object1)) {
	return;
    }

    if (object1.mass > 0 && object2.mass > 0) {
	// bounce algorithm from:
	// http://www.emanueleferonato.com/2007/08/19/managing-ball-vs-ball-collision-with-flash/
	var dX = object1.x - object2.x;
	var dY = object1.y - object2.y;
	var collision_angle = Math.atan2(dY, dX);
	var magnitude_1 = Math.sqrt(object1.vX*object1.vX + object1.vY*object1.vY) * this.elasticity;
	var magnitude_2 = Math.sqrt(object2.vX*object2.vX + object2.vY*object2.vY) * this.elasticity;

	var direction_1 = Math.atan2(object1.vY, object1.vX);
	var direction_2 = Math.atan2(object2.vY, object2.vX);
	var new_vX_1 = magnitude_1*Math.cos(direction_1-collision_angle);
	var new_vY_1 = magnitude_1*Math.sin(direction_1-collision_angle);
	var new_vX_2 = magnitude_2*Math.cos(direction_2-collision_angle);
	var new_vY_2 = magnitude_2*Math.sin(direction_2-collision_angle);
	var final_vX_1 = ((object1.mass-object2.mass)*new_vX_1+(object2.mass+object2.mass)*new_vX_2)/(object1.mass+object2.mass);
	var final_vX_2 = ((object1.mass+object1.mass)*new_vX_1+(object2.mass-object1.mass)*new_vX_2)/(object1.mass+object2.mass);
	var final_vY_1 = new_vY_1;
	var final_vY_2 = new_vY_2;

	if (! object1.is_planet) {
	    object1.vX = Math.cos(collision_angle)*final_vX_1 + Math.cos(collision_angle + PI/2)*final_vY_1;
	    object1.vY = Math.sin(collision_angle)*final_vX_1 + Math.sin(collision_angle + PI/2)*final_vY_1;
	}
	if (! object2.is_planet) {
	    object2.vX = Math.cos(collision_angle)*final_vX_2 + Math.cos(collision_angle + PI/2)*final_vY_2;
	    object2.vY = Math.sin(collision_angle)*final_vX_2 + Math.sin(collision_angle + PI/2)*final_vY_2;
	}

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


