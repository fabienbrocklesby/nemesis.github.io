/**
 * @fileoverview game-shim - Shims to normalize gaming-related APIs to their respective specs
 * @version 0.9
 * @url https://github.com/toji/game-shim
 */



(function(global) {
    "use strict";

    var elementPrototype = (global.HTMLElement || global.Element)["prototype"];
    var getter;

    var GameShim = global.GameShim = {
        supports: {
            pointerLock: true,
        }
    };
    
    //=====================
    // Pointer Lock
    //=====================
    
    var mouseEventPrototype = global.MouseEvent.prototype;
    
    if(!("movementX" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementX", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementX || this.mozMovementX || 0; }
        });
    }
    
    if(!("movementY" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementY", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementY || this.mozMovementY || 0; }
        });
    }
    
    // Navigator pointer is not the right interface according to spec.
    // Here for backwards compatibility only
    if(!navigator.pointer) {
        navigator.pointer = navigator.webkitPointer || navigator.mozPointer;
    }

    // Document event: pointerlockchange
    function pointerlockchange(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockchange", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    document.addEventListener("webkitpointerlocklost", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlocklost", pointerlockchange, false);

    // Document event: pointerlockerror
    function pointerlockerror(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockerror", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockerror", pointerlockerror, false);
    document.addEventListener("mozpointerlockerror", pointerlockerror, false);
    
    if(!document.hasOwnProperty("pointerLockElement")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitPointerLockElement" in document) {
                return function() { return document.webkitPointerLockElement; };
            }
            if("mozPointerLockElement" in document) {
                return function() { return document.mozPointerLockElement; };
            }
            return function() { return null; }; // not supported
        })();
        
        Object.defineProperty(document, "pointerLockElement", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    
    // element.requestPointerLock
    if(!elementPrototype.requestPointerLock) {
        elementPrototype.requestPointerLock = (function() {
            if(elementPrototype.webkitRequestPointerLock) {
                return function() {
                    this.webkitRequestPointerLock();
                };
            }

            if(elementPrototype.mozRequestPointerLock) {
                return function() {
                    this.mozRequestPointerLock();
                };
            }

            if(navigator.pointer) {
                return function() {
                    var elem = this;
                    navigator.pointer.lock(elem, pointerlockchange, pointerlockerror);
                };
            }

            GameShim.supports.pointerLock = false;

            return function(){}; // not supported
        })();
    }
    
    // document.exitPointerLock
    if(!document.exitPointerLock) {
        document.exitPointerLock = (function() {
            return  document.webkitExitPointerLock ||
                    document.mozExitPointerLock ||
                    function(){
                        if(navigator.pointer) {
                            var elem = this;
                            navigator.pointer.unlock();
                        }
                    };
        })();
    }
    
})((typeof(exports) != 'undefined') ? global : window); // Account for CommonJS environments
