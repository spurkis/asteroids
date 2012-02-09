/*********************************************************************
 * Planets & Asteroids - classes for the Asteroids game.
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');


/*********************************************************************
 * Planetoid - base class
 */
function Planetoid(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Planetoid.inheritsFrom( SpaceObject );

Planetoid.prototype.initialize = function(game, spatial) {
    Planetoid.prototype.parent.initialize.call(this, game, spatial);

    this.is_planetoid = true;
    this.fillStyle = null; // override...
    this.strokeStyle = null; // one of these!

    return this;
}

Planetoid.prototype.draw = function() {
    // all objects should set:
    this.x_last = this.x;
    this.y_last = this.y;

    var ctx = this.ctx;

    ctx.save();
    ctx.translate( this.x, this.y );

    if (this.image != null) {
	ctx.drawImage(this.image, -this.radius, -this.radius, this.radius*2, this.radius*2);
    } else {
	ctx.beginPath();
	ctx.arc(0, 0, this.radius, 0, deg_to_rad[360], false);
	ctx.closePath()
	if (this.fillStyle) {
	    ctx.fillStyle = this.fillStyle;
	    ctx.fill();
	} else {
	    ctx.strokeStyle = this.strokeStyle;
	    ctx.stroke();
	}
    }

    // draw trajectory:
    /*
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.strokeStyle = 'orange';
    ctx.lineTo(this.vX*100,this.vY*100);
    ctx.closePath();
    ctx.stroke();
    */
    ctx.restore();
}

Planetoid.prototype.redraw = function() {
    var ctx = this.ctx;

    ctx.save();
    ctx.translate( this.x_last, this.y_last );
    var corner = -(this.radius+1);
    var width  = this.radius*2 + 2;
    ctx.clearRect(corner, corner, width, width);
    ctx.restore();

    this.draw();
}


/*
Planetoid.prototype.collided = function(object) {
    if (this.damage && !object.is_planetoid) {
	object.decHealth( this.damage );
    }
}
*/

/*********************************************************************
 * Planet class
 */
function Planet(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Planet.inheritsFrom( Planetoid );

Planet.prototype.initialize = function(game, spatial) {
    this.oid_prefix = 'pln';

    spatial.damage = spatial.mass;
    Planet.prototype.parent.initialize.call(this, game, spatial);

    this.fillStyle = "rgba(100,0,0,0.75)";
    this.is_planet = true;
    this.landingThresholdSpeed = 0.4;
    this.landingThresholdAngle = deg_to_rad[5];

    if (this.game.asteroidImg != null) {
	this.image = this.game.asteroidImg;
    }

    return this;
}

Planet.prototype.collided = function(object, collision) {
    if (object.is_ship) {
	// if the magnitude of the delta-V is small & the ship is
	// facing away from this, then let them land without damage
	if (collision.impactSpeed < this.landingThresholdSpeed) {
	    var this_collision = collision[this.id];
	    var planet_to_ship_angle = Math.atan2(-this_collision.dY, -this_collision.dX);
	    var delta_angle = Math.abs(object.facing - planet_to_ship_angle);
	    if (delta_angle <= this.landingThresholdAngle) {
		console.log(object.id + " landed on " + this.id);
		this.attach(object);
		object.attach(this);
	    }
	    return;
	}
    }
    this.parent.collided.call( this, object, collision );
}

Planet.prototype.updateVelocity = function(dX, dY) {
    if (this.stationary) return;
    this.parent.updateVelocity.call(this, dX, dY);
}

Planet.prototype.setVelocity = function(vX, vY) {
    if (this.stationary) return;
    this.parent.setVelocity.call(this, vX, vY);
}

Planet.prototype.decHealth = function(delta) {
    // indestructable
}

Planet.prototype.incHealth = function(delta) {
    // indestructable
}

/*********************************************************************
 * Asteroid class
 */
function Asteroid(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Asteroid.inheritsFrom( Planetoid );

Asteroid.prototype.initialize = function(game, spatial) {
    this.oid_prefix = 'ast';

    spatial.health = 30;
    if (spatial.damage == null) spatial.damage = spatial.mass*10;
    Asteroid.prototype.parent.initialize.call(this, game, spatial);

    this.fillStyle = "rgb(0,100,100)";
    this.is_asteroid = true;
    this.spawn = spatial.spawn != null ? spatial.spawn : getRandomInt(0, 3);

    return this;
}

Asteroid.prototype.collided = function(object, collision) {
    if (! object.is_asteroid) {
	this.parent.collided.call( this, object, collision );
    } else {
	this.colliding[object.id] = object;
    }
}

Asteroid.prototype.die = function() {
    this.parent.die.call( this );
    if (this.spawn > 0) {
	for (var i=0; i < this.spawn; i++) {
	    var mass = Math.floor(this.mass / this.spawn * 1000)/1000;
	    var radius = getRandomInt(2, this.radius);
	    var asteroid = new Asteroid(this.game, {
		mass: mass,
		x: this.x + i/10, // don't overlap
		y: this.y + i/10,
		radius:  radius,
		spawn: getRandomInt(0, this.spawn-1)
		// let physics engine handle movement
	    });
	    // TODO: debug the weirdness this causes
	    this.game.addObject( asteroid );
	}
    }
}
