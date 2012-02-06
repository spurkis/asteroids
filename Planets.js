/*********************************************************************
 * Planets & Asteroids - classes for the Asteroids game.
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');


/*********************************************************************
 * Planet class
 */
function Planet(game, startX, startY, mass, radius) {
    if (game) return this.initialize(game, startX, startY, mass, radius);
    return this;
}

Planet.inheritsFrom( SpaceObject );

Planet.prototype.initialize = function(game, startX, startY, mass, radius) {
    Planet.prototype.parent.initialize.call(this, game, startX, startY);
    this.mass = mass;
    this.radius = radius;
    this.fillStyle = "rgba(100,0,0,0.75)";

    this.radiusSquared = Math.pow(this.radius,2);
    return this;
}

Planet.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, deg_to_rad[360], false);
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
    ctx.restore();
}


/*********************************************************************
 * Asteroid class
 */
function Asteroid(game, startX, startY, mass, radius, vX, vY, facing, rotation) {
    if (game) return this.initialize(game, startX, startY, mass, radius, vX, vY, facing, rotation);
    return this;
}

Asteroid.inheritsFrom( Planet );

Asteroid.prototype.initialize = function(game, startX, startY, mass, radius, vX, vY, facing, rotation) {
    Asteroid.prototype.parent.initialize.call(this, game, startX, startY, mass, radius);
    this.velocityX = vX;
    this.velocityY = vY;
    this.facing = facing;
    this.rotation = rotation;
    this.fillStyle = "rgba(0,100,100,1)";

    return this;
}

