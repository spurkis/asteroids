/*********************************************************************
 * Utils for the Asteroids game
 * Copyright (c) 2012 Steve Purkis
 */

/* cache some commonly used calculations in the global namespace */
var PI = Math.PI;
var halfPI = PI/2;
var deg_to_rad = [];
for (var i=-360; i<=360; i++) {
    deg_to_rad[i] = i*PI/180;
}
deg_to_rad[0.75] = 0.75*PI/180;
deg_to_rad[0.5]  = 0.50*PI/180;
deg_to_rad[0.25] = 0.25*PI/180;

/*********************************************************************
 * Make inheritance a bit easier
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

// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;  
}
