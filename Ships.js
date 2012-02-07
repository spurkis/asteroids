/*********************************************************************
 * Ship - a ship in a game of asteroids
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');

function Ship(game, startX, startY) {
    if (game) return this.initialize(game, startX, startY);
    return this;
}

Ship.inheritsFrom( SpaceObject );

Ship.prototype.initialize = function(game, startX, startY) {
    Ship.prototype.parent.initialize.call(this, game, startX, startY);
    this.mass = 10;
    this.is_ship = true;

    // current state of action:
    this.increaseSpin = false;
    this.decreaseSpin = false;
    this.accelerate = false;
    this.decelerate = false;
    this.firing = false;

    // for calculating impact:
    this.radius = 7;
    this.radiusSquared = Math.pow(this.radius,2);
    this.damage = 2;

    // for moving about:
    this.thrust = 0;
    this.thrustIncrement = 0.01;
    this.spin = 0;
    this.spinIncrement = deg_to_rad[0.5];
    this.maxSpin = deg_to_rad[6];

    // shields
    this.shield = 100;
    this.shieldActive = true;

    return this;
}

Ship.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    // TODO: replace these with .png's?
    var r = 200 - this.health*2;
    ctx.strokeStyle = 'rgb('+ r +',0,0)';
    ctx.beginPath();
    ctx.moveTo(-7,7);
    ctx.lineTo(0,-7);
    ctx.lineTo(7,7);
    ctx.quadraticCurveTo(0,0, -7,7);

    if (this.accelerate) {
	ctx.moveTo(-3,4);
	ctx.lineTo(-3,12);
	ctx.moveTo(0,4);
	ctx.lineTo(0,9);
	ctx.moveTo(3,4);
	ctx.lineTo(3,12);
    }

    if (this.decelerate) {
	ctx.moveTo(-3,-6);
	ctx.lineTo(-3,-10);
	ctx.moveTo(-6,0);
	ctx.lineTo(-6,-8);
	ctx.moveTo(3,-6);
	ctx.lineTo(3,-10);
	ctx.moveTo(6,0);
	ctx.lineTo(6,-8);
    }

    if (this.increaseSpin) {
	ctx.moveTo(-3,-5);
	ctx.lineTo(-6,-5);
    }

    if (this.decreaseSpin) {
	ctx.moveTo(3,-5);
	ctx.lineTo(6,-5);
    }

    ctx.closePath();
    ctx.stroke();

    if (this.shieldActive) {
	ctx.beginPath();
	ctx.arc(0, 0, this.radius+2, 0, deg_to_rad[360], false);
	var r = 0;
	var g = this.shield*2;
	var b = this.shield*2 + 55;
	var a = 0.5;
	ctx.strokeStyle = 'rgba('+ r +','+ g +','+ b +','+ a +')';
	ctx.closePath();
	ctx.stroke();
    }

    ctx.restore();
};


/*********************************************************************
 * Acceleration
 */
Ship.prototype.startAccelerate = function() {
    if (this.accelerate) return;
    this.accelerate = true;
    console.log("thrust++");

    this.stopSlowingDown();

    var self = this;
    this.incThrustIntervalId = setInterval(function(){
	self.increaseThrust();
    }, 20);
};

Ship.prototype.increaseThrust = function() {
    if (this.thrust < this.maxThrust) this.thrust += this.thrustIncrement;
    this.accelerateAlong(this.facing, this.thrust);
}


Ship.prototype.stopAccelerate = function() {
    console.log("stop thrust++");
    if (this.incThrustIntervalId) {
	clearInterval(this.incThrustIntervalId);
	this.incThrustIntervalId = null;
	this.thrust=0;
    }

    this.startSlowingDown();
    this.accelerate = false;
};

Ship.prototype.startDecelerate = function() {
    if (this.decelerate) return;
    this.decelerate = true;
    console.log("thrust--");

    this.stopSlowingDown();

    var self = this;
    this.decThrustIntervalId = setInterval(function(){
	self.decreaseThrust();
    }, 20);
};
  
Ship.prototype.decreaseThrust = function() {
    if (this.thrust > -this.maxThrust) this.thrust -= this.thrustIncrement;
    this.accelerateAlong(this.facing, this.thrust);
}

Ship.prototype.stopDecelerate = function() {
    console.log("stop thrust--");
    if (this.decThrustIntervalId) {
	clearInterval(this.decThrustIntervalId);
	this.decThrustIntervalId = null;
	this.thrust=0;
    }

    this.startSlowingDown();
    this.decelerate = false;
};


Ship.prototype.startSlowingDown = function() {
    console.log("slowing down...");
    if (this.slowDownIntervalId) return;

    var self = this;
    this.slowDownIntervalId = setInterval(function(){
	self.slowDown()
    }, 100);
}

Ship.prototype.stopSlowingDown = function() {
    if (this.slowDownIntervalId) {
	clearInterval(this.slowDownIntervalId);
	this.slowDownIntervalId = null;
    }
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
	console.log('done slowing down');
	this.stopSlowingDown();
    }
}
  
/*********************************************************************
 * Spin
 */
Ship.prototype.startIncreaseSpin = function() {
    if (this.increaseSpin) return;
    this.increaseSpin = true;
    console.log("spin++");

    if (this.stopSpinIntervalId) {
	clearInterval(this.stopSpinIntervalId);
	this.stopSpinIntervalId = null;
    }

    this.incSpin( this.spinIncrement );
    var self = this;
    this.incSpinIntervalId = setInterval(function(){
	self.incSpin( self.spinIncrement );
    }, 50);
    
};
  
Ship.prototype.stopIncreaseSpin = function() {
    console.log("stop spin++");
    if (this.incSpinIntervalId) {
	clearInterval(this.incSpinIntervalId);
	this.incSpinIntervalId = null;
    }

    this.startSlowDownSpin();
    
    this.increaseSpin = false;
};

Ship.prototype.startDecreaseSpin = function() {
    if (this.decreaseSpin) return;
    this.decreaseSpin = true;
    console.log("spin--");

    if (this.stopSpinIntervalId) {
	clearInterval(this.stopSpinIntervalId);
	this.stopSpinIntervalId = null;
    }

    this.incSpin( -this.spinIncrement );
    var self = this;
    this.decSpinIntervalId = setInterval(function(){
	self.incSpin( -self.spinIncrement );
    }, 50);
};

Ship.prototype.stopDecreaseSpin = function() {
    console.log("stop spin--");
    if (this.decSpinIntervalId) {
	clearInterval(this.decSpinIntervalId);
	this.decSpinIntervalId = null;
    }

    this.startSlowDownSpin();
    this.decreaseSpin = false;
}

Ship.prototype.startSlowDownSpin = function() {
    console.log("stopping spin...");

    if (this.stopSpinIntervalId) return;

    var self = this;
    this.stopSpinIntervalId = setInterval(function(){
	self.slowDownSpin()
    }, 20);
}

Ship.prototype.slowDownSpin = function() {
    if (this.spin > deg_to_rad[1]) {
	this.spin -= deg_to_rad[1];
    } else if (this.spin < -deg_to_rad[1]) {
	this.spin += deg_to_rad[1];
    } else {
	this.spin = 0;
	console.log("spin stopped.");
	if (this.stopSpinIntervalId) {
	    clearInterval(this.stopSpinIntervalId);
	    this.stopSpinIntervalId = null;
	}
    }
}

Ship.prototype.startFireWeapon = function() {
    if (this.firing) return;
    console.log("firing");

    var self = this;
    this.fireWeapon();
    this.firingIntervalId = setInterval(function(){
	self.fireWeapon();
    }, 150);

    this.firing = true;
};

Ship.prototype.stopFireWeapon = function() {
    console.log("stop firing");
    if (this.firingIntervalId) {
	clearInterval(this.firingIntervalId);
	this.firingIntervalId = null;
    }
    this.firing = false;
};

Ship.prototype.fireWeapon = function() {
    // TODO: don't hard-code weapon
    var fireThrust = 1.5;
    var scaleX = Math.sin(this.facing) * fireThrust;
    var scaleY = -Math.cos(this.facing) * fireThrust;
    var vX = this.vX + scaleX;
    var vY = this.vY + scaleY;
    var bullet = new Bullet(this, this.x, this.y, this.facing, vX, vY);
    this.game.fireWeapon(bullet);
}

Ship.prototype.decHealth = function(delta) {
    if (this.shieldActive) {
	delta = this.decShield(delta);
    }
    if (delta) this.parent.decHealth.call(this, delta);
}

Ship.prototype.decShield = function(delta) {
    this.shield -= delta;
    if (this.shield <= 0) {
	delta = -this.shield;
	this.shield = 0;
	this.shieldActive = false;
	return delta;
    }
}
