// --- 0. STATE & HISTORY MANAGEMENT ---
var undoStack = [];
var maxStackSize = 20;

function saveState() {
    var currentState = project.exportJSON();
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentState) {
        undoStack.push(currentState);
        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        }
    }
}

// Save initial blank state on startup
saveState();


// --- 1. SETUP THE PATH TOOL (Freehand Drawing) ---
var pathTool = new Tool();
var currentPath;

pathTool.onMouseDown = function(event) {
    currentPath = new Path({
        segments: [event.point],
        strokeColor: 'black',
        strokeWidth: 3,
        strokeCap: 'round',
        strokeJoin: 'round'
    });
};

pathTool.onMouseDrag = function(event) {
    currentPath.add(event.point);
};

pathTool.onMouseUp = function(event) {
    currentPath.simplify();
    saveState();
};


// --- 2. SETUP THE CONE TOOL (Draggable Markers) ---
var coneTool = new Tool();
var draggedCone = null;

coneTool.onMouseDown = function(event) {
    var hitResult = project.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
    
    if (hitResult && hitResult.item) {
        draggedCone = hitResult.item;
    } else {
        new Path.Circle({
            center: event.point,
            radius: 15, // 15
            fillColor: '#e20cb7',
            strokeColor: '#ffffff',
            strokeWidth: 1
        });
        saveState();
    }
};

coneTool.onMouseDrag = function(event) {
    if (draggedCone) {
        draggedCone.position = draggedCone.position.add(event.delta);
    }
};

coneTool.onMouseUp = function(event) {
    if (draggedCone) {
        saveState();
        draggedCone = null;
    }
};


// --- 3. WIRE UP THE UI BUTTONS ---
function setupUI() {
    var btnPath = document.getElementById('btn-path');
    var btnCone = document.getElementById('btn-cone');
    var clearButton = document.getElementById('clear-btn');
    var undoButton = document.getElementById('undo-btn');

    if (btnPath) {
        btnPath.addEventListener('click', function() {
            pathTool.activate();
            btnPath.classList.add('active');
            if (btnCone) btnCone.classList.remove('active');
        });
    }

    if (btnCone) {
        btnCone.addEventListener('click', function() {
            coneTool.activate();
            btnCone.classList.add('active');
            if (btnPath) btnPath.classList.remove('active');
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', function() {
            project.clear();
            saveState();
        });
    }

    if (undoButton) {
        undoButton.addEventListener('click', function() {
            if (undoStack.length > 1) {
                undoStack.pop();
                var previousState = undoStack[undoStack.length - 1];
                project.clear();
                project.importJSON(previousState);
            }
        });
    }

    // --- STARTUP NEUTRAL STATE ---
    // Paper.js automatically picks the first tool created. 
    // We activate a blank dummy tool here so nothing is selected by default.
    var emptyTool = new Tool();
    emptyTool.activate();
}

// Execute immediately
setupUI();
