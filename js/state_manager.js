// js/state_manager.js

export class StateManager {
    constructor(maxStackSize = 20, onStateChange = null, gridManager = null) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = maxStackSize;
        this.onStateChange = onStateChange; 
        this.gridManager = gridManager; 
        
        this.initKeyboardShortcuts();
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            const isModifierActive = event.ctrlKey || event.metaKey;
            if (!isModifierActive) return;

            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                return;
            }

            const code = event.code;
            const key = event.key.toLowerCase();
            const isShift = event.shiftKey;

            if ((code === 'KeyZ' || key === 'z') && !isShift) {
                event.preventDefault();
                this.undo();
            } else if ((code === 'KeyY' || key === 'y')) {
                event.preventDefault();
                this.redo();
            }
        });
    }

    _cancelActiveInteractions() {
        if (window.paper && window.paper.tool) {
            window.paper.project.deselectAll();
        }
    }

    // Hide grid temporarily instead of destroying/removing it
    _removeGridFromCanvas() {
        if (this.gridManager && this.gridManager.gridGroup) {
            this.gridManager.gridGroup.visible = false;
        }
    }

    // Show grid again and ensure it's updated
    _restoreGrid() {
        if (this.gridManager) {
            if (this.gridManager.gridGroup) {
                this.gridManager.gridGroup.visible = true;
            }
            this.gridManager.drawGrid();
        }
    }

    saveState() {
        var currentState = "";
        if (window.paper && window.paper.project) {
            try {
                this._removeGridFromCanvas();
                currentState = window.paper.project.exportJSON();
            } finally {
                this._restoreGrid();
            }
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
                
                this._restoreGrid();

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
            this.undoStack.pop(); // remove current
            var previousState = this.undoStack[this.undoStack.length - 1];
            
            window.paper.project.clear();
            window.paper.project.importJSON(previousState);
            
            this._restoreGrid();

            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length > 0) {
            var nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            
            window.paper.project.clear();
            window.paper.project.importJSON(nextState);
            
            this._restoreGrid();

            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    clear() {
        this._cancelActiveInteractions();
        
        if (window.paper && window.paper.project) {
            window.paper.project.clear();
        }
        
        this._restoreGrid();
        this.saveState();
    }
}