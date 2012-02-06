/*********************************************************************
 * Utils for the Asteroids game
 * Copyright (c) 2012 Steve Purkis
 */

/* cache some commonly used calculations in the global namespace */
var PI = Math.PI;
var deg_to_rad = [];
for (var i=0; i<=360; i++) {
    deg_to_rad[i] = i*PI/180;
}

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

