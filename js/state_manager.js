// js/state_manager.js

export class StateManager {
    constructor(maxStackSize = 20, onStateChange = null) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = maxStackSize;
        this.onStateChange = onStateChange; // Callback for UI updates
        
        this.initKeyboardShortcuts();
    }

    // Bind global keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            const isModifierActive = event.ctrlKey || event.metaKey;
            if (!isModifierActive) return;

            // Don't trigger if typing in an input/textarea
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                return;
            }

            const code = event.code;
            const key = event.key.toLowerCase();
            const isShift = event.shiftKey;

            // Undo: Ctrl + Z
            if ((code === 'KeyZ' || key === 'z') && !isShift) {
                event.preventDefault();
                console.log("Keyboard Shortcut: Undo triggered");
                if (this.undo()) {
                    console.log("Undo executed successfully");
                } else {
                    console.log("Undo stack empty or at limit");
                }
            } 
            // Redo: Ctrl + Y
            else if ((code === 'KeyY' || key === 'y')) {
                event.preventDefault();
                console.log("Keyboard Shortcut: Redo triggered");
                if (this.redo()) {
                    console.log("Redo executed successfully");
                } else {
                    console.log("Redo stack empty");
                }
            }
        });
    }

    // Helper to safely cancel active paper tools or selections so objects don't stick
    _cancelActiveInteractions() {
        if (window.paper && window.paper.tool) {
            // Fire a faux mouseup or deactivate current tool if it supports it, 
            // or clear project selection to detach dangling items
            window.paper.project.deselectAll();
        }
    }

    saveState() {
        var currentState = "";
        if (window.paper && window.paper.project) {
            currentState = window.paper.project.exportJSON();
        }

        if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== currentState) {
            this.undoStack.push(currentState);
            if (this.undoStack.length > this.maxStackSize) {
                this.undoStack.shift();
            }
            this.redoStack = [];

            if (this.onStateChange) this.onStateChange();
        }
    }

    loadStateFromURL() {
        try {
            var hash = window.location.hash.substring(1);
            if (hash) {
                this._cancelActiveInteractions();
                var jsonString = decodeURIComponent(hash);
                window.paper.project.clear();
                window.paper.project.importJSON(jsonString);
                this.undoStack = [window.paper.project.exportJSON()];
                this.redoStack = []; 
                
                if (this.onStateChange) this.onStateChange();
                return true;
            }
        } catch (e) {
            console.error("Failed to decode state from URL:", e);
        }
        return false;
    }

    undo() {
        if (this.undoStack.length > 1) {
            this._cancelActiveInteractions();
            var currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            var previousState = this.undoStack[this.undoStack.length - 1];
            window.paper.project.clear();
            window.paper.project.importJSON(previousState);

            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length > 0) {
            this._cancelActiveInteractions();
            var nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            
            window.paper.project.clear();
            window.paper.project.importJSON(nextState);

            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    clear() {
        this._cancelActiveInteractions();
        window.paper.project.clear();
        this.saveState();
        this.redoStack = [];
        
        if (this.onStateChange) this.onStateChange();
    }
}