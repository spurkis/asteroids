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
    $("#newgame").click(function(event){
	event.preventDefault();
	$levels.show();
    });

    $("#nav-about").click(function(event){
	event.preventDefault();
	$("#about").toggle();
    });

    for (var i=0; i < gameLevels.length; i++) {
	var level = gameLevels[i];
	var $level = $('<li id="lvl-'+i+'">'+level.description+'</li>');
	$level.on('click', {level: level}, function(event) {
	    loadLevel(event.data.level);
	    $("#levels").hide();
	});
	$levels.append($level);
    }
}

function loadLevel(level) {
    _gaq.push(['_trackEvent', 'loadLevel', level.description])
    var canvas = document.getElementById("game");
    if (canvas.getContext) {
	var ctx = canvas.getContext('2d');
	console.log("canvas available");

	if (asteroids) asteroids.killGame();

	var startGame = function(images) {
	    $("#controls").focus();

	    try {
		asteroids = new AsteroidsGame(ctx, level, images);
		asteroids.startGameLoop();
	      } catch (e) {
		  console.log("caught exception: " + e);
		  asteroids.stop();
	      }
	}

	var imagesLoaded = function(images, loaded) {
	    // TODO: handle errors
	    level.loadedImages = images;
	    startGame(images);
	}

	if (level.images) {
	    if (level.loadedImages) {
		startGame(level.loadedImages);
	    } else {
		var imageLoader = new ImagePreloader(level.images, imagesLoaded);
		imageLoader.start();
	    }
	} else {
	    startGame({});
	}
    } else {
	console.log("no canvas available");
    }
}



