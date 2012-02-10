/*********************************************************************
 * Asteroids Game Logic
 * Copyright (c) 2012 Steve Purkis
 */

var asteroids = null; // global access to the game object

function require(filename) {
    ; // do nothing - so I can test with node.js
}

function setupCanvas() {
    var canvas = document.getElementById("game");
    if (canvas.getContext) {
	var ctx = canvas.getContext('2d');
	console.log("canvas available");
	
	var img = new Image();
	img.onload = function(){
	    try {
		asteroids = new AsteroidsGame(ctx, img);
		asteroids.startGameLoop();
	    } catch (e) {
		console.log("caught exception: " + e);
		asteroids.stop();
	    }
	}
	//img.src = "twitter-logo.png";
	img.src = "moon.png";
    } else {
	console.log("no canvas available");
    }
}



