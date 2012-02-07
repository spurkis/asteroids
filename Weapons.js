/*********************************************************************
 * Bullet class
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');

function Bullet(ship, spatial) {
    if (ship) return this.initialize(ship, spatial);
    return this;
}
Bullet.inheritsFrom( SpaceObject );

Bullet.prototype.initialize = function(ship, spatial) {
    this.oid_prefix = "blt";

    spatial.radius = 1;
    spatial.mass = 0.01;
    spatial.damage = 5;
    Bullet.prototype.parent.initialize.call(this, ship.game, spatial);

    this.ship = ship;
    this.ttl = 2500;
    this.exploding = false;
    this.fading = -1;
    this.is_weapon = true;

    return this;
}


Bullet.prototype.weaponTimeout = function() {
    this.fading = 10;
    var self = this;
    this.fadeIntervalId = setInterval(function(){
	self.fadeOut();
    }, 100);
}

Bullet.prototype.fadeOut = function() {
    this.fading--;

    if (this.fading <= 0) {
	clearInterval(this.fadeIntervalId);
	delete this.fadeIntervalId;
	this.die();
    }
}

Bullet.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    if (this.exploding) {
	ctx.strokeStyle = "#f22";
	ctx.beginPath();
	ctx.moveTo(0,3);
	ctx.lineTo(0,-3);
	ctx.moveTo(3,0);
	ctx.lineTo(-3,0);
	ctx.closePath();
    } else {
	if (this.fading >= 0) {
	    ctx.strokeStyle = "rgba(150,150,100,"+ this.fading / 10 +")";
	} else {
	    ctx.strokeStyle = "rgb(200,50,50)";
	}
	ctx.beginPath();
	ctx.moveTo(0,5);
	ctx.lineTo(0,0);
	ctx.closePath();
    }

    ctx.stroke();
    ctx.restore();
}


Bullet.prototype.decHealth = function(delta) {
    // do nothing - bullets are indescructable
}

Bullet.prototype.impacted = function(object) {
    if (object.ship == this.ship) {
	// don't damage our own stuff
    }
    object.decHealth( this.damage );
    this.explode();
}

Bullet.prototype.explode = function() {
    if (this.exploding) return;

    this.exploding = true;
    this.update = false;

    var self = this;
    setTimeout(function(){
	self.die()
    }, 250);
}
