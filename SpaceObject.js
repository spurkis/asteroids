/*********************************************************************
 * SpaceObject - base class, where some of the game physics happens
 * Copyright (c) 2012 Steve Purkis
 *
 * var o = new SpaceObject( game, spatial );
 */

require('asteroidUtils.js');

var _spaceObjectId = 0; // OID: use a counter for now...

function SpaceObject(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

SpaceObject.prototype.preRender = function() {
    ; // override me
}

SpaceObject.prototype.createPreRenderCanvas = function(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    return render = {
	canvas: canvas,
	ctx: ctx,
    };
}

SpaceObject.prototype.shouldDraw = function(offset) {
    var dX = this.x+this.radius - offset.x;
    var dY = this.y+this.radius - offset.y;
    if (dX < 0 || dY < 0) return false;
    return true;
}

SpaceObject.prototype.draw = function(offset) {
    throw this.constructor.toString() + ".draw not overriden";
    // all objects should set:
    this.x_last = this.x;
    this.y_last = this.y;
};

SpaceObject.prototype.redraw = function() {
    throw this.constructor.toString() + ".redraw not overriden";
    // all objects should set:
    this.x_last = this.x;
    this.y_last = this.y;
};

SpaceObject.prototype.initialize = function(game, spatial) {
    // if (spatial == null) spatial = {};

    this.game = game;
    this.ctx = game.ctx; // canvas context
    this.id = this.createObjectId();

    this.health = spatial.health || 100;      // health as a percentage
    this.healthChanged = false;
    this.damage = spatial.damage || 0;        // damage on impact

    // call updateX/Y to set on-screen coords
    this.x = 0; this.updateX(spatial.x);      // starting position on x axis
    this.y = 0; this.updateY(spatial.y);      // starting position on y axis

    this.image = spatial.image;		      // image used to draw object

    this.stationary = spatial.stationary == null // should this object move?
	? false
	: spatial.stationary;
    this.vX = spatial.vX || 0;                // speed along X axis
    this.vY = spatial.vY || 0;                // speed along Y axis
    this.maxV = spatial.maxV || 2;            // max velocity
    this.maxVSquared = this.maxV*this.maxV;   // cache for speed

    this.mass = spatial.mass || 0;            // mass of object
    this.radius = spatial.radius || 1;        // radius of object
    this.radiusSquared = Math.pow(this.radius,2); // cache for speed


    this.thrust = spatial.initialThrust || 0; // thrust along facing
    this.maxThrust = spatial.maxThrust || 0.5;
    this.thrustChanged = false;

    this.facing = spatial.facing || 0;        // currently facing angle (rad)
    this.spin = spatial.spin || 0;            // spin in Rad/sec
    this.maxSpin = deg_to_rad[10];            // max spin

    this.attached = [];                       // objects this is attached to
    this.colliding = [];                      // objects this is colliding with

    this.update = true;

    // Cache of commonly used calculations for performance
    this.cache = {
	G_x_mass: this.game.G * this.mass,
	mass_x_2: 2 * this.mass
    };

    return this;
}

SpaceObject.prototype.createObjectId = function() {
    var prefix = this.oid_prefix || 'obj';
    return prefix + _spaceObjectId++;
}

/**
 * returns true if this object has changed & needs re-drawing
 */
SpaceObject.prototype.updatePositions = function(objects) {
    if (! this.update) return false;

    var changed = false;
    this.applyDelayedUpdates();

    if (this.updateFacing(this.spin)) changed = true;
    if (this.updateX(this.vX)) changed = true;
    if (this.updateY(this.vY)) changed = true;

    return changed;
}


/**
 * hook to reset or save any state before update is called
 */
SpaceObject.prototype.resetBeforeUpdate = function() {
    // reset changes from last update:
    this.healthChanged = false;
    this.thrustChanged = false;
}

/***
 * updateease x & y coords, and return:
 *    true if the on-screen coords have changed
 *    false if they're the same
 */
SpaceObject.prototype.updateX = function(dX) {
    if (this.stationary) return false;
    if (dX == 0) return false;

    this.x += dX;

    // TODO: incremental draws
    //would this movement be visible?
    //if (Math.abs(this.x_last - this.x) < 0.1) return false;
    return true;
}

SpaceObject.prototype.setX = function(x) {
    if (this.stationary) return false;
    this.x = x;
}

SpaceObject.prototype.updateY = function(dY) {
    if (this.stationary) return false;
    if (dY == 0) return false;

    this.y += dY;

    // TODO: incremental draws
    // would this movement be visible?
    //if (Math.abs(this.y_last - this.y) < 0.1) return false;
    return true;
}

SpaceObject.prototype.setY = function(y) {
    if (this.stationary) return false;
    this.y = y;
}

SpaceObject.prototype.updateFacing = function(delta) {
    if (delta == 0) return false;

    this.facing += delta;

    if (this.facing >= deg_to_rad[360] || this.facing <= deg_to_rad[360]) {
	this.facing = this.facing % deg_to_rad[360];
    }

    if (this.facing < 0) {
	this.facing = deg_to_rad[360] + this.facing;
    }

    return true;
}

// called before we update velocity
SpaceObject.prototype.delayUpdateVelocity = function(dvX, dvY) {
    if (this._updates == null) this.init_updates();
    this._updates.dvX += dvX;
    this._updates.dvY += dvY;
}

SpaceObject.prototype.delaySetVelocity = function(vX, vY) {
    if (this._updates == null) this.init_updates();
    this._updates.set.push({vX: vX, vY: vY});
}

SpaceObject.prototype.init_updates = function() {
    this._updates = {dvX: 0, dvY: 0, set: []};
}

SpaceObject.prototype.applyDelayedUpdates = function() {
    if (! this._updates) return;
    var u = this._updates;
    delete this._updates;

    // apply sets first: these are likely collisions, and acceleration due to
    // gravity should still apply after a collision
    if (u.set.length > 0) {
	var new_vX = null;
	var new_vY = null;
	for (var i=0; i < u.set.length; i++) {
	    if (i==0) { new_vX = 0; new_vY = 0; }
	    new_vX += u.set[i].vX;
	    new_vY += u.set[i].vY;
	}
	new_vX += u.dvX;
	new_vY += u.dvY;
	this.setVelocity( new_vX, new_vY );
    } else {
	this.updateVelocity( u.dvX, u.dvY );
    }
}

SpaceObject.prototype.updateVelocity = function(dX, dY) {
    if (this.stationary) return false;

    var newVx = this.vX + dX;
    var newVy = this.vY + dY;
    
    var magnitude_squared = newVx*newVx + newVy*newVy; // avoid sqrt
    if (magnitude_squared > this.maxVSquared) {
	// scale back newV along same vector
	var angle  = Math.atan2(newVy, newVx);
	newVx = Math.cos(angle) * this.maxV;
	newVy = Math.sin(angle) * this.maxV;
    }

    this.vX = newVx;
    this.vY = newVy;
}

SpaceObject.prototype.setVelocity = function(vX, vY) {
    this.vX = vX;
    this.vY = vY;
}

SpaceObject.prototype.accelerateAlong = function(angle, thrust) {
    var accel = thrust/this.mass;
    var dX = Math.cos(angle) * accel;
    var dY = Math.sin(angle) * accel;
    this.updateVelocity(dX, dY);
}

SpaceObject.prototype.incSpin = function(delta) {
    if (delta != 0) {
	this.spin += delta;
	if (this.spin > this.maxSpin) {
	    this.spin = this.maxSpin;
	} else if (this.spin < -this.maxSpin) {
	    this.spin = -this.maxSpin;
	}
    }
}

SpaceObject.prototype.collided = function(object, collision) {
    this.colliding[object.id] = object;

    if (this.damage) {
	var damageDone = this.damage;
	if (collision.impactSpeed != null) {
	    damageDone = Math.ceil(damageDone * collision.impactSpeed);
	}
	object.decHealth( damageDone );
	// console.log( this.id + " -->X " + object.id + " damage: " + damageDone );
    }
}

SpaceObject.prototype.collidingWith = function(object) {
    if (this.colliding[object.id]) return true;
    return false;
}

SpaceObject.prototype.stopCollidingWith = function(object) {
    delete this.colliding[object.id];
}


SpaceObject.prototype.decHealth = function(delta) {
    this.healthChanged = true;
    this.health -= delta;
    if (this.health <= 0) {
	this.health = -1;
	this.die();
    }
}

SpaceObject.prototype.incHealth = function(delta) {
    this.healthChanged = true;
    this.health += delta;
    if (this.health > 100) this.health = 100;
}

SpaceObject.prototype.die = function() {
    this.died = true;
    this.update = false;
    this.game.objectDied( this );
}

SpaceObject.prototype.attach = function(object) {
    this.attached[object.id] = object;
}

SpaceObject.prototype.attachedTo = function(object) {
    if (this.attached[object.id]) return true;
    return false;
}

SpaceObject.prototype.detach = function(object) {
    delete this.attached[object.id];
}

SpaceObject.prototype.incThrust = function(delta) {
    this.thrustChanged = true;
    this.thrust += delta;
    if (this.thrust > this.maxThrust) this.thrust = this.maxThrust;
}

SpaceObject.prototype.decThrust = function(delta) {
    this.thrustChanged = true;
    this.thrust -= delta;
    if (this.thrust < -this.maxThrust) this.thrust = -this.maxThrust;
}

SpaceObject.prototype.resetThrust = function(delta) {
    this.thrustChanged = true;
    this.thrust=0;
}

SpaceObject.prototype.toString = function() {
    return this.id + '=('+
	'x:' + this.x.toFixed(1) + ', y:' + this.y.toFixed(1) +
	', vX:' + this.vX.toFixed(5) + ', vY:' + this.vY.toFixed(5) +
	')';
	
}
