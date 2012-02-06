/*********************************************************************
 * SpaceObject - base class, where a lot of the game physics happens
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');

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

    this.x = startX;  // position on the grid
    this.y = startY;  // position on the grid
    this.maxX = this.ctx.canvas.width;
    this.maxY = this.ctx.canvas.height;

    this.velocityX = 0;  // speed along X axis in pixels/sec
    this.velocityY = 0;  // speed along Y axis in pixels/sec
    this.maxVelocityX = 2;
    this.maxVelocityY = 2;

    this.thrust = 0;
    this.maxThrust = 0.5;
    this.facing = 0;  // angle in Rad, not heading!
    this.spin = 0;    // spin in Rad/sec
    this.mass = 0;
    this.maxSpin = deg_to_rad[10];

    return this;
}


SpaceObject.prototype.updatePositions = function(objects) {
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
	    if (object.mass <= 0) continue;

	    var dX = this.x-object.x;
	    var dY = this.y-object.y;
	    var dist_squared = Math.pow(dX, 2) + Math.pow(dY, 2);
	    // var dist = sqrt(pow(x2-x1, 2) + pow(y2-y1, 2)); // slow

	    if (dist_squared > object.radiusSquared) {
		var accel = object.mass / dist_squared;
		if (accel > 1) accel = 1;
		//var accel = F/this.mass;
		var angle = Math.atan2(dX, dY);
		var scaleX = -Math.sin(angle) * accel;
		var scaleY = -Math.cos(angle) * accel;

		this.incVelocity(scaleX, scaleY);
	    } else {
		// so close they've impacted, stop unless they're thrusting
		if (this.thrust == 0) {
		    this.velocityX = 0;
		    this.velocityY = 0;
		}
	    }
	}
    }

    this.incX(this.velocityX);
    this.incY(this.velocityY);
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
    if (dX != 0) {
	this.velocityX += dX;
	if (this.velocityX > this.maxVelocityX) {
	    this.velocityX = this.maxVelocityX;
	} else if (this.velocityX < -this.maxVelocityX) {
	    this.velocityX = -this.maxVelocityX;
	}
    }
    if (dY != 0) {
	this.velocityY += dY;
	if (this.velocityY > this.maxVelocityY) {
	    this.velocityY = this.maxVelocityY;
	} else if (this.velocityY < -this.maxVelocityY) {
	    this.velocityY = -this.maxVelocityY;
	}
    }
}

Ship.prototype.accelerateAlong = function(angle, thrust) {
    var scaleX = Math.sin(angle) * thrust;
    var scaleY = -Math.cos(angle) * thrust;
    this.incVelocity(scaleX, scaleY);
}

