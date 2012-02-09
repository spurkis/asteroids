/*********************************************************************
 * Asteroids Game Logic
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');
require('Ships.js');
require('Weapons.js');
require('Planets.js');

function AsteroidsGame(ctx, img) {
    this.ctx = ctx;

    this.asteroidImg = img;
    this.updateRate = 10; // ms
    this.refreshRate = 20; // ms
    this.maxX = ctx.canvas.width;
    this.maxY = ctx.canvas.height;
    this.maxAccel = 1;
    this.G = 0.1;

    this.elasticity = 0.8;       // collision elasticity: velocity modifier
    this.attachThreshold = 0.01; // min impact speed for objects to become attached
    this.detachThreshold = 5;    // min distance before attached objects detach
    this.detachThreshold_squared = Math.pow(this.detachThreshold, 2);

    this.objects = [];

    // hard-code 1 player for now & start co-ords
    this.ship = new Ship(this, {x: 1/5*this.maxX, y: 2/3*this.maxY});

    this.addObject( this.ship );

    this.addObjects([
//	new Planet(this, {x: 3/4*this.maxX, y: 1/4*this.maxY, mass: 195, radius: 45, vX: -0.5, vY: 0}) ,
//	new Planet(this, {x: 1/5*this.maxX, y: 2/5*this.maxY, mass: 15, radius: 15, vX: -0.5, vY: 0.5}) ,
//	new Planet(this, {x: 5/7*this.maxX, y: 4/5*this.maxY, mass: 30, radius: 20}),
	new Planet(this, {x: 1/2*this.maxX-60, y: 1/2*this.maxY, mass: 15, radius: 15, vY: 0.5}),
	new Planet(this, {x: 1/2*this.maxX, y: 1/2*this.maxY, mass: 120, radius: 30, stationary: true})
    ]);

    for (var i=0; i<this.maxX; i+= 95) {
	for (var j=0; j<this.maxY; j+= 95) {
	    var a = new Asteroid(this, {
		x: i + getRandomInt(0, 10),
		y: j + getRandomInt(0, 10),
		mass: getRandomInt(1, 3),
		radius: getRandomInt(3, 10),
		vX: Math.random(),
		vY: Math.random(),
	    });
	    // vary the velocities:
	    if (i%200) a.vX = -a.vX;
	    if (j%200) a.vY = -a.vY;
	    this.addObject(a);
	}
    }

    /*
    this.addObjects([
//	new Asteroid(this, {x: 1/10*this.maxX, y: 1/10*this.maxY, mass: 0.5, radius: 4, vX: 0, vY: 0 }),
//        new Asteroid(this, {x: 1/10*this.maxX, y: 2/10*this.maxY, mass: 1, radius: 5, vX: 0, vY: -0.1 }),
        new Asteroid(this, {x: 5/10*this.maxX, y: 1/10*this.maxY, mass: 2, radius: 6, vX: -0.2, vY: 0.25 }),
        new Asteroid(this, {x: 5/10*this.maxX, y: 2/10*this.maxY, mass: 3, radius: 8, vX: -0.22, vY: 0.2 }),
        new Asteroid(this, {x: 6/10*this.maxX, y: 8/10*this.maxY, mass: 2, radius: 6, vX: -0.4, vY: 0.1 }),
        new Asteroid(this, {x: 6/10*this.maxX, y: 9/10*this.maxY, mass: 3, radius: 8, vX: 0.5, vY: -0.5 }),
        new Asteroid(this, {x: 9/10*this.maxX, y: 8/10*this.maxY, mass: 2, radius: 6, vX: 0.6, vY: 0.4 }),
        new Asteroid(this, {x: 9/10*this.maxX, y: 9/10*this.maxY, mass: 3, radius: 8, vX: 0.7, vY: 0.6 }),
        new Asteroid(this, {x: 3/10*this.maxX, y: 1/10*this.maxY, mass: 2, radius: 6, vX: 0.8, vY: -0.2 }),
        new Asteroid(this, {x: 3/10*this.maxX, y: 2/10*this.maxY, mass: 3, radius: 8, vX: 0.9, vY: -0.1 })
    ]);
*/

    this.setDefaultCanvasState();
    this.bindDefaultKeys();
}

AsteroidsGame.prototype.setDefaultCanvasState = function() {
    var ctx = this.ctx;
    // set & save default canvas state
    //ctx.globalCompositeOperation = 'source-over';
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
    }, this.updateRate);

    if (window.requestAnimationFrame) {
	this.drawAnimationFrameId = requestAnimationFrame(function(){ self.draw() });
    } else {
	this.drawIntervalId = setInterval(function(){
	    self.draw();
	}, this.refreshRate);
    }
}

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

    if (this.drawAnimationFrameId) {
	cancelRequestAnimationFrame(this.drawAnimationFrameId);
	delete this.drawAnimationFrameId;
	console.log( "stopped draw animation frame" );
    }

    this.drawGameOver();
}

AsteroidsGame.prototype.draw = function() {
    // clear entire canvas: not good for performance, but good enough for now
    this.ctx.clearRect(0,0, this.maxX,this.maxY);
    for (var i=0; i < this.objects.length; i++) {
	this.objects[i].draw();
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
    var objects = this.objects;

    // note that we don't apply any updates until we've processed all objects
    for (var i=0; i < objects.length; i++) {
	var object1 = objects[i];
	// we update both i & j below, so to avoid repeating calcs
	// we start j at the next position:
	for (var j=i+1; j < objects.length; j++) {
	    var object2 = objects[j];

	    if (object2 == object1) continue; // paranoia
	    if (object2.ship == object1 || object1.ship == object2) continue;
	    if (! object1.update || ! object2.update) continue;

	    this.applyGamePhysicsTo( object1, object2 );
	}

	object1.updatePositions();
    } // for obj1
};


/***
 * applies game physics to *both* objects, ie:
 *     gravity
 *     collision detection & handling - see also collision()
 *     object attachment
 */
AsteroidsGame.prototype.applyGamePhysicsTo = function(object1, object2) {
    if (object2.mass <= 0) return;
    var physics = {};

    var cache1 = object1.cache[object2.id];
    var cache2 = object2.cache[object1.id];

    var dX = object1.x - object2.x;
    var dY = object1.y - object2.y;
    var dist_squared = dX*dX + dY*dY; // avoid sqrt, we don't need magnitude
    // var dist = sqrt(pow(x2-x1, 2) + pow(y2-y1, 2)); // slow

    // now check if they're touching:
    if (dist_squared > cache1.total_radius_squared) {
	if (object1.collidingWith(object2)) {
	    object1.stopCollidingWith(object2);
	    object2.stopCollidingWith(object1);
	}

	if (object1.attachedTo(object2)) {
	    // don't appy any acceleration from attached objects
	    // that may be detaching...
	    var physics = {
		dX: dX,
		dY: dY,
		dist_squared: dist_squared,
		total_radius: cache1.total_radius,
		total_radius_squared: cache1.total_radius_squared
	    };
	    if (this.maybeDetachObjects(object1, object2, physics)) {
		return;
	    }
	}

	/****
	 * Apply gravity effect from object2 --> object1:
	 *   F1 = G*m1*m2/r^2
	 *   a1 = F/m1 = G*m2/r^2
	 */
	var accel_1 = object2.cache.G_x_mass / dist_squared;
	if (accel_1 > this.maxAccel) accel_1 = this.maxAccel;
	var angle_1 = Math.atan2(dX, dY);
	var dX_1 = -Math.sin(angle_1) * accel_1;
	var dY_1 = -Math.cos(angle_1) * accel_1;

	var accel_2 = object1.cache.G_x_mass / dist_squared;
	if (accel_2 > this.maxAccel) accel_2 = this.maxAccel;
	// TODO: angle_2 = angle_1 - PI?
	var angle_2 = Math.atan2(-dX, -dY); // note the - signs
	var dX_2 = -Math.sin(angle_2) * accel_2;
	var dY_2 = -Math.cos(angle_2) * accel_2;

	object1.delayUpdateVelocity(dX_1, dY_1);
	object2.delayUpdateVelocity(dX_2, dY_2);
    } else {
	if (object1.collidingWith(object2)) {
	    // appy some negative acceleration from attached / colliding objects
	    var accel_1 = object2.cache.G_x_mass / dist_squared;
	    if (accel_1 > this.maxAccel) accel_1 = this.maxAccel;
	    var angle_1 = Math.atan2(dX, dY);
	    var dX_1 = Math.sin(angle_1) * accel_1; // inverted
	    var dY_1 = Math.cos(angle_1) * accel_1; // inverted

	    var accel_2 = object1.cache.G_x_mass / dist_squared;
	    if (accel_2 > this.maxAccel) accel_2 = this.maxAccel;
	    // TODO: angle_2 = angle_1 - PI?
	    var angle_2 = Math.atan2(-dX, -dY); // note the - signs
	    var dX_2 = Math.sin(angle_2) * accel_2; // inverted
	    var dY_2 = Math.cos(angle_2) * accel_2; // inverted

	    object1.delayUpdateVelocity(dX_1, dY_1);
	    object2.delayUpdateVelocity(dX_2, dY_2);
	} else if (object1.attachedTo(object2)) {
	    // push away objects to keep them from overlapping
	    // make how much they get pushed relative to their mass
	    var dist = Math.sqrt(dist_squared);
	    var delta = Math.abs(dist - cache1.total_radius);

	    // don't bother if it's small
	    if (delta > 1) {
		var accel_1 = delta / object1.mass;
		if (accel_1 > this.maxAccel) accel_1 = this.maxAccel;
		var angle_1 = Math.atan2(dY, dX);
		var dX_1 = Math.cos(angle_1) * accel_1;
		var dY_1 = Math.sin(angle_1) * accel_1;

		var accel_2 = delta / object2.mass;
		if (accel_2 > this.maxAccel) accel_2 = this.maxAccel;
		var angle_2 = Math.atan2(-dY, -dX);
		var dX_2 = Math.cos(angle_2) * accel_2;
		var dY_2 = Math.sin(angle_2) * accel_2;
		
		object1.delayUpdateVelocity(dX_1, dY_1);
		object2.delayUpdateVelocity(dX_2, dY_2);
	    }
	} else {
	    var physics = {
		dX: dX,
		dY: dY,
		dist_squared: dist_squared,
		total_radius: cache1.total_radius,
		total_radius_squared: cache1.total_radius_squared
	    };
	    // so close they've collided:
	    this.collision( object1, object2, physics );
	}
    }
}

AsteroidsGame.prototype.collision = function(object1, object2, collision) {
    // ignore attached object collisions
    if (object1.attachedTo(object2) || object2.attachedTo(object1)) {
	return;
    }

    var cache1 = object1.cache[object2.id];
    var cache2 = object2.cache[object1.id];

    // console.log(object1.id + ' <=> ' + object2.id + ' collided');

    if (object1.mass && object2.mass) {
	// Thanks Emanuelle!  bounce algorithm adapted from:
	// http://www.emanueleferonato.com/2007/08/19/managing-ball-vs-ball-collision-with-flash/
	collision.angle = Math.atan2(collision.dY, collision.dX);
	var magnitude_1 = Math.sqrt(object1.vX*object1.vX + object1.vY*object1.vY);
	var magnitude_2 = Math.sqrt(object2.vX*object2.vX + object2.vY*object2.vY);

	var direction_1 = Math.atan2(object1.vY, object1.vX);
	var direction_2 = Math.atan2(object2.vY, object2.vX);

	var new_vX_1 = magnitude_1*Math.cos(direction_1-collision.angle);
	var new_vY_1 = magnitude_1*Math.sin(direction_1-collision.angle);
	var new_vX_2 = magnitude_2*Math.cos(direction_2-collision.angle);
	var new_vY_2 = magnitude_2*Math.sin(direction_2-collision.angle);

	// before we continue: should we attach the objects?
	collision.impactSpeed = Math.abs(new_vX_2 - new_vX_1);

	if (collision.impactSpeed < this.attachThreshold) {
	    // console.log('linking '+ object1 + ' <-> '+ object2);
	    object1.attach(object2);
	    object2.attach(object1);
	    return;
	}

	// bounce the objects:
	var final_vX_1 = ( (cache1.delta_mass * new_vX_1 + object2.cache.mass_x_2 * new_vX_2)
			   / cache1.total_mass * this.elasticity );
	var final_vX_2 = ( (object2.cache.mass_x_2 * new_vX_1 + cache2.delta_mass * new_vX_2)
			   / cache2.total_mass * this.elasticity );
	var final_vY_1 = new_vY_1 * this.elasticity;
	var final_vY_2 = new_vY_2 * this.elasticity;


	var cos_collision_angle = Math.cos(collision.angle);
	var sin_collision_angle = Math.sin(collision.angle);
	var cos_collision_angle_halfPI = Math.cos(collision.angle + halfPI);
	var sin_collision_angle_halfPI = Math.sin(collision.angle + halfPI);

	var vX1 = cos_collision_angle*final_vX_1 + cos_collision_angle_halfPI*final_vY_1;
	var vY1 = sin_collision_angle*final_vX_1 + sin_collision_angle_halfPI*final_vY_1;
	object1.delaySetVelocity(vX1, vY1);

	var vX2 = cos_collision_angle*final_vX_2 + cos_collision_angle_halfPI*final_vY_2;
	var vY2 = sin_collision_angle*final_vX_2 + sin_collision_angle_halfPI*final_vY_2;
	object2.delaySetVelocity(vX2, vY2);


	collision[object1.id] = {
	    cplane: {vX: new_vX_1, vY: new_vY_1}, // relative to collision plane
	    dX: collision.dX,
	    dY: collision.dY,
	    magnitude: magnitude_1
	}
	collision[object2.id] = {
	    cplane: {vX: new_vX_2, vY: new_vY_2}, // relative to collision plane
	    dX: -collision.dX, // flip signs: from obj2's perspective
	    dY: -collision.dY,
	    magnitude: magnitude_2
	}

	// console.log(object1.id + ' <=> ' + object2.id + ' collided @ ' + collision.impactSpeed);
    }

    object1.collided(object2, collision);
    object2.collided(object1, collision);
}

AsteroidsGame.prototype.maybeDetachObjects = function(object1, object2, physics) {
    // we got here because dist_squared > total_radius_squared
    // figure out how much, & if it's > detach threshold
    var dist = Math.sqrt(physics.dist_squared) - physics.total_radius;
    if (dist > this.detachThreshold) {
	// console.log('unlinking '+ object1 + ' <-> '+ object2);
	object1.detach(object2);
	object2.detach(object1);
	return true;
    }
    return false;
}

// put any calculations we can avoid repeating here
AsteroidsGame.prototype.cachePhysicsFor = function(object1) {
    for (var i=0; i < this.objects.length; i++) {
	var object2 = this.objects[i];
	if (object1 == object2) continue;

	// shared calcs
	var total_radius = object1.radius + object2.radius;
	var total_radius_squared = Math.pow(total_radius, 2);
	var total_mass = object1.mass + object2.mass;

	// create separate caches from perspective of objects:
	object1.cache[object2.id] = {
	    total_radius: total_radius,
	    total_radius_squared: total_radius_squared,
	    total_mass: total_mass,
	    delta_mass: object1.mass - object2.mass
	}

	object2.cache[object1.id] = {
	    total_radius: total_radius,
	    total_radius_squared: total_radius_squared,
	    total_mass: total_mass,
	    delta_mass: object2.mass - object1.mass
	}

    }
}

AsteroidsGame.prototype.addObjects = function(objects) {
    for (var i=0; i < objects.length; i++) {
	this.addObject(objects[i]);
    }
}

AsteroidsGame.prototype.addObject = function(object) {
    this.objects.push( object );
    this.cachePhysicsFor(object);
}

AsteroidsGame.prototype.removeObject = function(object) {
    var i = this.objects.indexOf(object);
    if (i >= 0) this.objects.splice(i,1);
    // TODO: setTimeout( rm object from other objects' cache );
}

AsteroidsGame.prototype.objectDied = function(object) {
    if (object.is_asteroid) {
	// TODO: spawn new asteroids?
    } else if (object.is_planet) {
	// not allowed?
	throw "planet died!?";
    } else if (object.is_ship) {
	throw "Game Over!";
    }

    this.removeObject(object);
}


AsteroidsGame.prototype.fireWeapon = function(weapon) {
    var self = this;
    weapon.timeoutId = setTimeout(function(){
	self.weaponTimeout(weapon);
    }, weapon.ttl);
    // this.weaponsFired.push(weapon);
    this.addObject(weapon);
}

AsteroidsGame.prototype.weaponTimeout = function(weapon) {
    // note: weapons are only removed when they call die()
    weapon.weaponTimeout();
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


