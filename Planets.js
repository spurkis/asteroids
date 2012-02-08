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
    this.fillStyle = "rgb(0,0,0)"; // override me!

    return this;
}

Planetoid.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, deg_to_rad[360], false);
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
    ctx.closePath();

    // draw trajectory:
    /*
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.strokeStyle = 'black';
    ctx.lineTo(this.vX*100,this.vY*100);
    ctx.closePath();
    ctx.stroke();
*/
    ctx.restore();
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
    this.landingThreshold = 0.2;

    return this;
}

Planet.prototype.collided = function(object, collision) {
    if (object.is_ship) {
	// if the magnitude of the delta-V is small & the ship is
	// facing away from this, then let them land without damage
	if (collision.impactSpeed < this.landingThreshold) {
	    console.log(object.id + " landed on " + this.id);
	    this.attach(object);
	    object.attach(this);
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

    this.fillStyle = "rgba(0,100,100,1)";
    this.is_asteroid = true;

    return this;
}

Asteroid.prototype.collided = function(object, collision) {
    if (! object.is_asteroid) {
	this.parent.collided.call( this, object, collision );
    } else {
	this.colliding[object.id] = object;
    }
}
