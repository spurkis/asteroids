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
	asteroids = new AsteroidsGame(ctx);
	asteroids.startGameLoop();
    } else {
	console.log("no canvas available");
    }
}



