/*********************************************************************
 * Asteroids Game Logic
 * Copyright (c) 2012 Steve Purkis
 */

var asteroids = null;

/* cache some commonly used calculations for speed & readability */
var PI = Math.PI;

var deg_to_rad = [];
for (var i=0; i<=360; i++) {
    deg_to_rad[i] = i*PI/180;
}

function setupCanvas() {
    var canvas = document.getElementById("game");
    if (canvas.getContext) {
	var ctx = canvas.getContext('2d');
	console.log("canvas available");
	asteroids = new AsteroidsGame(ctx);
	asteroids.startGameLoop();
    } else {
	console.log("no canvas available");
    }
}



/*********************************************************************
 * Classes
 */
Function.prototype.inheritsFrom = function( parentClassOrObject ) {
    // thanks to http://phrogz.net/js/classes/OOPinJS2.html
    if ( parentClassOrObject.constructor == Function ) {
	// Normal Inheritance
	this.prototype = new parentClassOrObject;
	this.prototype.constructor = this;
	this.prototype.parent = parentClassOrObject.prototype;
    } else { 
	// Pure Virtual Inheritance
	this.prototype = parentClassOrObject;
	this.prototype.constructor = this;
	this.prototype.parent = parentClassOrObject;
    }
    return this;
} 

function AsteroidsGame(ctx) {
    this.ctx = ctx;
    this.refreshRate = 10; // ms
    this.maxX = ctx.canvas.width;
    this.maxY = ctx.canvas.height;
    this.weaponsFired = [];
    this.asteroids = [];
    this.planets = [];

    // hard-code 1 player for now & start co-ords
    this.ship = new Ship(this, 1/5*this.maxX, 2/3*this.maxY);

    this.planets.push(new Planet(this, 3/4*this.maxX, 1/4*this.maxY, 20, 25),
		      new Planet(this, 1/5*this.maxX, 2/5*this.maxY, 5, 10),
		      new Planet(this, 5/7*this.maxX, 4/5*this.maxY, 10, 10),
		      new Planet(this, 1/2*this.maxX, 2/3*this.maxY, 10, 20) );

    this.asteroids.push(new Asteroid(this, 1/10*this.maxX, 1/10*this.maxY, 1, 4, -0.1, 0.5, 0, 0 ),
			new Asteroid(this, 1/10*this.maxX, 2/10*this.maxY, 1, 5, -0.1, 0.4, 0, 0 ),
			new Asteroid(this, 5/10*this.maxX, 1/10*this.maxY, 1, 6, -0.2, 0.3, 0, 0 ),
			new Asteroid(this, 5/10*this.maxX, 2/10*this.maxY, 1, 7, -0.3, 0.2, 0, 0 ),
			new Asteroid(this, 6/10*this.maxX, 8/10*this.maxY, 1, 6, -0.4, 0.1, 0, 0 ),
			new Asteroid(this, 6/10*this.maxX, 9/10*this.maxY, 1, 7, 0.5, -0.5, 0, 0 ),
			new Asteroid(this, 9/10*this.maxX, 8/10*this.maxY, 1, 6, 0.6, 0.4, 0, 0 ),
			new Asteroid(this, 9/10*this.maxX, 9/10*this.maxY, 1, 7, 0.7, 0.6, 0, 0 ),
			new Asteroid(this, 3/10*this.maxX, 1/10*this.maxY, 1, 6, 0.8, -0.2, 0, 0 ),
			new Asteroid(this, 3/10*this.maxX, 2/10*this.maxY, 1, 7, 0.9, -0.1, 0, 0 ) );

    this.setDefaultCanvasState();
    this.bindDefaultKeys();
}

AsteroidsGame.prototype.setDefaultCanvasState = function() {
    var ctx = this.ctx;
    // set & save default canvas state
    ctx.globalCompositeOperation = 'destination-over';  
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.save();
};  

AsteroidsGame.prototype.bindDefaultKeys = function() {
    var self = this;
    $("#target").keydown(function(event) {self.handleKeyEvent(event)});
    $("#target").keyup(function(event) {self.handleKeyEvent(event)});
}

AsteroidsGame.prototype.handleKeyEvent = function(event) {
    event.preventDefault();
    // TODO: send events, get rid of ifs.
    switch (event.which) {
    case 38: // up = accel
	if (event.type == 'keydown') {
	    this.ship.startAccelerate();
	} else { // assume keyup
	    this.ship.stopAccelerate();
	}
	break;
    case 40: // down = decel
	if (event.type == 'keydown') {
	    this.ship.startDecelerate();
	} else { // assume keyup
	    this.ship.stopDecelerate();
	}
	break;
    case 37: // left = accel ccw
	if (event.type == 'keydown') {
	    this.ship.startDecreaseSpin();
	} else { // assume keyup
	    this.ship.stopDecreaseSpin();
	}
	break;
    case 39: // right = accel cw
	if (event.type == 'keydown') {
	    this.ship.startIncreaseSpin();
	} else { // assume keyup
	    this.ship.stopIncreaseSpin();
	}
	break;
    case 32: // space = fire
	if (event.type == 'keydown') {
	    this.ship.startFireWeapon();
	} else { // assume keyup
	    this.ship.stopFireWeapon();
	}
	break;

	// alternate
    case 101: // e = up
	break;
    case 100: // d = down
	break;
    case 115: // s = accel ccw
	break;
    case 102: // f = accel cw
	break;

    case 13:  // <enter>
	break;
    }
}


AsteroidsGame.prototype.startGameLoop = function() {
    if (this.intervalId) {
	console.log("startGameLoop aborted: already started with interval="+ this.intervalId);
	return;
    }

    // separate computation from re-drawing...
    var self = this;
    this.intervalId = setInterval(function(){
	self.updatePositions();
    }, this.refreshRate);
    this.intervalId = setInterval(function(){
	self.draw();
    }, this.refreshRate);
};  

AsteroidsGame.prototype.draw = function() {
    this.ctx.clearRect(0,0, this.maxX,this.maxY); // clear canvas
    for (var i=0; i < this.planets.length; i++) {
	this.planets[i].draw();
    }
    for (var i=0; i < this.asteroids.length; i++) {
	this.asteroids[i].draw();
    }
    this.ship.draw();
    for (var id in this.weaponsFired) {
	this.weaponsFired[id].draw();
    }
};

AsteroidsGame.prototype.updatePositions = function() {
    this.ship.updatePositions(this.planets);
    for (var i=0; i < this.asteroids.length; i++) {
	this.asteroids[i].updatePositions(this.planets);
    }
    for (var id in this.weaponsFired) {
	this.weaponsFired[id].updatePositions(this.planets);
    }
};

AsteroidsGame.prototype.fireWeapon = function(weapon) {
    var self = this;
    weapon.timeoutId = setTimeout(function(){
	self.weaponTimeout(weapon);
    }, weapon.ttl);
    // force associative array by prepending a 't':
    this.weaponsFired['t'+weapon.timeoutId] = weapon;
}

AsteroidsGame.prototype.weaponTimeout = function(weapon) {
    delete this.weaponsFired['t'+weapon.timeoutId];
    weapon.weaponTimeout();
}



function Ship(game, startX, startY) {
    if (game) return this.initialize(game, startX, startY);
    return this;
}

Ship.prototype.initialize = function(game, startX, startY) {
    this.game = game;
    this.ctx = game.ctx;
    this.x = startX;  // position on the grid
    this.y = startY;  // position on the grid
    this.maxX = this.ctx.canvas.width;
    this.maxY = this.ctx.canvas.height;
    this.velocityX = 0;  // speed along X axis in pixels/sec
    this.velocityY = 0;  // speed along Y axis in pixels/sec
    this.maxVelocityX = 2;
    this.maxVelocityY = 2;
    this.thrust = 0;
    this.maxThrust = 0.5;
    this.heading = 0; // angle in Rad
    this.facing = 0;  // angle in Rad
    this.spin = 0;    // spin in Rad/sec
    this.mass = 1;
    this.maxSpin = deg_to_rad[10];

    // current state of action:
    this.increaseSpin = false;
    this.decreaseSpin = false;
    this.accelerate = false;
    this.decelerate = false;
    this.firing = false;

    return this;
}


Ship.prototype.updatePositions = function(planets) {
    this.facing += this.spin;
    if (this.facing >= deg_to_rad[360] || this.facing <= deg_to_rad[360]) {
	this.facing = this.facing % deg_to_rad[360];
    }
    if (this.facing < 0) {
	this.facing = deg_to_rad[360] + this.facing;
    }

    // apply gravity
    if (planets) {
	for (var i=0; i < planets.length; i++) {
	    var planet = planets[i];
	    var dX = this.x-planet.x;
	    var dY = this.y-planet.y;
	    var dist_squared = Math.pow(dX, 2) + Math.pow(dY, 2);
	    // var dist = sqrt(pow(x2-x1, 2) + pow(y2-y1, 2)); // slow

	    if (dist_squared > planet.radiusSquared) {
		var accel = planet.mass / dist_squared;
		if (accel > 1) accel = 1;
		//var accel = F/this.mass;
		var angle = Math.atan2(dX, dY);
		var scaleX = -Math.sin(angle) * accel;
		var scaleY = -Math.cos(angle) * accel;

		this.incVelocity(scaleX, scaleY);
	    } else {
		// so close they've impacted, stop unless they're thrusting
		if (this.thrust == 0) {
		    this.velocityX = 0;
		    this.velocityY = 0;
		}
	    }
	}
    }

    this.incX(this.velocityX);
    this.incY(this.velocityY);
}


Ship.prototype.incX = function(dX) {
    this.x += dX;
    if (this.x < 0) this.x = this.maxX + this.x;
    if (this.x > this.maxX) this.x = this.x - this.maxX;
}

Ship.prototype.incY = function(dY) {
    this.y += dY;
    if (this.y < 0) this.y = this.maxY + this.y;
    if (this.y > this.maxY) this.y = this.y - this.maxY;
}

Ship.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate( this.x, this.y );
    if (this.facing > 0) ctx.rotate( this.facing );

    // TODO: replace these with .png's?
    ctx.beginPath();
    ctx.moveTo(-7,7);
    ctx.lineTo(0,-7);
    ctx.lineTo(7,7);
    ctx.quadraticCurveTo(0,0, -7,7);
    ctx.closePath();

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

    ctx.stroke();
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
    if (this.thrust < this.maxThrust) this.thrust += 0.01;
    this.accelerateAlong(this.facing, this.thrust);
}

Ship.prototype.accelerateAlong = function(angle, thrust) {
    var scaleX = Math.sin(angle) * thrust;
    var scaleY = -Math.cos(angle) * thrust;
    this.incVelocity(scaleX, scaleY);
}

Ship.prototype.incVelocity = function(dX, dY) {
    if (dX != 0) {
	this.velocityX += dX;
	if (this.velocityX > this.maxVelocityX) {
	    this.velocityX = this.maxVelocityX;
	} else if (this.velocityX < -this.maxVelocityX) {
	    this.velocityX = -this.maxVelocityX;
	}
    }
    if (dY != 0) {
	this.velocityY += dY;
	if (this.velocityY > this.maxVelocityY) {
	    this.velocityY = this.maxVelocityY;
	} else if (this.velocityY < -this.maxVelocityY) {
	    this.velocityY = -this.maxVelocityY;
	}
    }
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
    if (this.thrust > -this.maxThrust) this.thrust -= 0.01;
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
    if (this.velocityX > 0) {
	this.velocityX -= 0.01; // drag
    } else if (this.velocityX < 0) {
	this.velocityX += 0.01; // drag
    }
    if (this.velocityY > 0) {
	this.velocityY -= 0.01; // drag
    } else if (this.velocityY < 0) {
	this.velocityY += 0.01; // drag
    }

    if (Math.abs(this.velocityX) <= 0.01) this.velocityX = 0;
    if (Math.abs(this.velocityY) <= 0.01) this.velocityY = 0;

    if (this.velocityX == 0 && this.velocityY == 0) {
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

    var self = this;
    this.incSpinIntervalId = setInterval(function(){
	self.incSpin( deg_to_rad[1] );
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

    var self = this;
    this.decSpinIntervalId = setInterval(function(){
	self.incSpin( -deg_to_rad[1] );
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
};

Ship.prototype.incSpin = function(delta) {
    if (delta != 0) {
	this.spin += delta;
	if (this.spin > this.maxSpin) {
	    this.spin = this.maxSpin;
	} else if (this.spin < -this.maxSpin) {
	    this.spin = -this.maxSpin;
	}
    }
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
    var vX = this.velocityX + scaleX;
    var vY = this.velocityY + scaleY;
    var bullet = new Bullet(this, this.x, this.y, this.facing, vX, vY);
    this.game.fireWeapon(bullet);
}


/*********************************************************************
 * Bullet class
 */
function Bullet(ship, startX, startY, facing, vX, vY) {
    if (ship) return this.initialize(ship, startX, startY, facing, vX, vY);
    return this;
}
Bullet.inheritsFrom( Ship );

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


/*********************************************************************
 * Planet class
 */
function Planet(game, startX, startY, mass, radius) {
    if (game) return this.initialize(game, startX, startY, mass, radius);
    return this;
}

Planet.inheritsFrom( Ship );

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

