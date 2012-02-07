/*********************************************************************
 * SpaceObject - base class, where a lot of the game physics happens
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

SpaceObject.prototype.draw = function() {
    throw this + ".draw not overriden";
};

SpaceObject.prototype.initialize = function(game, spatial) {
    // if (spatial == null) spatial = {};

    this.game = game;
    this.ctx = game.ctx; // canvas context
    this.id = this.createObjectId();

    this.health = spatial.health || 100;      // health as a percentage
    this.healthChanged = false;
    this.damage = spatial.damage || 0;        // damage on impact

    this.x = spatial.x;                       // starting position on x axis
    this.y = spatial.y;                       // starting position on y axis
    this.maxX = this.ctx.canvas.width;
    this.maxY = this.ctx.canvas.height;

    this.vX = spatial.vX || 0;                // speed along X axis
    this.vY = spatial.vY || 0;                // speed along Y axis
    this.maxV = spatial.maxV || 2;            // max velocity
    this.maxVSquared = this.maxV*this.maxV;   // cache for speed

    this.mass = spatial.mass || 0;            // mass of object
    this.radius = spatial.radius || 1;        // radius of object
    this.radiusSquared = Math.pow(this.radius,2); // cache for speed


    this.thrust = spatial.initialThrust || 0; // thrust along facing
    this.maxThrust = spatial.maxThrust || 0.5;

    this.facing = spatial.facing || 0;        // currently facing angle (rad)
    this.spin = spatial.spin || 0;            // spin in Rad/sec
    this.maxSpin = deg_to_rad[10];            // max spin

    this.attached = [];                       // object this is attached to

    this.update = true;

    return this;
}

SpaceObject.prototype.createObjectId = function() {
    var prefix = this.oid_prefix || 'obj'
    return prefix + _spaceObjectId++;
}


SpaceObject.prototype.updatePositions = function(objects) {
    if (! this.update) return;

    this.facing += this.spin;
    if (this.facing >= deg_to_rad[360] || this.facing <= deg_to_rad[360]) {
	this.facing = this.facing % deg_to_rad[360];
    }
    if (this.facing < 0) {
	this.facing = deg_to_rad[360] + this.facing;
    }

    this.incX(this.vX);
    this.incY(this.vY);
}


SpaceObject.prototype.incX = function(dX) {
    this.x += dX;
    if (this.x < 0) this.x = this.maxX + this.x;
    if (this.x > this.maxX) this.x = this.x - this.maxX;
}

SpaceObject.prototype.incY = function(dY) {
    this.y += dY;
    if (this.y < 0) this.y = this.maxY + this.y;
    if (this.y > this.maxY) this.y = this.y - this.maxY;
}

SpaceObject.prototype.updateVelocity = function(dX, dY) {
    var newVx = this.vX + dX;
    var newVy = this.vY + dY;
    
    var magnitude_squared = newVx*newVx + newVy*newVy; // avoid sqrt
    if (magnitude_squared > this.maxVSquared) {
	// scale back newV along same vector
	var angle  = Math.atan2(newVx, newVy);
	newVx = Math.sin(angle) * this.maxV;
	newVy = Math.cos(angle) * this.maxV;
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
    var scaleX = Math.sin(angle) * accel;
    var scaleY = -Math.cos(angle) * accel;
    this.updateVelocity(scaleX, scaleY);
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

SpaceObject.prototype.impacted = function(object, collision) {
    if (this.damage) {
	var damageDone = this.damage;
	if (collision.impactSpeed != null) {
	    damageDone = Math.ceil(damageDone * collision.impactSpeed);
	}
	object.decHealth( damageDone );
	// console.log( this.id + " -->X " + object.id + " damage: " + damageDone );
    }
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

