/*********************************************************************
 * Planets & Asteroids - classes for the Asteroids game.
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');


/*********************************************************************
 * Planetoid - base class
 */
function Planetoid(game, startX, startY, mass, radius) {
    if (game) return this.initialize(game, startX, startY, mass, radius);
    return this;
}

Planetoid.inheritsFrom( SpaceObject );

Planetoid.prototype.initialize = function(game, startX, startY, mass, radius) {
    Planetoid.prototype.parent.initialize.call(this, game, startX, startY);
    this.mass = mass;
    this.radius = radius;
    this.is_planetoid = true;
    this.fillStyle = "rgb(0,0,0)"; // override me!

    this.radiusSquared = Math.pow(this.radius,2);
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

Planetoid.prototype.impacted = function(object) {
    if (this.damage && !object.is_planetoid) {
	object.decHealth( this.damage );
    }
}

/*********************************************************************
 * Planet class
 */
function Planet(game, startX, startY, mass, radius) {
    if (game) return this.initialize(game, startX, startY, mass, radius);
    return this;
}

Planet.inheritsFrom( Planetoid );

Planet.prototype.initialize = function(game, startX, startY, mass, radius) {
    Planet.prototype.parent.initialize.call(this, game, startX, startY, mass, radius);
    this.fillStyle = "rgba(100,0,0,0.75)";
    this.is_planet = true;
    return this;
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
function Asteroid(game, startX, startY, mass, radius, vX, vY, facing, spin) {
    if (game) return this.initialize(game, startX, startY, mass, radius, vX, vY, facing, spin);
    return this;
}

Asteroid.inheritsFrom( Planetoid );

Asteroid.prototype.initialize = function(game, startX, startY, mass, radius, vX, vY, facing, spin) {
    Asteroid.prototype.parent.initialize.call(this, game, startX, startY, mass, radius);

    this.vX = vX;
    this.vY = vY;
    this.facing = facing;
    this.spin = spin;
    this.fillStyle = "rgba(0,100,100,1)";
    this.is_asteroid = true;
    this.health = 30;
    this.damage = 4;

    return this;
}

