const isTouchable = 'createTouch' in document;

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
    if (event) { event.preventDefault() };
}
ControllerAction.prototype.stop = function(event) {
    if (this.uiElement) { this.uiElement.classList.remove("pressed"); }
    this.onStop.call(this.object, event);
    if (event) { event.preventDefault() };
}
ControllerAction.prototype.setUIElement = function(uiElement) {
    this.uiElement = uiElement;
}
ControllerAction.prototype.initEventHandlers = function() {
    if (this.uiElement == null) { return this; }

    let self = this;
    if (isTouchable) {
        this.eventListeners = {
            touchstart: function(event) { self.start(event); },
            touchend:   function(event) { self.stop(event); }
        };
    } else {  // mouse events
        this.eventListeners = {
            mouseover: function(event) { self.start(event); },
            mouseout:  function(event) { self.stop(event); }
        };
    }
    for (var [name, listener] of Object.entries(this.eventListeners)) {
        this.uiElement.addEventListener(name, listener);
        // $(this.uiElement).on(name, listener);
    }
    return self;
}
ControllerAction.prototype.removeEventHandlers = function() {
    if (this.eventListeners) {
        for (var [name, listener] of Object.entries(this.eventListeners)) {
            this.uiElement.removeEventListener(name, listener);
        }
    }
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
    let self = this;
    this.eventListeners = {  // save them so we can remove them later
        keydown: function(event) { self.handleKeyDown(event); },
        keyup:   function(event) { self.handleKeyUp(event); },
        blur:    function(event) { self.handleBlur(event); },
        focus:   function(event) { self.handleFocus(event); }
    };
    for (var [name, listener] of Object.entries(this.eventListeners)) {
        this.listenNode.addEventListener(name, listener);
    }

    // add mouse / touch events to each UI element:
    for (var [id, action] of Object.entries(this.actions)) {
        action.initEventHandlers();
    }

    return self;
}

KeyboardController.prototype.removeEventHandlers = function() {
    if (this.eventListeners) {
        for (var [name, listener] of Object.entries(this.eventListeners)) {
            this.listenNode.removeEventListener(name, listener);
        }
    }
    for (var [id, action] of Object.entries(this.actions)) {
        action.removeEventHandlers();
    }
    return self;
}

/**
 * Event Handlers
 */
 KeyboardController.prototype.handleKeyDown = function(event) {
    let key = event.which;
    let action = this.keyMap[key];
    if (action) { action.start(event); }
}

KeyboardController.prototype.handleKeyUp = function(event) {
    let key = event.which;
    let action = this.keyMap[key];
    if (action) { action.stop(event); }
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
