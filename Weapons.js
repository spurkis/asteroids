/*********************************************************************
 * Weapons
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');


/*********************************************************************
 * Gun - default weapon. fires Bullets.
 */
function Gun(context) {
    this.ship = context.ship;
    this.game = this.ship.game;

    this.maxAmmo = context.ammo || 50;
    this.ammo = this.maxAmmo;
    this.ammoChanged = false;

    this.fireInterval = context.fireInterval || 100; // ms
    this.fireThrust = context.fireThrust || 2.5;

    this.rechargeInterval = context.rechargeInterval || 300; // ms
}

// get ammo level as a number between 0 & 100
Gun.prototype.ammoLevel = function() {
    return Math.floor(this.ammo/this.maxAmmo * 100);
}

Gun.prototype.drawWeaponIcon = function(ctx) {
    // TODO
}

// Fire this weapon, add bullets to the game
Gun.prototype.fire = function() {
    var ship = this.ship;

    // out of ammo?
    if (this.ammo <= 0) return false;

    this.decAmmo();

    var scaleX = Math.cos(ship.facing) * this.fireThrust;
    var scaleY = Math.sin(ship.facing) * this.fireThrust;
    var vX = ship.vX + scaleX;
    var vY = ship.vY + scaleY;
    var bullet = new Bullet(ship, {
	x: ship.x,
	y: ship.y,
	facing: ship.facing,
	vX: vX,
	vY: vY,
    });

    this.game.fireWeapon(bullet);
}

Gun.prototype.decAmmo = function() {
    if (this.ammo <= 0) return false;
    this.ammo--;
    this.ship.ammoChanged = true;
    this.startAutoRecharge();
    return true;
}

Gun.prototype.incAmmo = function() {
    if (this.ammo >= this.maxAmmo) return false;
    this.ammo++;
    this.ship.ammoChanged = true;
    return true;
}

Gun.prototype.startAutoRecharge = function() {
    if (this.rechargeIntervalId != null) return;

    var self = this;
    this.rechargeIntervalId = setInterval(function() {
	if (! self.incAmmo()) {
	    self.stopAutoRecharge();
	}
    }, self.rechargeInterval);
}

Gun.prototype.stopAutoRecharge = function() {
    if (this.rechargeIntervalId == null) return;
    clearInterval(this.rechargeIntervalId);
    delete this.rechargeIntervalId;
}

/*********************************************************************
 * Bullet Class
 */
function Bullet(ship, spatial) {
    if (ship) return this.initialize(ship, spatial);
    return this;
}
Bullet.inheritsFrom( SpaceObject );

Bullet.prototype.initialize = function(ship, spatial) {
    this.oid_prefix = "blt";

    spatial.radius = 1;
    spatial.mass = 0.05;
    spatial.damage = 5;
    spatial.maxV = 4;
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
    // all objects should set:
    this.x_last = this.x;
    this.y_last = this.y;

    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    // TODO: fancy graphics
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
	ctx.moveTo(-5,0);
	ctx.lineTo(0,0);
	ctx.closePath();
    }

    ctx.stroke();
    ctx.restore();
}

Bullet.prototype.redraw = function() {
    // TODO: this is experimental & not working...
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x_last, this.y_last );
    ctx.clearRect(-4,-4, 8, 8);
    ctx.restore();

    this.draw();
}

Bullet.prototype.decHealth = function(delta) {
    // do nothing - bullets are indescructable
}

Bullet.prototype.collided = function(object) {
    if (object.ship == this.ship) {
	// don't damage our ship's other weapons
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
