/**
 * Cargo cult of:
 * http://www.webreference.com/programming/javascript/gr/column3/index.html
 * with some modifications to track original urls, debugging, delayed start.
 */
function ImagePreloader(imageUrls, callback) {
    // store the callback
    this.callback = callback;
    this.imageUrls = imageUrls;

    // initialize internal state.
    this.loaded = 0;
    this.processed = 0;
    this.total = imageUrls.length;
    this.images = {};
}

ImagePreloader.prototype.start = function() {
    // for each imageUrl, call preload()
    for ( var i = 0; i < this.imageUrls.length; i++ ) {
	this.preload(this.imageUrls[i]);
    }
}

/** 
 * The callback function is stored for later use, then each image URL
 * is passed into the preload() method.
 */
 

ImagePreloader.prototype.preload = function(imageUrl) {
    // create new Image object and add to array
    var image = new Image;
    this.images[imageUrl] = image;

    // set up event handlers for the Image object
    image.onload  = ImagePreloader.prototype.onload;
    image.onerror = ImagePreloader.prototype.onerror;
    image.onabort = ImagePreloader.prototype.onabort;

    // assign pointer back to this.
    image._imagePreloader = this;
    image._loaded = false;

    image._originalUrl = imageUrl;

    console.log("loading image: " + imageUrl);

    // assign the .src property to load the Image
    image.src = imageUrl;
}

/**
 * The preload function creates an Image object and assigns functions
 * for the three Image events; onload, onerror and onabort. The onload
 * event is raised when the image has been loaded into memory, the onerror
 * event is raised when an error occurs while loading the image and the
 * onabort event is raised if the user cancels the load by clicking the Stop
 * button on the browser.
 *
 * A pointer to the ImagePreloader object is stored in each Image object to
 * facilitate the callback mechanism. An optional boolean flag can be added
 * here to indicate whether the image loads properly or not.
 *
 * Finally, the “src” attribute is assigned to start the loading of the image.
 */

ImagePreloader.prototype.onComplete = function() {
    this.processed++;
    if ( this.processed == this.total ) {
	this.callback(this.images, this.loaded);
    }
}

ImagePreloader.prototype.onload = function() {
    console.log("loaded image: " + this._originalUrl);
    this._loaded = true;
    this._imagePreloader.loaded++;
    this._imagePreloader.onComplete();
}

ImagePreloader.prototype.onerror = function() {
    console.log("error loading image: " + this._originalUrl);
    this._error = true;
    this._imagePreloader.onComplete();
}

ImagePreloader.prototype.onabort = function() {
    console.log("aborted loading image: " + this._originalUrl);
    this._aborted = true;
    this._imagePreloader.onComplete();
}
