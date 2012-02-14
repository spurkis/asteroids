/*********************************************************************
 * Asteroids Game Logic
 * Copyright (c) 2012 Steve Purkis
 */

var asteroids = null; // global access to the game object

function require(filename) {
    ; // do nothing - so I can test with node.js
}

function setupNav() {
    var $levels = $("#levels");
    $("#newgame").mouseover(function(){
	$levels.show();
    });
    $("#newgame").mouseout(function(){
	$levels.hide();
    });

    $("#nav-about").click(function(event){
	event.preventDefault();
	$("#about").toggle();
    });

    for (var i=0; i < gameLevels.length; i++) {
	var level = gameLevels[i];
	var $level = $('<li id="lvl-'+i+'">'+level.name+'</li>');
	$level.on('click', {level: level}, function(event) {
	    loadLevel(event.data.level);
	    $("#levels").hide();
	});
	$levels.append($level);
    }
}

function loadLevel(level) {
    var canvas = document.getElementById("game");
    if (canvas.getContext) {
	var ctx = canvas.getContext('2d');
	console.log("canvas available");

	if (asteroids) {
	    asteroids.killGame();
	}

	$("#controls").focus();

//      try {
	    asteroids = new AsteroidsGame(ctx, level);
	    asteroids.startGameLoop();
/*
	} catch (e) {
	    console.log("caught exception: " + e);
	    asteroids.stop();
	}
/**/

    } else {
	console.log("no canvas available");
    }
}



