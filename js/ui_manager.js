export class UIManager {
    constructor(managers, stateManager) {
        this.pathManager = managers.pathManager;
        this.coneManager = managers.coneManager;
        this.shoeManager = managers.shoeManager;
        this.waterBottleManager = managers.waterBottleManager;
        this.sockManager = managers.sockManager;
        this.beanBagManager = managers.beanBagManager;
        this.trafficConeManager = managers.trafficConeManager;
        this.capManager = managers.capManager;
        this.stickManager = managers.stickManager;
        this.rockManager = managers.rockManager;
        this.helmetManager = managers.helmetManager;
        this.noteManager = managers.noteManager;
        this.gridManager = managers.gridManager;
        this.stateManager = stateManager;

        this.tooltip = document.getElementById('tooltip_item-id');
        this.btnPath = document.getElementById('toolbar-main-btn-path');
        this.btnCone = document.getElementById('toolbar-main-btn-cone');
        this.btnShoe = document.getElementById('toolbar-main-btn-shoe');
        this.btnBottle = document.getElementById('toolbar-main-btn-bottle');
        this.btnSock = document.getElementById('toolbar-main-btn-sock');
        this.btnBeanBag = document.getElementById('toolbar-main-btn-beanbag');
        this.btnTrafficCone = document.getElementById('toolbar-main-btn-trafficcone');
        this.btnCap = document.getElementById('toolbar-main-btn-cap');
        this.btnStick = document.getElementById('toolbar-main-btn-stick');
        this.btnRock = document.getElementById('toolbar-main-btn-rock');
        this.btnHelmet = document.getElementById('toolbar-main-btn-helmet');
        this.btnNote = document.getElementById('toolbar-main-btn-note');
        
        this.clearButton = document.getElementById('toolbar-main-clear-btn');
        this.undoButton = document.getElementById('toolbar-main-undo-btn');
        this.redoButton = document.getElementById('toolbar-main-redo-btn');

        this._initListeners();
        this.updateHistoryButtons();
    }

    _deactivateAllButtons(exceptBtn = null) {
        const buttons = [
            this.btnPath, this.btnCone, this.btnShoe, this.btnBottle, 
            this.btnSock, this.btnBeanBag, this.btnTrafficCone, 
            this.btnCap, this.btnStick, this.btnRock, this.btnHelmet, this.btnNote
        ];
        buttons.forEach(btn => {
            if (btn && btn !== exceptBtn) {
                btn.classList.remove('active');
            }
        });

        // Fallback: Aggressively strip 'active' from any element inside the object toolbar container when path is chosen
        if (exceptBtn === this.btnPath) {
            const objectToolbarElements = document.querySelectorAll('#objectstoolbar-main-id button');
            objectToolbarElements.forEach(el => el.classList.remove('active'));
        }
    }

    _initListeners() {
        var mainToolbar = document.getElementById('toolbar-main-id');
        var objectsToggleBtn = document.getElementById('objects-toolbar-toggle-btn');
        var objectsReturnBtn = document.getElementById('objects-toolbar-return-btn');
        var objectsToolbar = document.getElementById('objectstoolbar-main-id');

        var zoomToggleBtn = document.getElementById('zoom-toolbar-toggle-btn');
        var zoomReturnBtn = document.getElementById('zoom-toolbar-return-btn');
        var zoomToolbar = document.getElementById('zoomtoolbar-main-id');
       
        var historyToggleBtn = document.getElementById('history-toolbar-toggle-btn');
        var historyReturnBtn = document.getElementById('history-toolbar-return-btn');
        var historyToolbar = document.getElementById('historytoolbar-main-id');

        if (objectsToggleBtn && mainToolbar && objectsToolbar) {
            objectsToggleBtn.addEventListener('click', () => {
                mainToolbar.classList.toggle('toolbar-hidden');
                objectsToolbar.classList.toggle('objectstoolbar-hidden');
            });
        }
        
        if (objectsReturnBtn && mainToolbar && objectsToolbar) {
            objectsReturnBtn.addEventListener('click', () => {
                mainToolbar.classList.toggle('toolbar-hidden');
                objectsToolbar.classList.toggle('objectstoolbar-hidden');
                
                // De-select all object buttons and reset the active tool
                this._deactivateAllButtons();
                if (this.emptyTool) {
                    this.emptyTool.activate();
                }
                if (this.tooltip) {
                    this.tooltip.innerText = "Tool deactivated.";
                }
            });
        }

        if (zoomToggleBtn && mainToolbar && zoomToolbar) {
            zoomToggleBtn.addEventListener('click', () => {
                mainToolbar.classList.toggle('toolbar-hidden');
                zoomToolbar.classList.toggle('zoomtoolbar-hidden');
            });
        }
        if (zoomReturnBtn && mainToolbar && zoomToolbar) {
            zoomReturnBtn.addEventListener('click', () => {
                mainToolbar.classList.toggle('toolbar-hidden');
                zoomToolbar.classList.toggle('zoomtoolbar-hidden');
            });
        }

        if (historyToggleBtn && mainToolbar && historyToolbar) {
            historyToggleBtn.addEventListener('click', () => {
                mainToolbar.classList.toggle('toolbar-hidden');
                historyToolbar.classList.toggle('historytoolbar-hidden');
            });
        }
        if (historyReturnBtn && mainToolbar && historyToolbar) {
            historyReturnBtn.addEventListener('click', () => {
                mainToolbar.classList.toggle('toolbar-hidden');
                historyToolbar.classList.toggle('historytoolbar-hidden');
            });
        }

        const bindToolButton = (btn, manager, tooltipText) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    if (this.emptyTool) this.emptyTool.activate();
                    if (this.tooltip) this.tooltip.innerText = "Tool deactivated.";
                } else {
                    if (this.tooltip) this.tooltip.innerText = tooltipText;
                    manager.activate();
                    this._deactivateAllButtons(btn);
                    btn.classList.add('active');
                }
            });
        };

        bindToolButton(this.btnPath, this.pathManager, "Press and drag to draw the skating line.");
        bindToolButton(this.btnCone, this.coneManager, "Click to add a cone. Click and drag to move.");
        bindToolButton(this.btnShoe, this.shoeManager, "Click to add a shoe. Click and drag to move.");
        bindToolButton(this.btnBottle, this.waterBottleManager, "Click to add a water bottle. Click and drag to move.");
        bindToolButton(this.btnSock, this.sockManager, "Click to add a sock. Click and drag to move.");
        bindToolButton(this.btnBeanBag, this.beanBagManager, "Click to add a bean bag. Click and drag to move.");
        bindToolButton(this.btnTrafficCone, this.trafficConeManager, "Click to add a traffic cone. Click and drag to move.");
        bindToolButton(this.btnCap, this.capManager, "Click to add a cap. Click and drag to move.");
        bindToolButton(this.btnStick, this.stickManager, "Click to add a stick. Click and drag to move.");
        bindToolButton(this.btnRock, this.rockManager, "Click to add a rock. Click and drag to move.");
        bindToolButton(this.btnHelmet, this.helmetManager, "Click to add a helmet. Click and drag to move.");
        bindToolButton(this.btnNote, this.noteManager, "Click to type a note. Click and drag to move.");

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                if (this.tooltip) this.tooltip.innerText = "Course clear!";
                this.stateManager.clear();
                if (this.gridManager) this.gridManager.drawGrid();
                this.updateHistoryButtons();
            });
        }

        if (this.undoButton) {
            this.undoButton.addEventListener('click', () => {
                if (this.stateManager.undo()) this.updateHistoryButtons();
            });
        }

        if (this.redoButton) {
            this.redoButton.addEventListener('click', () => {
                if (this.stateManager.redo()) this.updateHistoryButtons();
            });
        }

        if (this.stateManager) {
            this.stateManager.onStateChange = () => this.updateHistoryButtons();
        }

        this.emptyTool = new window.paper.Tool();
        this.emptyTool.activate();
    }

    updateHistoryButtons() {
        if (this.undoButton) this.undoButton.disabled = !(this.stateManager.undoStack.length > 1);
        if (this.redoButton) this.redoButton.disabled = !(this.stateManager.redoStack.length > 0);
    }
}