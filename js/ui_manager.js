// ui_manager.js

export class UIManager {
    constructor(managers, stateManager) {
        this.pathManager = managers.pathManager;
        this.coneManager = managers.coneManager;
        this.noteManager = managers.noteManager;
        this.gridManager = managers.gridManager;
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
        var mainToolbar = document.getElementById('toolbar-main-id');
       
        // Objects Toolbar
        var objectsToggleBtn = document.getElementById('objects-toolbar-toggle-btn');
        var objectsReturnBtn = document.getElementById('objects-toolbar-return-btn');
        var objectsToolbar = document.getElementById('objectstoolbar-main-id');

        // Zoom Toolbar
        var zoomToggleBtn = document.getElementById('zoom-toolbar-toggle-btn');
        var zoomReturnBtn = document.getElementById('zoom-toolbar-return-btn');
        var zoomToolbar = document.getElementById('zoomtoolbar-main-id');
       
        // History Toolbar
        var historyToggleBtn = document.getElementById('history-toolbar-toggle-btn');
        var historyReturnBtn = document.getElementById('history-toolbar-return-btn');
        var historyToolbar = document.getElementById('historytoolbar-main-id');

        // Objects Toolbar Toggles
        if (objectsToggleBtn && mainToolbar && objectsToolbar) {
            objectsToggleBtn.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Add a cone.";
                mainToolbar.classList.toggle('toolbar-hidden');
                objectsToolbar.classList.toggle('objectstoolbar-hidden');
            });
        }
        if (objectsReturnBtn && mainToolbar && objectsToolbar) {
            objectsReturnBtn.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Add a cone, path or note.";
                mainToolbar.classList.toggle('toolbar-hidden');
                objectsToolbar.classList.toggle('objectstoolbar-hidden');
            });
        }

        // Zoom Toolbar Toggles
        if (zoomToggleBtn && mainToolbar && zoomToolbar) {
            zoomToggleBtn.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Zoom in, out or reset the zoom.";
                mainToolbar.classList.toggle('toolbar-hidden');
                zoomToolbar.classList.toggle('zoomtoolbar-hidden');
            });
        }
        if (zoomReturnBtn && mainToolbar && zoomToolbar) {
            zoomReturnBtn.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Add a cone, path or note.";
                mainToolbar.classList.toggle('toolbar-hidden');
                zoomToolbar.classList.toggle('zoomtoolbar-hidden');
            });
        }

        // History Toolbar Toggles
        if (historyToggleBtn && mainToolbar && historyToolbar) {
            historyToggleBtn.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Redo or undo an action.";
                mainToolbar.classList.toggle('toolbar-hidden');
                historyToolbar.classList.toggle('historytoolbar-hidden');
            });
        }
        if (historyReturnBtn && mainToolbar && historyToolbar) {
            historyReturnBtn.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Add a cone, path or note.";
                mainToolbar.classList.toggle('toolbar-hidden');
                historyToolbar.classList.toggle('historytoolbar-hidden');
            });
        }

        if (this.btnPath) {
            this.btnPath.addEventListener('click', () => {
                if (this.btnPath.classList.contains('active')) {
                    this.btnPath.classList.remove('active');
                    if (this.emptyTool) this.emptyTool.activate();
                    if (this.tooltip) this.tooltip.innerText = "Tool deactivated.";
                } else {
                    if (this.tooltip) this.tooltip.innerText = "Press and drag to draw the skating line.";
                    this.pathManager.activate();
                    this.btnPath.classList.add('active');
                    if (this.btnCone) this.btnCone.classList.remove('active');
                    if (this.btnNote) this.btnNote.classList.remove('active');
                }
            });
        }

        if (this.btnCone) {
            this.btnCone.addEventListener('click', () => {
                if (this.btnCone.classList.contains('active')) {
                    this.btnCone.classList.remove('active');
                    if (this.emptyTool) this.emptyTool.activate();
                    if (this.tooltip) this.tooltip.innerText = "Tool deactivated.";
                } else {
                    if (this.tooltip) this.tooltip.innerText = "Click to add a cone. Click and drag to move an existing cone.";
                    this.coneManager.activate();
                    this.btnCone.classList.add('active');
                    if (this.btnPath) this.btnPath.classList.remove('active');
                    if (this.btnNote) this.btnNote.classList.remove('active');
                }
            });
        }

        if (this.btnNote) {
            this.btnNote.addEventListener('click', () => {
                if (this.btnNote.classList.contains('active')) {
                    this.btnNote.classList.remove('active');
                    if (this.emptyTool) this.emptyTool.activate();
                    if (this.tooltip) this.tooltip.innerText = "Tool deactivated.";
                } else {
                    if (this.tooltip) this.tooltip.innerText = "Click to type the note. Click and drag to move an existing note.";
                    this.noteManager.activate();
                    this.btnNote.classList.add('active');
                    if (this.btnPath) this.btnPath.classList.remove('active');
                    if (this.btnCone) this.btnCone.classList.remove('active');
                }
            });
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Course clear!";
                this.stateManager.clear();
                
                if (this.gridManager) {
                    this.gridManager.drawGrid();
                }

                this.updateHistoryButtons();
            });
        }

        if (this.undoButton) {
            this.undoButton.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Action is undone.";
                if (this.stateManager.undo()) {
                    this.updateHistoryButtons();
                }
            });
        }

        if (this.redoButton) {
            this.redoButton.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Action is redone.";
                if (this.stateManager.redo()) {
                    this.updateHistoryButtons();
                }
            });
        }

        if (this.stateManager) {
            this.stateManager.onStateChange = () => {
                this.updateHistoryButtons();
            };
        }

        this.emptyTool = new window.paper.Tool();
        this.emptyTool.activate();
    }

    updateHistoryButtons() {
        if (this.undoButton) {
            this.undoButton.disabled = !(this.stateManager.undoStack.length > 1);
        }

        if (this.redoButton) {
            this.redoButton.disabled = !(this.stateManager.redoStack.length > 0);
        }
    }
}