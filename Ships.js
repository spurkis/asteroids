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
    spatial.thrust = 0;
    spatial.spin = 0;
    spatial.maxSpin = deg_to_rad[6];

    Ship.prototype.parent.initialize.call(this, game, spatial);

    this.is_ship = true;

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

    // health
    this.healthWidth = 100;
    this.healthHeight = 10;
    this.healthX = this.maxX - this.healthWidth - 10;
    this.healthY = 10;

    return this;
}

Ship.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    // TODO: replace these with .png's?

    if (this.healthChanged || this.healthRedVal == null) {
	this.healthRedVal = 200 - this.health*2;
    }

    ctx.strokeStyle = 'rgb('+ this.healthRedVal +',0,0)';
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
    ctx.restore();

    this.drawHealth();
    this.drawShield();
}

Ship.prototype.drawHealth = function() {
    if (this.healthChanged || this.healthCache == null) {
	this.healthCache = {
	    r: 200 - this.health*2,
	    g: this.health*2 + 50,
	    b: this.health,
	    fillWidth: Math.floor(this.health/100 * this.healthWidth)
	};
    }

    var ctx = this.ctx;
    var hc = this.healthCache;
    ctx.save();
    ctx.translate( this.healthX, this.healthY );

    ctx.beginPath();
    ctx.fillStyle = 'rgba('+ hc.r +','+ hc.g +','+ hc.b +',0.5)';
    ctx.fillRect(0,0,hc.fillWidth, this.healthHeight);
    ctx.strokeStyle = 'rgba(5,5,5,0.75)';
    ctx.strokeRect(0,0,this.healthWidth,this.healthHeight);
    ctx.closePath();

    ctx.restore();
}

Ship.prototype.drawShield = function() {
    if (! this.shieldActive) return;

    if (this.shieldChanged || this.shieldCache == null) {
	this.shieldCache = {
	    // shield colour displayed around ship
	    r: this.shield,
	    g: this.shield*2,
	    b: this.shield*2+55,
	    a: 0.5,
	    bar: {
		fillWidth: Math.floor(this.shield/100 * this.healthWidth),
		startY: Math.floor(this.healthHeight/3),
		height: Math.floor(this.healthHeight/3),
	    }
	};
    }

    var ctx = this.ctx;
    var sc = this.shieldCache;

    // draw shield as a circle around ship
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.beginPath();
    ctx.strokeStyle = 'rgba('+ sc.r +','+ sc.g +','+ sc.b +','+ sc.a +')';
    ctx.arc(0, 0, this.radius+2, 0, deg_to_rad[360], false);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // draw shield status on top of health bar:
    ctx.save();
    ctx.translate( this.healthX, this.healthY );
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100,100,225,0.8)';
    ctx.fillRect(0,sc.bar.startY, sc.bar.fillWidth, sc.bar.height);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}



/*********************************************************************
 * Acceleration
 */
Ship.prototype.startAccelerate = function() {
    if (this.accelerate) return;
    this.accelerate = true;
    //console.log("thrust++");

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
    //console.log("stop thrust++");
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
    //console.log("thrust--");

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
    // console.log("stop thrust--");
    if (this.decThrustIntervalId) {
	clearInterval(this.decThrustIntervalId);
	this.decThrustIntervalId = null;
	this.thrust=0;
    }

    this.startSlowingDown();
    this.decelerate = false;
};


Ship.prototype.startSlowingDown = function() {
    // console.log("slowing down...");
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
	// console.log('done slowing down');
	this.stopSlowingDown();
    }
}
  
/*********************************************************************
 * Spin
 */
Ship.prototype.startIncreaseSpin = function() {
    if (this.increaseSpin) return;
    this.increaseSpin = true;
    // console.log("spin++");

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
    // console.log("stop spin++");
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
    // console.log("spin--");

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
    // console.log("stop spin--");
    if (this.decSpinIntervalId) {
	clearInterval(this.decSpinIntervalId);
	this.decSpinIntervalId = null;
    }

    this.startSlowDownSpin();
    this.decreaseSpin = false;
}

Ship.prototype.startSlowDownSpin = function() {
    // console.log("stopping spin...");

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
	// console.log("spin stopped.");
	if (this.stopSpinIntervalId) {
	    clearInterval(this.stopSpinIntervalId);
	    this.stopSpinIntervalId = null;
	}
    }
}

Ship.prototype.startFireWeapon = function() {
    if (this.firing) return;
    // console.log("firing");

    var self = this;
    this.fireWeapon();
    this.firingIntervalId = setInterval(function(){
	self.fireWeapon();
    }, 150);

    this.firing = true;
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
    var fireThrust = 1.5;
    var scaleX = Math.sin(this.facing) * fireThrust;
    var scaleY = -Math.cos(this.facing) * fireThrust;
    var vX = this.vX + scaleX;
    var vY = this.vY + scaleY;
    var bullet = new Bullet(this, {
	x: this.x,
	y: this.y,
	facing: this.facing,
	vX: vX,
	vY: vY
    });
    this.game.fireWeapon(bullet);
}

/*********************************************************************
 * Health & Shield
 */
Ship.prototype.decHealth = function(delta) {
    if (this.shieldActive) {
	delta = this.decShield(delta);
    }
    if (delta) this.parent.decHealth.call(this, delta);
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

SpaceObject.prototype.incShield = function(delta) {
    this.shieldChanged = true;
    this.shield += delta;
    if (this.shield > 100) this.shield = 100;
}
