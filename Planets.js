/*********************************************************************
 * Planets & Asteroids - classes for the Asteroids game.
 * Copyright (c) 2012 Steve Purkis
 */

require('asteroidUtils.js');
require('SpaceObject.js');


/*********************************************************************
 * Planetoid - base class
 */
function Planetoid(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Planetoid.inheritsFrom( SpaceObject );

Planetoid.prototype.initialize = function(game, spatial) {
    Planetoid.prototype.parent.initialize.call(this, game, spatial);

    this.is_planetoid = true;
    this.fillStyle = null; // override...
    this.strokeStyle = null; // one of these!

    return this;
}

// TODO: one cache for each radius...
var _planetoidRenderCache = {};
Planetoid.prototype.preRender = function() {
    // Handle images as a special un-cached case:
    if (this.image != null) {
	this.render = this.createPreRenderCanvas(this.radius*2, this.radius*2);
        var ctx = this.render.ctx;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius, 0, deg_to_rad[360], false);
        ctx.closePath();
	ctx.fillStyle = 'white';
	ctx.fill();
        ctx.globalCompositeOperation = 'source-in';
	ctx.drawImage(this.image, 0, 0, this.radius*2, this.radius*2);
	return;
    }

    // cache & share others:
    var key = this.strokeStyle + ":" + this.fillStyle + ":" + this.radius;
    var render = _planetoidRenderCache[key];
    if (render) {
	// already exists in cache:
	this.render = render;
	return; // already exists
    }

    // doesn't exist, so create:
    render = this.createPreRenderCanvas(this.radius*2, this.radius*2);

    // corner of image: offset from bullet strike point
    render.x = -this.radius;
    render.y = -this.radius;

    var ctx = render.ctx;
    ctx.globalCompositeOperation = 'source-over';

    ctx.beginPath();
    ctx.arc(this.radius, this.radius, this.radius, 0, deg_to_rad[360], false);
    ctx.closePath()
    if (this.fillStyle) {
	ctx.fillStyle = this.fillStyle;
	ctx.fill();
    } else {
	ctx.strokeStyle = this.strokeStyle;
	ctx.stroke();
    }

    // cache it
    _planetoidRenderCache[this.color] = render;
    this.render = render;
}

Planetoid.prototype.draw = function() {
    var ctx = this.ctx;
    ctx.drawImage(this.render.canvas, this.x-this.radius, this.y-this.radius);

    // draw trajectory:
    /*
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.strokeStyle = 'orange';
    ctx.lineTo(this.vX*100,this.vY*100);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    */
}

Planetoid.prototype.redraw = function() {
    var ctx = this.ctx;

    ctx.save();
    ctx.translate( this.x_last, this.y_last );
    var corner = -(this.radius+1);
    var width  = this.radius*2 + 2;
    ctx.clearRect(corner, corner, width, width);
    ctx.restore();

    this.draw();
}


/*
Planetoid.prototype.collided = function(object) {
    if (this.damage && !object.is_planetoid) {
	object.decHealth( this.damage );
    }
}
*/

/*********************************************************************
 * Planet class
 */
function Planet(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Planet.inheritsFrom( Planetoid );

Planet.prototype.initialize = function(game, spatial) {
    this.oid_prefix = 'pln';

    spatial.damage = spatial.mass;
    Planet.prototype.parent.initialize.call(this, game, spatial);

    this.fillStyle = "rgba(100,0,0,0.75)";
    this.is_planet = true;
    this.landingThresholdSpeed = 0.4;
    this.landingThresholdAngle = deg_to_rad[8];

    return this;
}

Planet.prototype.collided = function(object, collision) {
    if (object.is_ship) {
	// if the magnitude of the delta-V is small & the ship is
	// facing away from this, then let them land without damage
	//console.log("checking for landing: "+ collision.impactSpeed + "< "+this.landingThresholdSpeed);
	if (collision.impactSpeed < this.landingThresholdSpeed) {
	    var this_collision = collision[this.id];
	    var planet_to_ship_angle = Math.atan2(-this_collision.dY, -this_collision.dX);
	    var delta_angle = Math.abs(object.facing - planet_to_ship_angle) % deg_to_rad[360];
	    //console.log("landing angles: "+ delta_angle + "< "+this.landingThresholdAngle);
	    if (delta_angle <= this.landingThresholdAngle) {
		//console.log(object.id + " landed on " + this.id);
		this.attach(object);
		object.attach(this);
	    }
	    return;
	}
    }
    this.parent.collided.call( this, object, collision );
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
function Asteroid(game, spatial) {
    if (game) return this.initialize(game, spatial);
    return this;
}

Asteroid.inheritsFrom( Planetoid );

Asteroid.prototype.initialize = function(game, spatial) {
    this.oid_prefix = 'ast';

    if (! spatial.health) spatial.health = getRandomInt(5, 30);
    if (spatial.damage == null) spatial.damage = spatial.mass*10;
    Asteroid.prototype.parent.initialize.call(this, game, spatial);

    this.maxSpawnHealth = Math.ceil(this.health/2) || 1;

    this.fillStyle = "rgb(0,100,100)";
    this.is_asteroid = true;
    this.spawn = spatial.spawn != null ? spatial.spawn : getRandomInt(0, 3);

    return this;
}

Asteroid.prototype.collided = function(object, collision) {
    if (! object.is_asteroid) {
	this.parent.collided.call( this, object, collision );
    } else {
	this.colliding[object.id] = object;
    }
}

Asteroid.prototype.die = function() {
    this.parent.die.call( this );
    if (this.spawn > 0) {
	for (var i=0; i < this.spawn; i++) {
	    var mass = Math.floor(this.mass / this.spawn * 1000)/1000;
	    var radius = getRandomInt(2, this.radius);
	    var asteroid = new Asteroid(this.game, {
		mass: mass,
		x: this.x + i/10, // don't overlap
		y: this.y + i/10,
		vX: this.vX * Math.random(),
		vX: this.vY * Math.random(),
		radius:  radius,
		health: getRandomInt(0, this.maxSpawnHealth),
		spawn: getRandomInt(0, this.spawn-1),
                image: getRandomInt(0, 5) > 0 ? this.image : null,
		// let physics engine handle movement
	    });
	    // TODO: debug the weirdness this causes
	    this.game.addObject( asteroid );
	}
    }
}
