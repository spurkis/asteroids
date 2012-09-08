/*********************************************************************
 * Asteroids Game Logic
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');
require('Ships.js');
require('Weapons.js');
require('Planets.js');

var animationFunc;    // set this global for debugging
var requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(callback) {
        window.setTimeout(callback, 20); // 50hZ
    };
var cancelAnimationFrame = window.cancelAnimationFrame
    || window.webkitCancelRequestAnimationFrame
    || window.mozCancelRequestAnimationFrame
    || window.oCancelRequestAnimationFrame
    || window.msCancelRequestAnimationFrame
    || clearTimeout;

function AsteroidsGame(ctx, level, images) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;

    // preloaded images, indexed by src
    this.images = images || {};

    this.maxAccel = 1;
    this.G = 0.1;

    this.viewOffset = {x: 0, y: 0};

    this.elasticity = 0.8;       // collision elasticity: velocity modifier
    this.attachThreshold = 0.01; // min impact speed for objects to become attached
    this.detachThreshold = 5;    // min distance before attached objects detach
    this.detachThreshold_squared = Math.pow(this.detachThreshold, 2);

    this.frames = 0;
    this.frameRate = 0;
    this.slowFrameRate = 0;
    this.timeLastFrameRateMeasured = 0;
    this.useSimpleCalcs = false;

    this.objects = [];
    this.updated = [];

    // manage timeouts in Game Time:
    this._timeoutId = 0;
    this.timeouts = [];

    // hard-code 1 player for now & start co-ords
    this.ship = new Ship(this, {});

    if (! level) level = Level0;
    this.loadLevel(new level(this));

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

AsteroidsGame.prototype.loadLevel = function(level) {
    this.level = level;

    // set background color:
    if (level.backgroundColor) {
	$(this.canvas).css('background-color', level.backgroundColor);
    }

    // load ships, setting 1st as this ship:
    this.ship = new Ship(this, level.ships[0]);
    this.addObject( this.ship );

    for (var i=1; i<level.ships.length; i++) {
	this.addObject(new ComputerShip(this, level.ships[i]));
    }

    // load planets:
    for (var i=0; i<level.planets.length; i++) {
	var args = level.planets[i];
	if (args.image_src) args.image = this.images[args.image_src];
	var planet = new Planet(this, args);
	this.addObject(planet);
    }

    // load asteroids:
    for (var i=0; i<level.asteroids.length; i++) {
	var args = level.asteroids[i];
	if (args.image_src) args.image = this.images[args.image_src];
	this.addObject(new Asteroid(this, args));
    }
}

AsteroidsGame.prototype.startGameLoop = function() {
    if (this.animationTimeoutId) {
	console.log("startGameLoop aborted: already started with id=" +
		    this.animationTimeoutId );
	return;
    }

    // draw current game state
    this.redrawCanvas();

    var self = this;
    animationFunc = function(lastCalled){    // set this global for debugging
	if (self.stopping) {
	    self.drawGameOver();
	    console.log( "animation loop stopped" );
	    return;
	}
	self.animationTimeoutId = requestAnimationFrame(animationFunc);
//	try {
	    self.updateAndDraw();
//	} catch (e) {
//	    console.log("Animation Loop: caught exception " + e);
//            self.stopGame();
//	}
    };

    console.log("starting animation loop");
    self.animationTimeoutId = requestAnimationFrame(animationFunc);
}

AsteroidsGame.prototype.stopGame = function() {
    this.stopping = true;
    console.log( "stopping animation loop" );
}

AsteroidsGame.prototype.killGame = function() {
    this.stopping = true;
    console.log( "killing animation loop" );
    if (this.animationTimeoutId) {
	cancelAnimationFrame(this.animationTimeoutId);
	delete this.animationTimeoutId;
    }
}

AsteroidsGame.prototype.updateAndDraw = function() {
    this.checkTimeouts();

    this.updated = [];
    this.updatePositions();

    this.updateViewOffset();

    this.redrawCanvas();
    /* TODO: only draw updates
    if (this.updated.length > 50) {
	this.redrawCanvas();
    } else if (this.updated.length > 0) {
	this.redrawUpdated();
    }
    // don't redraw if there were no updates!
    */

    this.frames++;
    this.measureFrameRate();
}

AsteroidsGame.prototype.measureFrameRate = function() {
    this.now = Date.now(); // ms
    if (this.timeLastFrameRateMeasured) {
	var dt = this.now - this.timeLastFrameRateMeasured;
	if (dt < 1000) return;
	this.frameRate = 1000 * this.frames / dt;
	this.frames = 0;
	//console.log( "frame rate: " + this.frameRate.toFixed(3) );
	if (this.frameRate < 45 && ! this.useSimpleCalcs) {
	    this.slowFrameRate++;
	    if (this.slowFrameRate > 5) {
		this.useSimpleCalcs = true;
		console.log("switching on simple calculations: slow Frame Rate");
	    }
	}
    }
    this.timeLastFrameRateMeasured = this.now;
}

AsteroidsGame.prototype.updateViewOffset = function() {
    var canvas = this.ctx.canvas;
    var offset = this.viewOffset;
    var dX = Math.round(this.ship.x - offset.x - canvas.width/2);
    var dY = Math.round(this.ship.y - offset.y - canvas.height/2);

    // keep the ship centered in the current view, but don't let the view
    // go out of bounds
    offset.x += dX;
    if (offset.x < 0) offset.x = 0;
    if (offset.x > this.level.maxX-canvas.width) offset.x = this.level.maxX-canvas.width;

    offset.y += dY;
    if (offset.y < 0) offset.y = 0;
    if (offset.y > this.level.maxY-canvas.height) offset.y = this.level.maxY-canvas.height;
}

AsteroidsGame.prototype.redrawCanvas = function() {
    // clear entire canvas: not good for performance, but good enough for now
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // shift view to compensate for current offset
    var offset = this.viewOffset;
    ctx.save();
    ctx.translate(-offset.x, -offset.y);

    for (var i=0; i < this.objects.length; i++) {
	var object = this.objects[i];
	if (object.shouldDraw(offset)) object.draw(offset);
	object.resetBeforeUpdate();
    }

    ctx.restore();
};

AsteroidsGame.prototype.redrawUpdated = function() {
    for (var i=0; i < this.updated.length; i++) {
	var object = this.updated[i];
	object.draw();
	object.resetBeforeUpdate();
    }
}

AsteroidsGame.prototype.drawGameOver = function() {
    this.redrawCanvas();

    var ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.font = "20px Verdana";
    ctx.fillStyle = "rgba(50,50,50,0.9)";
    ctx.fillText("Game Over", this.canvas.width/2 - 50, this.canvas.height/2);
    ctx.restore();
}

AsteroidsGame.prototype.updatePositions = function() {
    var objects = this.objects.slice(); // create a copy, it may change!

    // note that we don't apply any updates until we've processed all objects
    for (var i=0; i < objects.length; i++) {
	var object1 = objects[i];

	// may have changed below
	if (object1.update == false) continue;
	this.applyOutOfBounds(object1);

	// we update both i & j below, so to avoid repeating calcs
	// we start j at the next position:
	for (var j=i+1; j < objects.length; j++) {
	    var object2 = objects[j];
	    if (object1.update == false) break; // may have changed below
	    if (object2.update == false) continue;

	    // don't apply physics to a ship & it's weapons:
	    if (object2.ship == object1 || object1.ship == object2) continue;

	    this.applyGamePhysicsTo( object1, object2 );
	}

	// don't check for object death: may want to undraw itself?
	if (object1.updatePositions()) {
	    this.objectUpdated( object1 );
	}
    }
};


AsteroidsGame.prototype.applyOutOfBounds = function(object) {
    if (object.stationary) return;

    var level = this.level;
    var die_if_out_of_bounds = !(object.is_ship || object.is_planet);

    if (object.x < 0) {
	if (level.wrapX) {
	    object.setX(level.maxX + object.x);
	} else {
	    if (die_if_out_of_bounds && object.vX < 0) {
		return object.die();
	    }
	    object.updateVelocity(0.1, 0);
	}
    } else if (object.x > level.maxX) {
	if (level.wrapX) {
	    object.setX(object.x - level.maxX);
	} else {
	    if (die_if_out_of_bounds && object.vX > 0) {
		return object.die();
	    }
	    object.updateVelocity(-0.1, 0);
	}
    }

    if (object.y < 0) {
	if (level.wrapY) {
	    object.setY(level.maxY + object.y);
	} else {
	    if (die_if_out_of_bounds && object.vY < 0) {
		return object.die();
	    }
	    // push back into bounds
	    object.updateVelocity(0, 0.1);
	}
    } else if (object.y > level.maxY) {
	if (level.wrapY) {
	    object.setY(object.y - level.maxY);
	} else {
	    if (die_if_out_of_bounds && object.vY > 0) {
		return object.die();
	    }
	    // push back into bounds
	    object.updateVelocity(0, -0.1);
	}
    }
}

/***
 * applies game physics to *both* objects, ie:
 *     gravity
 *     collision detection & handling - see also collision()
 *     object attachment
 */
AsteroidsGame.prototype.applyGamePhysicsTo = function(object1, object2) {
    var cache1 = object1.cache[object2.id];
    var cache2 = object2.cache[object1.id];
    if (cache1 == null) throw "missing cache for " + object1;
    if (cache2 == null) throw "missing cache for " + object2;

    var dX = object1.x - object2.x;
    var dY = object1.y - object2.y;
    if (this.useSimpleCalcs) {
	// Hack & round for performance:
	dX = (0.5 + dX) | 0;
	dY = (0.5 + dY) | 0;
    }

    // find dist between center of mass:
    var dist_squared = dX*dX + dY*dY; // avoid sqrt, we don't need dist yet

    var physics = {
	dX: dX,
	dY: dY,
	dist_squared: dist_squared,
	total_radius: cache1.total_radius,
	total_radius_squared: cache1.total_radius_squared,
	cache1: cache1,
	cache2: cache2
    };

    // now check if they're touching:
    if (dist_squared > cache1.total_radius_squared) {
	if (object1.collidingWith(object2)) {
	    object1.stopCollidingWith(object2);
	    object2.stopCollidingWith(object1);
	}

	if (object1.attachedTo(object2)) {
	    if (this.maybeDetachObjects(object1, object2, physics)) {
		return; // don't appy any acceleration from detaching objects
	    }
	}

	this.applyGravity(object1, object2, physics);
    } else {
	if (object1.collidingWith(object2)) {
	    // push away objects to keep them from overlapping
	    this.applyPushAway(object1, object2, physics);
	} else if (object1.attachedTo(object2)) {
	    // push away objects to keep them from overlapping
	    this.applyPushAway(object1, object2, physics);
	} else {
	    // so close they've collided:
	    this.collision( object1, object2, physics );
	}
    }
}

AsteroidsGame.prototype.applyGravity = function(object1, object2, physics) {
    /****
     * Apply gravity effect from object2 <--> object1:
     *   F1 = G*m1*m2/r^2
     *   a1 = F/m1 = G*m2/r^2
     */

    // see if we can use cached values first:
    var g_cache1 = physics.cache1.last_G;
    var g_cache2 = physics.cache2.last_G;

    if (g_cache1) {
	var delta_dist_sq = Math.abs( physics.dist_squared - g_cache1.last_dist_squared);
	var percent_diff = delta_dist_sq / physics.dist_squared;
	// set threshold @ 5%
	if (percent_diff < 0.05) {
	    // we haven't moved much, use last G values
	    //console.log("using G cache");
	    object1.delayUpdateVelocity(g_cache1.dvX, g_cache1.dvY);
	    object2.delayUpdateVelocity(g_cache2.dvX, g_cache2.dvY);
            return;
	}
    }

    var dvX_1 = 0, dvY_1 = 0;
    if (! object1.stationary) {
	var accel_1 = object2.cache.G_x_mass / physics.dist_squared;
	if (accel_1 > 1e-5) { // skip if it's too small to notice
	    if (accel_1 > this.maxAccel) accel_1 = this.maxAccel;
	    var angle_1 = Math.atan2(physics.dX, physics.dY);
	    dvX_1 = -Math.sin(angle_1) * accel_1;
	    dvY_1 = -Math.cos(angle_1) * accel_1;
	    object1.delayUpdateVelocity(dvX_1, dvY_1);
	}
    }
    physics.cache1.last_G = {
	dvX: dvX_1,
	dvY: dvY_1,
	last_dist_squared: physics.dist_squared
    };

    var dvX_2 = 0, dvY_2 = 0;
    if (! object2.stationary) {
	var accel_2 = object1.cache.G_x_mass / physics.dist_squared;
	if (accel_2 > 1e-5) { // skip if it's too small to notice
	    if (accel_2 > this.maxAccel) accel_2 = this.maxAccel;
	    // TODO: angle_2 = angle_1 - PI?
	    var angle_2 = Math.atan2(-physics.dX, -physics.dY); // note the - signs
	    dvX_2 = -Math.sin(angle_2) * accel_2;
	    dvY_2 = -Math.cos(angle_2) * accel_2;
	    object2.delayUpdateVelocity(dvX_2, dvY_2);
	}
    }
    physics.cache2.last_G = {
	dvX: dvX_2,
	dvY: dvY_2,
	last_dist_squared: physics.dist_squared
    };
}

AsteroidsGame.prototype.applyPushAway = function(object1, object2, physics) {
    // return; // watch what happens if you don't apply push!
    // make how much they get pushed relative to their mass
    var dist = Math.sqrt(physics.dist_squared); // dist between center of mass
    var delta = Math.abs(dist - physics.cache1.total_radius);

    // don't bother if it's small
    if (delta < 1) return;

    if (! object1.stationary) {
	var accel_1 = delta / object1.mass;
	if (accel_1 > this.maxAccel) accel_1 = this.maxAccel;
	var angle_1 = Math.atan2(physics.dY, physics.dX);
	var dX_1 = Math.cos(angle_1) * accel_1;
	var dY_1 = Math.sin(angle_1) * accel_1;
	object1.delayUpdateVelocity(dX_1, dY_1);
    }

    if (! object2.stationary) {
	var accel_2 = delta / object2.mass;
	if (accel_2 > this.maxAccel) accel_2 = this.maxAccel;
	var angle_2 = Math.atan2(-physics.dY, -physics.dX);
	var dX_2 = Math.cos(angle_2) * accel_2;
	var dY_2 = Math.sin(angle_2) * accel_2;
	object2.delayUpdateVelocity(dX_2, dY_2);
    }
}

AsteroidsGame.prototype.collision = function(object1, object2, collision) {
    // ignore attached object collisions
    if (object1.attachedTo(object2) || object2.attachedTo(object1)) {
	return;
    }

    // for ease of reading
    var cache1 = collision.cache1;
    var cache2 = collision.cache2;

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

	if (collision.impactSpeed < this.attachThreshold
	    && object1.is_planetoid && object2.is_planetoid) {
	    //console.log('linking '+ object1 + ' <-> '+ object2);
	    object1.attach(object2);
	    object2.attach(object1);
	    return;
	}

	// bounce the objects:
	var final_vX_1 = ( (cache1.delta_mass * new_vX_1 + object2.cache.mass_x_2 * new_vX_2)
			   / cache1.total_mass * this.elasticity );
	var final_vX_2 = ( (object1.cache.mass_x_2 * new_vX_1 + cache2.delta_mass * new_vX_2)
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
    //console.log('adding ' + object);
    this.objects.push( object );
    this.objectUpdated( object );
    object.preRender();
    this.cachePhysicsFor(object);
}

AsteroidsGame.prototype.removeObject = function(object) {
    var objects = this.objects;
    var i = objects.indexOf(object);
    if (i >= 0) {
	objects.splice(i,1);
	this.objectUpdated( object );
    }

    // avoid memory bloat: remove references to this object
    // from other objects' caches:
    var oid = object.id;
    for (var i=0; i < objects.length; i++) {
	delete objects[i].cache[oid];
    }
}

AsteroidsGame.prototype.objectDied = function(object) {
    // if (object.is_weapon) {
    //} else if (object.is_asteroid) {
    if (object.is_planet) {
	throw "planet died!?"; // not allowed
    } else if (object.is_ship) {
	// TODO: check how many lives they've got
	if (object == this.ship) {
	    this.stopGame();
	}
    }

    this.removeObject(object);
}

// call when an object was updated & should be redrawn
AsteroidsGame.prototype.objectUpdated = function(object) {
    var updated = this.updated;
    var i = updated.indexOf(object);
    if (i >= 0) return; // already on the list
    updated.push( object );
}



AsteroidsGame.prototype.fireWeapon = function(weapon) {
    var self = this;
    weapon.timeoutId = setTimeout(function(){
	self.weaponTimeout(weapon);
    }, weapon.ttl);
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
    case 73: // i = up
    case 38: // up = accel
	if (event.type == 'keydown') {
	    this.ship.startAccelerate();
	} else { // assume keyup
	    this.ship.stopAccelerate();
	}
	event.preventDefault();
	break;
    case 75: // k = down
    case 40: // down = decel
	if (event.type == 'keydown') {
	    this.ship.startDecelerate();
	} else { // assume keyup
	    this.ship.stopDecelerate();
	}
	event.preventDefault();
	break;
    case 74: // j = left
    case 37: // left = accel ccw
	if (event.type == 'keydown') {
	    this.ship.startDecreaseSpin();
	} else { // assume keyup
	    this.ship.stopDecreaseSpin();
	}
	event.preventDefault();
	break;
    case 76: // l = right
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


    case 87: // w = change weapon
	if (event.type == 'keydown') {
	    this.ship.startCycleWeapon();
	} else { // assume keyup
	    this.ship.stopCycleWeapon();
	}
	event.preventDefault();
	break;

    case 13:  // <enter>
	event.preventDefault();
	break;
    }
}

/**
 * setTimeout using Game time for performance
 */
AsteroidsGame.prototype.setTimeout = function(callback, dt) {
    var now = this.now || Date.now();
    var timeout = {
	id: this._timeoutId++,
	time: now + dt,
	callback: callback
    };
    //console.log("create timeout "+timeout.id+": " + timeout.time + " <=> " +now);
    this.timeouts.push(timeout);
}

AsteroidsGame.prototype.clearTimeout = function(id) {
    for (var i=0; i <= this.timeouts.length; i++) {
	if (this.timeouts[i].id == id) {
            this.timeouts.splice(i, 1);
            return true;
	}
    }
    return false;
}

AsteroidsGame.prototype.checkTimeouts = function() {
    var now = this.now || Date.now();
    var keepTimeouts = []; // new list of timeouts
    for (var i=0; i < this.timeouts.length; i++) {
	var timeout = this.timeouts[i];
	//console.log("test timeout "+timeout.id+": " + timeout.time + " <=> " +now);
	if (timeout.time <= now) {
            timeout.callback();
	} else {
            keepTimeouts.push(timeout);
	}
    }
}

AsteroidsGame.prototype.checkTimeouts = function() {
    var now = this.now || Date.now();
    var keepTimeouts = []; // new list of timeouts
    for (var i=0; i < this.timeouts.length; i++) {
	var timeout = this.timeouts[i];
	//console.log("test timeout "+timeout.id+": " + timeout.time + " <=> " +now);
	if (timeout.time <= now) {
            timeout.callback();
	} else {
            keepTimeouts.push(timeout);
	}
    }

    this.timeouts = keepTimeouts;
}
