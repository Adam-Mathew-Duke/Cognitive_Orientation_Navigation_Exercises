// state_manager.js

export class StateManager {
    constructor(maxStackSize = 20) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = maxStackSize;
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
            // Clear the redo stack whenever a brand new action is performed
            this.redoStack = [];
        }
    }

    loadStateFromURL() {
        try {
            var hash = window.location.hash.substring(1);
            if (hash) {
                var jsonString = decodeURIComponent(hash);
                window.paper.project.clear();
                window.paper.project.importJSON(jsonString);
                this.undoStack = [window.paper.project.exportJSON()];
                this.redoStack = []; // Clears redo history on fresh URL load
                return true;
            }
        } catch (e) {
            console.error("Failed to decode state from URL:", e);
        }
        return false;
    }

    undo() {
        if (this.undoStack.length > 1) {
            var currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            var previousState = this.undoStack[this.undoStack.length - 1];
            window.paper.project.clear();
            window.paper.project.importJSON(previousState);
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
            return true;
        }
        return false;
    }

    clear() {
        window.paper.project.clear();
        this.saveState();
        this.redoStack = [];
    }
}