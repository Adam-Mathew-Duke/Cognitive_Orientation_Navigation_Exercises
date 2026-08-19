// js/state_manager.js

export class StateManager {
    constructor(maxStackSize = 20, onStateChange = null, gridManager = null) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = maxStackSize;
        this.onStateChange = onStateChange; 
        this.gridManager = gridManager; 
        
        this.isPerformingHistoryAction = false;
        
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
            } else if ((code === 'KeyKeyY' || code === 'y')) {
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

    _removeGridFromCanvas() {
        if (this.gridManager && this.gridManager.gridGroup) {
            this.gridManager.gridGroup.visible = false;
        }
    }

    _restoreGrid() {
        if (this.gridManager) {
            if (this.gridManager.gridGroup) {
                this.gridManager.gridGroup.visible = true;
            }
            this.gridManager.drawGrid();
        }
    }

    // Helper to clear user drawings without destroying the grid reference
    _clearCanvasKeepGrid() {
        if (window.paper && window.paper.project) {
            const gridGroup = this.gridManager ? this.gridManager.gridGroup : null;
            window.paper.project.activeLayer.children.slice().forEach(child => {
                if (child !== gridGroup) {
                    child.remove();
                }
            });
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
            
            if (!this.isPerformingHistoryAction) {
                this.redoStack = [];
            }

            if (this.onStateChange) this.onStateChange();
        }
    }

    loadStateFromURL() {
        try {
            var hash = window.location.hash.substring(1);
            if (hash) {
                this._cancelActiveInteractions();
                var jsonString = decodeURIComponent(hash);
                
                this._clearCanvasKeepGrid();
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
            
            this.isPerformingHistoryAction = true;
            try {
                var currentState = this.undoStack.pop();
                this.redoStack.push(currentState);

                var previousState = this.undoStack[this.undoStack.length - 1];
                
                // Use safe clear instead of project.clear() so grid stays intact
                this._clearCanvasKeepGrid();
                window.paper.project.importJSON(previousState);
                
                this._restoreGrid();
            } finally {
                this.isPerformingHistoryAction = false;
            }

            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.isPerformingHistoryAction = true;
            try {
                var nextState = this.redoStack.pop();
                this.undoStack.push(nextState);
                
                // Use safe clear instead of project.clear() so grid stays intact
                this._clearCanvasKeepGrid();
                window.paper.project.importJSON(nextState);
                
                this._restoreGrid();
            } finally {
                this.isPerformingHistoryAction = false;
            }

            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    clear() {
        this._cancelActiveInteractions();
        this._clearCanvasKeepGrid();
        this._restoreGrid();
        this.saveState();
    }
}