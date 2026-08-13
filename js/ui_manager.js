// ui_manager.js

export class UIManager {
    constructor(managers, stateManager) {
        this.pathManager = managers.pathManager;
        this.coneManager = managers.coneManager;
        this.noteManager = managers.noteManager;
        this.stateManager = stateManager;

        this.tooltip = document.getElementById('tooltip_item-id');
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

        var toolbarToggleBtn = document.getElementById('toolbar-toggle-btn');
        var mainToolbar = document.getElementById('toolbar-main-id');
       
        var zoomtoolbarToggleBtn = document.getElementById('zoom-toolbar-toggle-btn');
        var zoomToolbar = document.getElementById('zoomtoolbar-main-id');
       
        var historytoolbarToggleBtn = document.getElementById('history-toolbar-toggle-btn');
        var historytoolbarReturnBtn = document.getElementById('history-toolbar-return-btn');

        var historyToolbar = document.getElementById('historytoolbar-main-id');

        // hide the main menu bar when the zoom toolbar is opened
        if (toolbarToggleBtn && mainToolbar) 
        {
            toolbarToggleBtn.addEventListener('click', () => 
            {
                this.tooltip.innerText = "Zoom in, out or reset the zoom.";
                mainToolbar.classList.toggle('toolbar-hidden');
                zoomToolbar.classList.toggle('zoomtoolbar-hidden');
            });
        }

        // hide the zoom menu bar when the main toolbar is opened
        if (zoomtoolbarToggleBtn && zoomToolbar) 
        {
            zoomtoolbarToggleBtn.addEventListener('click', () => 
            {
                this.tooltip.innerText = "Add a cone, path or note.";
                mainToolbar.classList.toggle('toolbar-hidden');
                zoomToolbar.classList.toggle('zoomtoolbar-hidden');
            });
        }

        // hide the main menu bar when the zoom toolbar is opened
        if (historytoolbarToggleBtn && mainToolbar) 
        {
            historytoolbarToggleBtn.addEventListener('click', () => 
            {
                this.tooltip.innerText = "Redo or undo an action.";
                mainToolbar.classList.toggle('toolbar-hidden');
                historyToolbar.classList.toggle('historytoolbar-hidden');
            });
        }

        // hide the main menu bar when the zoom toolbar is opened
        if (historytoolbarReturnBtn && mainToolbar) 
        {
            historytoolbarReturnBtn.addEventListener('click', () => 
            {
                this.tooltip.innerText = "Add a cone, path or note.";
                mainToolbar.classList.toggle('toolbar-hidden');
                historyToolbar.classList.toggle('historytoolbar-hidden');
            });
        }

        if (this.btnPath) {
            this.btnPath.addEventListener('click', () => {
                this.tooltip.innerText = "Press and drag to draw the skating line.";
                this.pathManager.activate();
                this.btnPath.classList.add('active');
                if (this.btnCone) this.btnCone.classList.remove('active');
                if (this.btnNote) this.btnNote.classList.remove('active');
            });
        }

        if (this.btnCone) {
            this.btnCone.addEventListener('click', () => {
                this.tooltip.innerText = "Click to add a cone. Click and drag to move an existing cone.";
                this.coneManager.activate();
                this.btnCone.classList.add('active');
                if (this.btnPath) this.btnPath.classList.remove('active');
                if (this.btnNote) this.btnNote.classList.remove('active');
            });
        }

        if (this.btnNote) {
            this.btnNote.addEventListener('click', () => {
                this.tooltip.innerText = "Click to type the note. Click and drag to move an existing note.";
                this.noteManager.activate();
                this.btnNote.classList.add('active');
                if (this.btnPath) this.btnPath.classList.remove('active');
                if (this.btnCone) this.btnCone.classList.remove('active');
            });
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.tooltip.innerText = "Course clear!";
                this.stateManager.clear();
                this.updateHistoryButtons();
            });
        }

        if (this.undoButton) {
            this.undoButton.addEventListener('click', () => {
                this.tooltip.innerText = "Action is undone.";
                if (this.stateManager.undo()) {
                    this.updateHistoryButtons();
                }
            });
        }

        if (this.redoButton) {
            this.redoButton.addEventListener('click', () => {
                this.tooltip.innerText = "Action is redone.";
                if (this.stateManager.redo()) {
                    this.updateHistoryButtons();
                }
            });
        }

        // Hook into StateManager's onStateChange callback so shortcut keys (Ctrl+Z / Ctrl+Y) automatically update buttons
        if (this.stateManager) {
            this.stateManager.onStateChange = () => {
                this.updateHistoryButtons();
            };
        }

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