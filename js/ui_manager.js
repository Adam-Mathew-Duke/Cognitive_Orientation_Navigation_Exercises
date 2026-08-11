// ui_manager.js

export class UIManager {
    constructor(managers, stateManager) {
        this.pathManager = managers.pathManager;
        this.coneManager = managers.coneManager;
        this.noteManager = managers.noteManager;
        this.stateManager = stateManager;

        this.btnPath = document.getElementById('toolbar-main-btn-path');
        this.btnCone = document.getElementById('toolbar-main-btn-cone');
        this.btnNote = document.getElementById('toolbar-main-btn-note');
        this.clearButton = document.getElementById('toolbar-main-clear-btn');
        this.undoButton = document.getElementById('toolbar-main-undo-btn');
        this.redoButton = document.getElementById('toolbar-main-redo-btn');

        this._initListeners();
        this.updateHistoryButtons();
    }

    _initListeners() {
        if (this.btnPath) {
            this.btnPath.addEventListener('click', () => {
                this.pathManager.activate();
                this.btnPath.classList.add('active');
                if (this.btnCone) this.btnCone.classList.remove('active');
                if (this.btnNote) this.btnNote.classList.remove('active');
            });
        }

        if (this.btnCone) {
            this.btnCone.addEventListener('click', () => {
                this.coneManager.activate();
                this.btnCone.classList.add('active');
                if (this.btnPath) this.btnPath.classList.remove('active');
                if (this.btnNote) this.btnNote.classList.remove('active');
            });
        }

        if (this.btnNote) {
            this.btnNote.addEventListener('click', () => {
                this.noteManager.activate();
                this.btnNote.classList.add('active');
                if (this.btnPath) this.btnPath.classList.remove('active');
                if (this.btnCone) this.btnCone.classList.remove('active');
            });
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.stateManager.clear();
                this.updateHistoryButtons();
            });
        }

        if (this.undoButton) {
            this.undoButton.addEventListener('click', () => {
                if (this.stateManager.undo()) {
                    this.updateHistoryButtons();
                }
            });
        }

        if (this.redoButton) {
            this.redoButton.addEventListener('click', () => {
                if (this.stateManager.redo()) {
                    this.updateHistoryButtons();
                }
            });
        }

        // Intercept saveState calls to dynamically update buttons if actions happen elsewhere
        const originalSaveState = this.stateManager.saveState.bind(this.stateManager);
        this.stateManager.saveState = () => {
            originalSaveState();
            this.updateHistoryButtons();
        };

        // Default empty tool activation
        var emptyTool = new window.paper.Tool();
        emptyTool.activate();
    }

    updateHistoryButtons() {
        if (this.undoButton) {
            // Undo needs at least 2 states to go back (current + previous)
            if (this.stateManager.undoStack.length > 1) {
                this.undoButton.removeAttribute('disabled');
            } else {
                this.undoButton.setAttribute('disabled', 'true');
            }
        }

        if (this.redoButton) {
            if (this.stateManager.redoStack.length > 0) {
                this.redoButton.removeAttribute('disabled');
            } else {
                this.redoButton.setAttribute('disabled', 'true');
            }
        }
    }
}