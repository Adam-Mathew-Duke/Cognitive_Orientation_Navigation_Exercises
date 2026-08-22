import { ZoomManager } from './toolbar_zoom.js';
import { ConeManager } from './toolbar_cone.js';
import { ShoeManager } from './toolbar_shoe.js';
import { WaterBottleManager } from './toolbar_bottle.js';
import { SockManager } from './toolbar_sock.js';
import { BeanBagManager } from './toolbar_beanbag.js';
import { TrafficConeManager } from './toolbar_traffic_cone.js';
import { CapManager } from './toolbar_cap.js';
import { StickManager } from './toolbar_stick.js';
import { RockManager } from './toolbar_rock.js';
import { HelmetManager } from './toolbar_helmet.js';
import { PathManager } from './toolbar_path.js';
import { NoteManager } from './toolbar_notes.js';
import { StateManager } from './state_manager.js';
import { ShareManager } from './share_manager.js';
import { UIManager } from './ui_manager.js';
import { GridManager } from './grid_manager.js';

window.onload = function() {
    const canvas = document.getElementById('courseCanvas');
    window.paper.setup(canvas);
    
    const gridManager = new GridManager(window.paper.view, 40);
    const zoomManager = new ZoomManager(window.paper.view);
    zoomManager.setGridManager(gridManager);

    const stateManager = new StateManager(20, null, gridManager); 

    const coneManager = new ConeManager(() => stateManager.saveState(), gridManager);
    const shoeManager = new ShoeManager(() => stateManager.saveState(), gridManager);
    const waterBottleManager = new WaterBottleManager(() => stateManager.saveState(), gridManager);
    const sockManager = new SockManager(() => stateManager.saveState(), gridManager);
    const beanBagManager = new BeanBagManager(() => stateManager.saveState(), gridManager);
    const trafficConeManager = new TrafficConeManager(() => stateManager.saveState(), gridManager);
    const capManager = new CapManager(() => stateManager.saveState(), gridManager);
    const stickManager = new StickManager(() => stateManager.saveState(), gridManager);
    const rockManager = new RockManager(() => stateManager.saveState(), gridManager);
    const helmetManager = new HelmetManager(() => stateManager.saveState(), gridManager);
    const pathManager = new PathManager(() => stateManager.saveState());
    const noteManager = new NoteManager(() => stateManager.saveState());
    const shareManager = new ShareManager('toolbar-main-save-btn');

    const uiManager = new UIManager({
        pathManager,
        coneManager,
        shoeManager,
        waterBottleManager,
        sockManager,
        beanBagManager,
        trafficConeManager,
        capManager,
        stickManager,
        rockManager,
        helmetManager,
        noteManager,
        gridManager
    }, stateManager);

    if (!stateManager.loadStateFromURL()) {
        stateManager.saveState();
    } else {
        uiManager.updateHistoryButtons(); 
    }

    window.addEventListener('hashchange', function() {
        if (stateManager.loadStateFromURL()) {
            uiManager.updateHistoryButtons();
        }
    });

    gridManager.drawGrid();
};