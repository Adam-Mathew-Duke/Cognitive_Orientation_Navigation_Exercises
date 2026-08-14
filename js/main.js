import { ZoomManager } from './toolbar_zoom.js';
import { ConeManager } from './toolbar_cone.js';
import { PathManager } from './toolbar_path.js';
import { NoteManager } from './toolbar_notes.js';
import { StateManager } from './state_manager.js';
import { ShareManager } from './share_manager.js';
import { UIManager } from './ui_manager.js';
import { GridManager } from './grid_manager.js';

window.onload = function() {
    window.paper.setup('courseCanvas');
    
    // Initialize GridManager first so it exists for the other managers
    const gridManager = new GridManager(window.paper.view, 40); // 40 pixel spacing

    // Pass gridManager into StateManager so clear() can protect the grid
    const stateManager = new StateManager(20, null, gridManager); 

    const zoomManager = new ZoomManager(window.paper.view);
    // Pass gridManager into ConeManager so it can filter out grid hit-tests
    const coneManager = new ConeManager(() => stateManager.saveState(), gridManager);
    const pathManager = new PathManager(() => stateManager.saveState());
    const noteManager = new NoteManager(() => stateManager.saveState());
    const shareManager = new ShareManager('toolbar-main-save-btn');

    const uiManager = new UIManager({
        pathManager,
        coneManager,
        noteManager
    }, stateManager);

    if (!stateManager.loadStateFromURL()) {
        stateManager.saveState();
    } else {
        uiManager._updateHistoryButtons(); // If loaded from URL successfully, refresh UI button states
    }

    window.addEventListener('hashchange', function() {
        if (stateManager.loadStateFromURL()) {
            uiManager._updateHistoryButtons();
        }
    });
};