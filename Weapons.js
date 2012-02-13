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
    if (context) return this.initialize(context);
    return this;
}

Gun.prototype.initialize = function(context) {
    this.is_gun = true;
    this.is_basic_gun = getObjectClass(this) == 'Gun';

    this.ship = context.ship;
    this.game = this.ship.game;

    this.maxAmmo = context.maxAmmo || 50;
    this.ammo = context.ammo || this.maxAmmo;
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
    var bullet = this.createBullet(ship, {
	x: ship.x,
	y: ship.y,
	facing: ship.facing,
	vX: vX,
	vY: vY,
    });

    this.game.fireWeapon(bullet);
}

Gun.prototype.createBullet = function(ship, params) {
    // make it easy to override...
    return new Bullet(ship, params);
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

Gun.prototype.toString = function() {
    return getObjectClass(this);
}

/*********************************************************************
 * Cannon - Big Gun. Fires Big Bullets at High Speeds.  Oooh...
 */
function Cannon(context) {
    if (context) return this.initialize(context);
    return this;
}

Cannon.inheritsFrom( Gun );

Cannon.prototype.initialize = function(context) {
    this.is_cannon = true;

    if (!context.maxAmmo) context.maxAmmo = 10;
    if (!context.fireInterval) context.fireInterval = 500; // ms
    if (!context.fireThrust) context.fireThrust = 5;
    if (!context.rechargeInterval) context.rechargeInterval = 1500; // ms
    Cannon.prototype.parent.initialize.call(this, context);
}

Cannon.prototype.createBullet = function(ship, params) {
    params.color = "#039";
    params.mass = 5;
    params.damage = 30;
    params.maxV = 6;
    return new Bullet(ship, params);
}

/*********************************************************************
 * SprayGun - Sprays bullets...
 */
function SprayGun(context) {
    if (context) return this.initialize(context);
    return this;
}

SprayGun.inheritsFrom( Gun );

SprayGun.prototype.initialize = function(context) {
    this.is_spray_gun = true;

    if (!context.maxAmmo) context.maxAmmo = 20;
    SprayGun.prototype.parent.initialize.call(this, context);
}

SprayGun.prototype.fire = function() {
    var ship = this.ship;

    // out of ammo?
    if (! this.decAmmo()) return false;

    for (var delta=-20; delta < 20; delta += 10) {
	
	var sprayAngle = ship.facing + deg_to_rad[delta];
	var scaleX = Math.cos(sprayAngle) * this.fireThrust;
	var scaleY = Math.sin(sprayAngle) * this.fireThrust;
	var vX = ship.vX + scaleX;
	var vY = ship.vY + scaleY;
	var bullet = this.createBullet(ship, {
	    x: ship.x + 5*vX,
	    y: ship.y + 5*vY,
	    facing: sprayAngle,
	    vX: vX,
	    vY: vY,
	    color: "#F90",
	});

	this.game.fireWeapon(bullet);
    }
}


/*********************************************************************
 * GrenadeCannon - Launches Grenades @ high speed.
 */
function GrenadeCannon(context) {
    if (context) return this.initialize(context);
    return this;
}

GrenadeCannon.inheritsFrom( Cannon );

GrenadeCannon.prototype.initialize = function(context) {
    this.is_grenade_cannon = true;

    if (!context.maxAmmo) context.maxAmmo = 10;
    GrenadeCannon.prototype.parent.initialize.call(this, context);
}

GrenadeCannon.prototype.createBullet = function(ship, params) {
    params.color = "#a9f";
    params.damage = 30;
    params.maxV = 6;
    return new Grenade(ship, params);
}


/*********************************************************************
 * GravBender - Launches a gravity bending projectile.
 */
function GravBender(context) {
    if (context) return this.initialize(context);
    return this;
}

GravBender.inheritsFrom( Cannon );

GravBender.prototype.initialize = function(context) {
    this.is_grav_bender = true;

    if (!context.maxAmmo) context.maxAmmo = 2;
    if (!context.rechargeInterval) context.rechargeInterval = 10000;
    GrenadeCannon.prototype.parent.initialize.call(this, context);
}

GravBender.prototype.createBullet = function(ship, params) {
    params.color = "#f9f";
    params.mass = 2500;
    params.damage = 0;
    params.maxV = 6;
    return new Grenade(ship, params);
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
    this.is_weapon = true;

    if (!spatial.radius) spatial.radius = 1;
    if (!spatial.mass) spatial.mass = 0.05;
    if (!spatial.damage) spatial.damage = 5;
    if (!spatial.maxV) spatial.maxV = 4;
    Bullet.prototype.parent.initialize.call(this, ship.game, spatial);

    this.ship = ship;
    this.ttl = 2500;
    this.exploding = false;
    this.fading = -1;
    this.color = spatial.color || "#f22";

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
	ctx.strokeStyle = this.color;
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
	    ctx.strokeStyle = this.color;
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
    // don't damage our ship or it's other weapons?
    if (object.ship == this.ship || object == this.s) {
    	return;
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


/*********************************************************************
 * Grenade Class
 */
function Grenade(ship, spatial) {
    if (ship) return this.initialize(ship, spatial);
    return this;
}
Grenade.inheritsFrom( Bullet );

Grenade.prototype.initialize = function(ship, spatial) {
    this.oid_prefix = "blt";
    this.is_weapon = true;

    if (!spatial.radius) spatial.radius = 3;
    if (!spatial.mass) spatial.mass = 0.5;
    if (!spatial.damage) spatial.damage = 30;
    if (!spatial.maxV) spatial.maxV = 6;
    Grenade.prototype.parent.initialize.call(this, ship, spatial);

    return this;
}

Grenade.prototype.draw = function() {
    // all objects should set:
    this.x_last = this.x;
    this.y_last = this.y;

    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    // TODO: fancy graphics
    if (this.exploding) {
	this.radius += 2;
    }

    if (this.fading >= 0) {
	ctx.strokeStyle = "rgba(150,150,100,"+ this.fading / 10 +")";
    } else {
	ctx.strokeStyle = this.color;
    }

    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, deg_to_rad[360], false);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

Grenade.prototype.collided = function(object) {
    // don't damage our ship or it's other weapons?
    if (object.ship == this.ship || object == this.s) {
    	return;
    }
    object.decHealth( this.damage );
    this.explode();
}
