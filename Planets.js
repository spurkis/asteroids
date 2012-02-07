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
    ctx.restore();
}

/*
Planetoid.prototype.impacted = function(object) {
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
    spatial.damage = spatial.mass;
    Planet.prototype.parent.initialize.call(this, game, spatial);
    this.fillStyle = "rgba(100,0,0,0.75)";
    this.is_planet = true;
    return this;
}

Planet.prototype.updatePositions = function(objects) {
    Planet.prototype.parent.updatePositions.call(this, objects);
    1;
}


/*
Planet.prototype.updateVelocity = function(dX, dY) {
    // unmovable
}

Planet.prototype.setVelocity = function(vX, vY) {
    // unmovable
}
*/
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
    spatial.health = 30;
    spatial.damage = 4;
    Asteroid.prototype.parent.initialize.call(this, game, spatial);

    this.fillStyle = "rgba(0,100,100,1)";
    this.is_asteroid = true;
    return this;
}

Asteroid.prototype.impacted = function(object) {
    if (! object.is_asteroid) {
	this.parent.decHealth.call( this, object );
    }
}
