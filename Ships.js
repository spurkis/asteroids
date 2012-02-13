/*********************************************************************
 * Ship - a ship in a game of asteroids
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');

function Ship(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Ship.inheritsFrom( SpaceObject );

Ship.prototype.initialize = function(game, spatial) {
    this.oid_prefix = "shp";

    spatial.mass = 10;
    spatial.radius = 7;
    spatial.damage = 2;
    spatial.maxSpin = deg_to_rad[6];

    Ship.prototype.parent.initialize.call(this, game, spatial);

    this.is_ship = true;

    this.lives = spatial.lives || 3;
    this.color = spatial.color || {r: 0, g: 0, b: 0};

    // current state of user action:
    this.increaseSpin = false;
    this.decreaseSpin = false;
    this.accelerate = false;
    this.decelerate = false;
    this.firing = false;

    // for moving about:
    this.thrustIncrement = 0.01;
    this.spinIncrement = deg_to_rad[0.5];

    // shields
    this.shield = 100;
    this.shieldActive = true;

    // ammo & weapons
    this.weapons = [
	new Gun({ ship: this }),
	new Cannon({ ship: this }),
	new SprayGun({ ship: this }),
	new GrenadeCannon({ ship: this }),
	new GravBender({ ship: this }),
    ];
    this.currentWeapon = this.weapons[0];

    // for displaying ship info: health, shield, thrust, ammo
    this.healthWidth = 100;
    this.healthHeight = 10;
    this.healthX = spatial.healthX || this.maxX - this.healthWidth - 10;
    this.healthY = 10;

    this.thrustWidth = 100;
    this.thrustHeight = 10;
    this.thrustX = this.healthX;
    this.thrustY = this.healthY + this.healthHeight + 5;
    this.thrustStartX = Math.floor( this.thrustWidth / 2 );

    this.ammoWidth = 100;
    this.ammoHeight = 10;
    this.ammoX = this.healthX;
    this.ammoY = this.thrustY + this.thrustHeight + 5;

    return this;
}

Ship.prototype.resetBeforeUpdate = function() {
    // reset changes from last update:
    this.shieldChanged = false;
    this.ammoChanged = false;
    Ship.prototype.parent.resetBeforeUpdate.call(this);
}

/******************************************************************************
 * Pre-rendered caches
 */
Ship.prototype.preRender = function() {
    this.render = {};

    // TODO: replace these with .png's?
    this.renderShip();
    this.renderThrustForward();
    this.renderThrustBackward();
    this.renderSpinCW();
    this.renderSpinCCW();

    // TODO: create flags for ship actions & pre-render each case?
    // leave room for: accel, decel, spin, health, shields, etc.
}

Ship.prototype.renderShip = function() {
    var render = this.createPreRenderCanvas(14,14);
    var ctx = render.ctx;
    var color = this.color;

    // corner of image: offset from center of ship
    render.x = -7;
    render.y = -7;

    ctx.strokeStyle = 'rgb('+ color.r +',' + color.g +','+ color.b +')';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(14,7);
    ctx.lineTo(0,14);
    ctx.quadraticCurveTo(7,7, 0,0);
    ctx.closePath();
    ctx.stroke();

    /*
    // draw facing angle
    ctx.strokeStyle = "orange";
    ctx.beginPath();
    ctx.moveTo(7,7);
    ctx.lineTo(50,7);
    ctx.closePath();
    ctx.stroke();

    // draw facing angle + 90º
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(7,7);
    ctx.lineTo(7,50);
    ctx.closePath();
    ctx.stroke();
    */

    this.render.ship = render;
}

Ship.prototype.renderThrustForward = function() {
    var render = this.createPreRenderCanvas(8,6);
    var ctx = render.ctx;
    var color = this.color;

    // offset from center of ship
    render.x = -13;
    render.y = -3;

    ctx.strokeStyle = 'rgb('+ color.r +',' + color.g +','+ color.b +')';
    ctx.beginPath();
    ctx.moveTo(8,0);
    ctx.lineTo(0,0);
    ctx.moveTo(8,3);
    ctx.lineTo(3,3);
    ctx.moveTo(8,6);
    ctx.lineTo(0,6);
    ctx.closePath();
    ctx.stroke();

    this.render.thrustForward = render;
}

Ship.prototype.renderThrustBackward = function() {
    var render = this.createPreRenderCanvas(10,12);
    var ctx = render.ctx;
    var color = this.color;

    // offset from center of ship
    render.x = 0;
    render.y = -6;

    ctx.strokeStyle = 'rgb('+ color.r +',' + color.g +','+ color.b +')';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(8,0);
    ctx.moveTo(6,3);
    ctx.lineTo(10,3);
    ctx.moveTo(6,6);
    ctx.lineTo(10,6);
    ctx.moveTo(0,12);
    ctx.lineTo(8,12);
    ctx.closePath();
    ctx.stroke();

    this.render.thrustBackward = render;
}

Ship.prototype.renderSpinCW = function() {
    var render = this.createPreRenderCanvas(1,3);
    var ctx = render.ctx;
    var color = this.color;

    // offset from center of ship
    render.x = 5;
    render.y = -6;

    ctx.strokeStyle = 'rgb('+ color.r +',' + color.g +','+ color.b +')';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0,3);
    ctx.closePath();
    ctx.stroke();

    this.render.spinCW = render;
}

Ship.prototype.renderSpinCCW = function() {
    var render = this.createPreRenderCanvas(1,3);
    var ctx = render.ctx;
    var color = this.color;

    // offset from center of ship
    render.x = 5;
    render.y = 3;

    ctx.strokeStyle = 'rgb('+ color.r +',' + color.g +','+ color.b +')';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0,3);
    ctx.closePath();
    ctx.stroke();

    this.render.spinCCW = render;
}

Ship.prototype.renderHealthBar = function() {
    var render = this.getClearHealthRenderCanvas();
    var ctx = render.ctx;

    var r = 200 - this.health*2;
    var g = this.health*2 + 50;
    var b = this.health*2;
    var fillStyle = 'rgba('+ r +','+ g +','+ b +',0.5)';
    var fillWidth = Math.floor(this.health/100 * this.healthWidth);

    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, fillWidth, this.healthHeight);
    ctx.strokeStyle = 'rgba(5,5,5,0.75)';
    ctx.strokeRect(0, 0, this.healthWidth, this.healthHeight);
    ctx.closePath();

    this.render.healthBar = render;
}

Ship.prototype.getClearHealthRenderCanvas = function() {
    if (this.render.health) {
	this.render.health.ctx.clearRect(0, 0, this.healthWidth, this.healthHeight);
	return this.render.healthBar;
    }
    var render = this.createPreRenderCanvas(this.healthWidth, this.healthHeight);
    render.ctx.globalCompositeOperation = 'source-over';
    return render;
}

/******************************************************************************
 * Draw
 */
Ship.prototype.draw = function() {
    // all objects should set:
    this.x_last = this.x;
    this.y_last = this.y;

    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    /* TODO: handle health change
    if (this.healthChanged || this.shipStrokeStyle == null) {
	var color = this.color;
	color.newR = (color.r +(100 - this.health)*2) % 255;
	this.shipStrokeStyle = 'rgb('+ color.newR +',' + color.g +','+ color.b +')';
    }
    */

    // render this ship
    var rs = this.render.ship;
    ctx.drawImage(rs.canvas, rs.x, rs.y);

    if (this.accelerate) {
	var r = this.render.thrustForward;
	ctx.drawImage(r.canvas, r.x, r.y);
    }

    if (this.decelerate) {
	var r = this.render.thrustBackward;
	ctx.drawImage(r.canvas, r.x, r.y);
    }

    if (this.increaseSpin) {
	var r = this.render.spinCW;
	ctx.drawImage(r.canvas, r.x, r.y);
    }

    if (this.decreaseSpin) {
	var r = this.render.spinCCW;
	ctx.drawImage(r.canvas, r.x, r.y);
    }

    ctx.restore();

    this.drawHealthBar();
    this.drawShield();
    this.drawThrustBar();
    this.drawAmmoBar();
    this.drawWeaponSelection();
}

Ship.prototype.drawHealthBar = function() {
    if (this.healthChanged || this.render.healthBar == null) {
	this.renderHealthBar();
    }

    var r = this.render.healthBar;
    this.ctx.drawImage(r.canvas, this.healthX, this.healthY);
}

Ship.prototype.drawShield = function() {
    if (! this.shieldActive) return;

    if (this.shieldChanged || this.shieldCache == null) {
	var r = this.shield;
	var g = this.shield*2;
	var b = this.shield*2 + 55;
	this.shieldCache = {
	    // shield colour displayed around ship
	    strokeStyle: 'rgba('+ r +','+ g +','+ b +',0.5)',
	    bar: {
		fillWidth: Math.floor(this.shield/100 * this.healthWidth),
		startY: Math.floor(this.healthHeight/3),
		height: Math.floor(this.healthHeight/3),
	    }
	};
	this.shieldCache.strokeStyle
    }

    var ctx = this.ctx;
    var cache = this.shieldCache;

    // draw shield as a circle around ship
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.beginPath();
    ctx.strokeStyle = cache.strokeStyle;
    ctx.arc(0, 0, this.radius+2, 0, deg_to_rad[360], false);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // draw shield status on top of health bar:
    ctx.save();
    ctx.translate( this.healthX, this.healthY );
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100,100,225,0.8)';
    ctx.fillRect(0,cache.bar.startY, cache.bar.fillWidth, cache.bar.height);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

Ship.prototype.drawThrustBar = function() {
    if (this.thrustChanged || this.thrustCache == null) {
	var thrustPercent = Math.floor(this.thrust/this.maxThrust * 100);
	var fillWidth = Math.floor(thrustPercent * this.thrustWidth / 100 / 2);
	var r = 100;
	var b = 200 + Math.floor(thrustPercent/2);
	var g = 100;
	this.thrustCache = {
	    fillWidth: fillWidth,
	    fillStyle: 'rgba('+ r +','+ g +','+ b +',0.5)',
	    thrustPercent: thrustPercent
	};
    }

    var ctx = this.ctx;
    var cache = this.thrustCache;
    ctx.save();
    ctx.translate( this.thrustX, this.thrustY );

    ctx.beginPath();
    ctx.fillStyle = cache.fillStyle;
    ctx.fillRect(this.thrustStartX, 0, cache.fillWidth, this.thrustHeight);
    ctx.strokeStyle = 'rgba(5,5,5,0.75)';
    ctx.strokeRect(0,0, this.thrustWidth,this.thrustHeight);
    ctx.closePath();

    ctx.restore();
}

Ship.prototype.drawAmmoBar = function() {
    if (this.ammoChanged || this.ammoCache == null) {
	var ammoLevel = this.currentWeapon.ammoLevel();
	var r = 250 - Math.floor(ammoLevel/2);
	var g = 155;
	var b = 155 + ammoLevel;
	this.ammoCache = {
	    fillStyle: 'rgba('+ r +','+ g +','+ b +',0.5)',
	    fillWidth: Math.floor(ammoLevel/100 * this.healthWidth)
	};
    }

    var ctx = this.ctx;
    var cache = this.ammoCache;
    ctx.save();
    ctx.translate( this.ammoX, this.ammoY );

    ctx.beginPath();
    ctx.fillStyle = cache.fillStyle;
    ctx.fillRect(0,0,cache.fillWidth, this.ammoHeight);
    ctx.strokeStyle = 'rgba(5,5,5,0.75)';
    ctx.strokeRect(0,0,this.ammoWidth,this.ammoHeight);
    ctx.closePath();

    ctx.restore();
}

Ship.prototype.drawWeaponSelection = function() {
    // TODO
}


Ship.prototype.redraw = function() {
    // TODO: this is experimental & not working...
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x_last, this.y_last );
    ctx.clearRect(-13,-13, 26, 26);
    ctx.restore();

    this.draw();
}

Ship.prototype.die = function() {
    this.clearIncThrustInterval();
    this.clearDecThrustInterval();
    this.clearSlowDownInterval();

    this.clearIncSpinInterval();
    this.clearDecSpinInterval();
    this.clearStopSpinInterval();

    this.stopFireWeapon();

    Ship.prototype.parent.die.call(this);
}

/*********************************************************************
 * Acceleration
 */
Ship.prototype.startAccelerate = function() {
    if (this.accelerate) return;
    this.accelerate = true;
    //console.log("thrust++");

    this.clearSlowDownInterval();

    var self = this;
    this.incThrustIntervalId = setInterval(function(){
	self.increaseThrust();
    }, 20);
};

Ship.prototype.increaseThrust = function() {
    this.incThrust(this.thrustIncrement);
    this.accelerateAlong(this.facing, this.thrust);
}


Ship.prototype.stopAccelerate = function() {
    //console.log("stop thrust++");
    if (this.clearIncThrustInterval()) this.resetThrust();
    this.startSlowingDown();
    this.accelerate = false;
};

Ship.prototype.clearIncThrustInterval = function() {
    if (! this.incThrustIntervalId) return false;
    clearInterval(this.incThrustIntervalId);
    this.incThrustIntervalId = null;
    return true;
}


Ship.prototype.startDecelerate = function() {
    if (this.decelerate) return;
    this.decelerate = true;
    //console.log("thrust--");

    this.clearSlowDownInterval();

    var self = this;
    this.decThrustIntervalId = setInterval(function(){
	self.decreaseThrust();
    }, 20);
};
  
Ship.prototype.decreaseThrust = function() {
    this.decThrust(this.thrustIncrement);
    this.accelerateAlong(this.facing, this.thrust);
}

Ship.prototype.stopDecelerate = function() {
    // console.log("stop thrust--");
    if (this.clearDecThrustInterval()) this.resetThrust();
    this.startSlowingDown();
    this.decelerate = false;
};

Ship.prototype.clearDecThrustInterval = function() {
    if (! this.decThrustIntervalId) return false;
    clearInterval(this.decThrustIntervalId);
    this.decThrustIntervalId = null;
    return true;
}


Ship.prototype.startSlowingDown = function() {
    // console.log("slowing down...");
    if (this.slowDownIntervalId) return;

    var self = this;
    this.slowDownIntervalId = setInterval(function(){
	self.slowDown()
    }, 100);
}

Ship.prototype.clearSlowDownInterval = function() {
    if (! this.slowDownIntervalId) return false;
    clearInterval(this.slowDownIntervalId);
    this.slowDownIntervalId = null;
    return true;
}

Ship.prototype.slowDown = function() {
    var vDrag = 0.01;
    if (this.vX > 0) {
	this.vX -= vDrag;
    } else if (this.vX < 0) {
	this.vX += vDrag;
    }
    if (this.vY > 0) {
	this.vY -= vDrag;
    } else if (this.vY < 0) {
	this.vY += vDrag;
    }

    if (Math.abs(this.vX) <= vDrag) this.vX = 0;
    if (Math.abs(this.vY) <= vDrag) this.vY = 0;

    if (this.vX == 0 && this.vY == 0) {
	// console.log('done slowing down');
	this.clearSlowDownInterval();
    }
}
  
/*********************************************************************
 * Spin
 */
Ship.prototype.startIncreaseSpin = function() {
    if (this.increaseSpin) return;
    this.increaseSpin = true;
    // console.log("spin++");

    this.clearStopSpinInterval();

    this.incSpin( this.spinIncrement );
    var self = this;
    this.incSpinIntervalId = setInterval(function(){
	self.incSpin( self.spinIncrement );
    }, 50);
    
};
  
Ship.prototype.stopIncreaseSpin = function() {
    // console.log("stop spin++");
    this.clearIncSpinInterval();
    this.startSlowDownSpin();
    this.increaseSpin = false;
};

Ship.prototype.clearIncSpinInterval = function() {
    if (! this.incSpinIntervalId) return false;
    clearInterval(this.incSpinIntervalId);
    this.incSpinIntervalId = null;
    return true;
}

Ship.prototype.startDecreaseSpin = function() {
    if (this.decreaseSpin) return;
    this.decreaseSpin = true;
    // console.log("spin--");

    this.clearStopSpinInterval();

    this.incSpin( -this.spinIncrement );
    var self = this;
    this.decSpinIntervalId = setInterval(function(){
	self.incSpin( -self.spinIncrement );
    }, 50);
};

Ship.prototype.stopDecreaseSpin = function() {
    // console.log("stop spin--");
    this.clearDecSpinInterval();
    this.startSlowDownSpin();
    this.decreaseSpin = false;
}

Ship.prototype.clearDecSpinInterval = function() {
    if (! this.decSpinIntervalId) return false;
    clearInterval(this.decSpinIntervalId);
    this.decSpinIntervalId = null;
    return true;
}

Ship.prototype.startSlowDownSpin = function() {
    // console.log("stopping spin...");
    if (this.stopSpinIntervalId) return;

    var self = this;
    this.stopSpinIntervalId = setInterval(function(){
	self.slowDownSpin()
    }, 20);
}

Ship.prototype.clearStopSpinInterval = function() {
    if (! this.stopSpinIntervalId) return false;
    clearInterval(this.stopSpinIntervalId);
    this.stopSpinIntervalId = null;
    return true;
}


Ship.prototype.slowDownSpin = function() {
    if (this.spin > deg_to_rad[1]) {
	this.spin -= deg_to_rad[1];
    } else if (this.spin < -deg_to_rad[1]) {
	this.spin += deg_to_rad[1];
    } else {
	this.spin = 0;
	// console.log("spin stopped.");
	this.clearStopSpinInterval();
    }
}

/*********************************************************************
 * Firing weapons
 */
Ship.prototype.startFireWeapon = function() {
    if (this.firing) return;
    this.firing = true;
    // console.log("firing");

    var weapon = this.currentWeapon;
    weapon.fire(); // fire one, then wait
    this.firingIntervalId = setInterval(function(){
	weapon.fire();
    }, weapon.fireInterval);

    // TODO: weapon change should reset interval
};

Ship.prototype.stopFireWeapon = function() {
    // console.log("stop firing");
    if (this.firingIntervalId) {
	clearInterval(this.firingIntervalId);
	this.firingIntervalId = null;
    }
    this.firing = false;
};

Ship.prototype.fireWeapon = function() {
    // TODO: don't hard-code weapon
    var fireThrust = 2.5;
    var scaleX = Math.cos(this.facing) * fireThrust;
    var scaleY = Math.sin(this.facing) * fireThrust;
    var vX = this.vX + scaleX;
    var vY = this.vY + scaleY;
    var bullet = new Bullet(this, {
	x: this.x,
	y: this.y,
	facing: this.facing,
	vX: vX,
	vY: vY,
    });
    this.game.fireWeapon(bullet);
}

/*********************************************************************
 * Weapon Selection
 */
Ship.prototype.startCycleWeapon = function() {
    if (this.cyclingWeapon) return;
    this.cyclingWeapon = true;
    this.cycleWeapon();
};

Ship.prototype.stopCycleWeapon = function() {
    this.cyclingWeapon = false;
}

Ship.prototype.cycleWeapon = function() {
    var idx = this.weapons.indexOf(this.currentWeapon) + 1;
    if (idx > this.weapons.length-1) idx = 0;
    this.currentWeapon = this.weapons[idx];
    console.log(this + " cycled weapon to " + this.currentWeapon);
}


/*********************************************************************
 * Health & Shield
 */
Ship.prototype.decHealth = function(delta) {
    if (this.shieldActive) {
	delta = this.decShield(delta);
    }
    if (delta) Ship.prototype.parent.decHealth.call(this, delta);
}

Ship.prototype.decShield = function(delta) {
    this.shieldChanged = true;
    this.shield -= delta;
    if (this.shield <= 0) {
	delta = -this.shield;
	this.shield = 0;
	this.shieldActive = false;
	return delta;
    }
}

Ship.prototype.incShield = function(delta) {
    this.shieldChanged = true;
    this.shield += delta;
    if (this.shield > 100) this.shield = 100;
}


/*********************************************************************
 * ComputerShip - basic computer controlled ship
 * Copyright (c) 2012 Steve Purkis
 */

function ComputerShip(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

ComputerShip.inheritsFrom( Ship );

ComputerShip.prototype.initialize = function(game, spatial) {
    this.oid_prefix = "cshp";
    ComputerShip.prototype.parent.initialize.call(this, game, spatial);
}

ComputerShip.prototype.updatePositions = function() {
    if (this.died) return;
    this.findAndDestroyClosestEnemy();
    ComputerShip.prototype.parent.updatePositions.call(this);
}

ComputerShip.prototype.findAndDestroyClosestEnemy = function() {
    var enemy = this.findClosestEnemy();
    if (enemy == null) return;

    // Note: this is a basic algorith, it doesn't take a lot of things
    // into account (enemy trajectory & facing, other objects, etc)

    // navigate towards enemy
    if (enemy.dFacing > 0) {
	if (enemy.dFacing < deg_to_rad[45]) {
	    if (this.spin <= 0) {
		// if we're not spinning towards them, start:
		if (this.decreaseSpin) this.stopDecreaseSpin();
		this.startIncreaseSpin();
	    } else if (this.spin > deg_to_rad[1]) {
		// high -'ve spin
		// stop increasing spin so we don't overshoot
		if (this.increaseSpin) this.stopIncreaseSpin();
		// it may make sense to decrease spin so we don't overshoot:
		if (enemy.dFacing < deg_to_rad[10]) this.startDecreaseSpin();
	    } else if (this.spin > deg_to_rad[0.25]) {
		// stop increasing spin so we don't overshoot
		if (this.increaseSpin) this.stopIncreaseSpin();
	    } else {
		// if we're not spinning towards them, start:
		if (this.decreaseSpin) this.stopDecreaseSpin();
		if (enemy.dFacing > deg_to_rad[0.25]) this.startIncreaseSpin();
	    }
	} else {
	    // if we're not spinning towards them, start:
	    if (this.decreaseSpin) this.stopDecreaseSpin();
	    this.startIncreaseSpin();
	}
    } else if (enemy.dFacing < 0) {
	if (enemy.dFacing > -deg_to_rad[45]) {
	    if (this.spin >= 0) {
		// if we're not spinning towards them, start:
		if (this.increaseSpin) this.stopIncreaseSpin();
		this.startDecreaseSpin();
	    } else if (this.spin < -deg_to_rad[1]) {
		// high -'ve spin
		// stop decreasing spin so we don't overshoot
		if (this.decreaseSpin) this.stopDecreaseSpin();
		// it may make sense to increase spin so we don't overshoot:
		if (enemy.dFacing > -deg_to_rad[10]) this.startIncreaseSpin();
	    } else if (this.spin < -deg_to_rad[0.25]) {
		// stop decreasing spin so we don't overshoot
		if (this.decreaseSpin) this.stopDecreaseSpin();
	    } else {
		// if we're not spinning towards them, start:
		if (this.increaseSpin) this.stopIncreaseSpin();
		if (enemy.dFacing < -deg_to_rad[0.25]) this.startDecreaseSpin();
	    }
	} else {
	    // if we're not spinning towards them, start:
	    if (this.increaseSpin) this.stopIncreaseSpin();
	    this.startDecreaseSpin();
	}
    } else {
	// if we're not spinning towards them, start:
	if (this.spin > 0) {
	    if (this.increaseSpin) this.stopIncreaseSpin();
	    if (this.spin > deg_to_rad[0.25]) this.startDecreaseSpin();
	} else if (this.spin < 0) {
	    if (this.decreaseSpin) this.stopDecreaseSpin();
	    if (this.spin < -deg_to_rad[0.25]) this.startIncreaseSpin();
	} else {
	    // enemy.dFacing == 0, on target!
	}
    }

    // move towards / away?
/*    if (enemy.dist_squared > 40000) {
	if (this.decelerate) this.stopDecelerate();
	if (enemy.dFacingAbs <= deg_to_rad[10]) {
	    if (this.thrust > this.maxThrust/3) {
		if (this.accelerate) this.stopAccelerate();
	    } else {
		this.startAccelerate();
	    }
	} else {
	    if (this.accelerate) this.stopAccelerate();
	}
    } else
*/
    var speed_squared = this.vX*this.vX + this.vY + this.vY;
    if (enemy.dist_squared > 10000) {
	if (this.decelerate) this.stopDecelerate();
	if (speed_squared > 1 || this.thrust > this.maxThrust/4) {
	    if (this.accelerate) this.stopAccelerate();
	} else {
	    this.startAccelerate();
	}
    } else if (enemy.dist_squared > 20) {
	if (this.decelerate) this.stopDecelerate();
	if (speed_squared > 1 || this.thrust > this.maxThrust/10) {
	    if (this.accelerate) this.stopAccelerate();
	} else {
	    this.startAccelerate();
	}
    } else {
	if (this.accelerate) this.stopAccelerate();
	if (this.decelerate) this.stopDecelerate();
    }

    // shoot at the enemy
    var abs_spin = Math.abs(this.spin);
    if (abs_spin <= deg_to_rad[0.5]) {
	if (enemy.dist_squared > 90000) { // 300*300 = 90,000
	    // don't waste ammo
	    if (this.firing) this.stopFireWeapon();
	} else if (enemy.dist_squared > 40000) { // 200*200 = 40,000
	    if (enemy.dFacingAbs <= deg_to_rad[0.5]) {
		// use the cannon at this angle
		if (this.currentWeapon.is_cannon) {
		    this.startFireWeapon();
		} else {
		    if (this.firing) this.stopFireWeapon();
		    this.cycleWeapon(); // be fair, only cycle once
		}
	    }
	    // otherwise don't bother shooting from this far away
	} else if (enemy.dFacingAbs <= deg_to_rad[10]) {
	    // use the normal gun at this angle
	    if (this.currentWeapon.is_basic_gun) {
		this.startFireWeapon();
	    } else {
		if (this.firing) this.stopFireWeapon();
		this.cycleWeapon(); // be fair, only cycle once
	    }
	} else if (enemy.dFacingAbs <= deg_to_rad[20]) {
	    // use the spray gun at this angle
	    if (this.currentWeapon.is_spray_gun) {
		this.startFireWeapon();
	    } else {
		if (this.firing) this.stopFireWeapon();
		this.cycleWeapon(); // be fair, only cycle once
	    }
	} else {
	    if (this.firing) this.stopFireWeapon();
	}
    } else {
	if (this.firing) this.stopFireWeapon();
    }

    ComputerShip.prototype.parent.updatePositions.call(this);
}

ComputerShip.prototype.findClosestEnemy = function() {
    if (this.ships == null) {
	this.ships = this.game.objects.filter(function(object) {
	    if (object.is_ship && object != this) return true;
	    return false;
	});
    }

    var highest_dist_squared = 0;
    var enemy = null;
    for (var i=0; i < this.ships.length; i++) {
	var ship2 = this.ships[i];
	var dX = ship2.x - this.x;
	var dY = ship2.y - this.y;
	var dist_squared = dX*dX + dY*dY;
	if (dist_squared > highest_dist_squared) {
	    enemy = {
		ship: ship2,
		dX: dX,
		dY: dY,
		dist_squared: dist_squared,
	    };
	}
    }

    if (enemy) {
	enemy.angle = Math.atan2(enemy.dY, enemy.dX);

	// get delta between our facing angle as: -180º <= a <= 180º ...
	enemy.angle_positive = (deg_to_rad[360] + enemy.angle) % deg_to_rad[360];
	enemy.dFacing = (enemy.angle_positive - this.facing) % deg_to_rad[360];
	// there must be a better way :-/
	if (enemy.dFacing > deg_to_rad[180]) {
	    enemy.dFacing -= deg_to_rad[360];
	} else if (enemy.dFacing < -deg_to_rad[180]) {
	    enemy.dFacing += deg_to_rad[360];
	}

	enemy.dFacingAbs = Math.abs(enemy.dFacing);

	// if (enemy.dFacing < 0) enemy.dFacing = deg_to_rad[360];
    }

    return enemy;
}
