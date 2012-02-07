/*********************************************************************
 * SpaceObject - base class, where a lot of the game physics happens
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');

var objectId=0;

function SpaceObject(game, startX, startY) {
    if (game) return this.initialize(game, startX, startY);
    return this;
}

SpaceObject.prototype.draw = function() {
    throw this + ".draw not overriden";
};

SpaceObject.prototype.initialize = function(game, startX, startY) {
    this.game = game;
    this.ctx = game.ctx; // canvas context
    this.id = this.createObjectId();

    this.health = 100; // percentage

    this.x = startX;  // position on the grid
    this.y = startY;  // position on the grid
    this.maxX = this.ctx.canvas.width;
    this.maxY = this.ctx.canvas.height;

    this.vX = 0;  // speed along X axis in pixels/sec
    this.vY = 0;  // speed along Y axis in pixels/sec
    this.maxV = 2; // max velocity
    this.maxVSquared = this.maxV*this.maxV; // cached

    this.mass = 0;
    this.thrust = 0; // thrust along current facing
    this.maxThrust = 0.5;

    this.facing = 0;  // angle in Rad, not heading!
    this.spin = 0;    // spin in Rad/sec
    this.maxSpin = deg_to_rad[10];

    this.attached = [];

    this.update = true;

    return this;
}

SpaceObject.prototype.createObjectId = function() {
    return 'obj' + objectId++;
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

    // apply gravity
    if (objects) {
	for (var i=0; i < objects.length; i++) {
	    var object = objects[i];
	    if (object == this || object.ship == this || this.ship == object) continue;
	    if (object.mass <= 0) continue;
	    if (! object.update) continue;

	    var dX = this.x-object.x;
	    var dY = this.y-object.y;
	    var dist_squared = Math.pow(dX, 2) + Math.pow(dY, 2);
	    // var dist = sqrt(pow(x2-x1, 2) + pow(y2-y1, 2)); // slow

	    var totalR2 = Math.pow(this.radius + object.radius, 2);
	    if (dist_squared > totalR2) {
		if (this.attachedTo(object)) {
		    this.game.maybeDetachObjects(this, object);
		    // don't appy any acceleration from attached objects
		} else {
		    // F2 = G*m1*m2/r^2
		    // a2 = F/m2 = G*m1/r^2
		    var accel = 0.1*object.mass / dist_squared;
		    if (accel > this.game.maxAccel) accel = this.game.maxAccel;
		    //var accel = F/this.mass;
		    var angle = Math.atan2(dX, dY);
		    var scaleX = -Math.sin(angle) * accel;
		    var scaleY = -Math.cos(angle) * accel;

		    this.incVelocity(scaleX, scaleY);
		}
	    } else {
		if (this.attachedTo(object)) {
		    // appy some negative acceleration from attached objects
		    var accel = object.mass / dist_squared;
		    if (accel > this.game.maxAccel) accel = this.game.maxAccel;
		    //var accel = F/this.mass;
		    var angle = Math.atan2(dX, dY);
		    var scaleX = Math.sin(angle) * accel;
		    var scaleY = Math.cos(angle) * accel;

		    this.incVelocity(scaleX, scaleY);
		} else {
		    // so close they've impacted:
		    this.game.impact( this, object );
		}
	    }
	}
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

SpaceObject.prototype.incVelocity = function(dX, dY) {
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

SpaceObject.prototype.accelerateAlong = function(angle, thrust) {
    var accel = thrust/this.mass;
    var scaleX = Math.sin(angle) * accel;
    var scaleY = -Math.cos(angle) * accel;
    this.incVelocity(scaleX, scaleY);
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

SpaceObject.prototype.impacted = function(object, collision_state) {
    if (this.damage) {
	object.decHealth( this.damage );
    }
}

SpaceObject.prototype.decHealth = function(delta) {
    this.health -= delta;
    if (this.health <= 0) {
	this.die();
    }
}

SpaceObject.prototype.incHealth = function(delta) {
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

