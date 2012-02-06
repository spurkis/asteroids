/*********************************************************************
 * Bullet class
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');

function Bullet(ship, startX, startY, facing, vX, vY) {
    if (ship) return this.initialize(ship, startX, startY, facing, vX, vY);
    return this;
}
Bullet.inheritsFrom( SpaceObject );

Bullet.prototype.initialize = function(ship, startX, startY, facing, vX, vY) {
    Bullet.prototype.parent.initialize.call(this, ship.game, startX, startY);
    this.ship = ship;
    this.facing = facing;
    this.velocityX = vX;
    this.velocityY = vY;
    this.mass = 0.1;
    this.ttl = 2500;
    return this;
}


Bullet.prototype.weaponTimeout = function() {
    // do nothing
}

Bullet.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(0,5);
    ctx.lineTo(0,0);
    ctx.closePath();

    ctx.stroke();
    ctx.restore();
}


