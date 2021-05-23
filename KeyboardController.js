/**
 * Simple actions avoid a bunch of repetition
 */
function ControllerAction(object, onStart, onStop) {
    this.object = object;
    this.onStart = onStart;
    this.onStop = onStop;
    this.uiElement = null;
}
ControllerAction.prototype.start = function(event) {
    if (this.uiElement) { this.uiElement.classList.add("pressed"); }
    this.onStart.call(this.object, event);
}
ControllerAction.prototype.stop = function(event) {
    if (this.uiElement) { this.uiElement.classList.remove("pressed"); }
    this.onStop.call(this.object, event);
}
ControllerAction.prototype.setUIElement = function(uiElement) {
    this.uiElement = uiElement;
}

/**
 * KeyboardController
 * Attaches to the Document's event handler to listen for given key-up/down events, and
 * fires off events to the ship.  Attaches to a "controlUI" element to provide visual
 * feedback.
 */
 function KeyboardController(actions, controlUI, listenNode = document) {
    this.actions = actions;
    this.actions.ignore = new ControllerAction(this, this.ignore, this.ignore);
    this.controlUI = controlUI;
    this.listenNode = listenNode;
    this.initControlUI().initKeymap().initEventHandlers();
}

KeyboardController.prototype.onDestroy = function() {
    this.removeEventHandlers();
}

KeyboardController.prototype.initControlUI = function() {
    // TODO: in the future, create these elements?
    this.keypadUI = controlUI.getElementsByClassName("keypad")[0];
    this.messageUI = controlUI.getElementsByClassName("message")[0];
    for (var [id, action] of Object.entries(this.actions)) {
        action.setUIElement(this.controlUI.getElementsByClassName(id)[0]);
    }

    return this;
}

KeyboardController.prototype.initKeymap = function() {
    this.keyMap = {
        73: this.actions.forward,    // i
        38: this.actions.forward,    // up
        75: this.actions.backward,   // k
        40: this.actions.backward,   // down
        74: this.actions.ccw,        // j
        37: this.actions.ccw,        // left
        76: this.actions.cw,         // l
        39: this.actions.cw,         // right
        32: this.actions.fire,       // space
        87: this.actions.weapon,     // w
        13: this.actions.ignore      // <enter>
    };

    return this;
}

KeyboardController.prototype.initEventHandlers = function() {
    // save them so we can remove them
    let self = this;
    this.eventListeners = {
        keydown: function(event) { self.handleKeyDown(event); },
        keyup:   function(event) { self.handleKeyUp(event); },
        blur:    function(event) { self.handleBlur(event); },
        focus:   function(event) { self.handleFocus(event); }
    };
    for (var [name, listener] of Object.entries(this.eventListeners)) {
        this.listenNode.addEventListener(name, listener);
    }
    return self;
}
KeyboardController.prototype.removeEventHandlers = function() {
    if (this.eventListeners) {
        for (var [name, listener] of Object.entries(this.eventListeners)) {
            this.listenNode.removeEventListener(name, listener);
        }
    }
    return self;
}

/**
 * Event Handlers
 */
 KeyboardController.prototype.handleKeyDown = function(event) {
    let key = event.which;
    let action = this.keyMap[key];
    if (action) {
        action.start(event);
    	event.preventDefault();
    }
}

KeyboardController.prototype.handleKeyUp = function(event) {
    let key = event.which;
    let action = this.keyMap[key];
    if (action) {
        action.stop(event);
    	event.preventDefault();
    }
}

KeyboardController.prototype.handleBlur = function(event) {
    this.messageUI.innerHTML("Lost focus...");
    for (var action in this.eventMap) {
        action.stop(event);
    }
}
KeyboardController.prototype.handleFocus = function(event) {
    this.messageUI.innerHTML("Regained focus...");
}

/**
 * Event Actions
 * TODO: link to game
 */
KeyboardController.prototype.startAccelerateForward = function(event) {
    this.actionUI.forward.classList.add("pressed");
    return this;
}
KeyboardController.prototype.stopAccelerateForward = function(event) {
    this.actionUI.forward.classList.remove("pressed");
    return this;
}
KeyboardController.prototype.startAccelerateBackward = function(event) {
}
KeyboardController.prototype.accelerateCCW = function(event) {
}
KeyboardController.prototype.accelerateCW = function(event) {
}
KeyboardController.prototype.fireWeapon = function(event) {
}
KeyboardController.prototype.changeWeapon = function(event) {
}
KeyboardController.prototype.ignore = function(event) {
}
