// js/main.js

import { ZoomManager } from './toolbar_zoom.js';

// --- URL STATE ENCODING / DECODING HELPERS ---
function loadStateFromURL() {
    try {
        var hash = window.location.hash.substring(1);
        if (hash) {
            // Decode the URI component back into a raw JSON string
            var jsonString = decodeURIComponent(hash);
            window.paper.project.clear();
            window.paper.project.importJSON(jsonString);
            undoStack = [window.paper.project.exportJSON()];
            return true;
        }
    } catch (e) {
        console.error("Failed to decode state from URL:", e);
    }
    return false;
}

// Listen for changes to the URL hash (e.g. clicking a shared link or back/forward buttons)
window.addEventListener('hashchange', function() {
    loadStateFromURL();
});

// --- 0. STATE & HISTORY MANAGEMENT ---
var undoStack = [];
var maxStackSize = 20;

function saveState() {
    var currentState = "";
    if (window.paper && window.paper.project) {
        currentState = window.paper.project.exportJSON();
    }

    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentState) {
        undoStack.push(currentState);
        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        }
    }
}

window.onload = function() {
    // 1. Initialize Paper.js first so project, view, and globals exist
    window.paper.setup('courseCanvas');
    
    // 2. Initialize your zoom manager and resize handler
    const zoomManager = new ZoomManager(window.paper.view);

    // 3. Now safely load state from the URL hash or save the initial blank state
    if (!loadStateFromURL()) {
        saveState();
    }
};

// --- 1. SETUP THE PATH TOOL (Freehand Drawing) ---
var pathTool = new window.paper.Tool();
var currentPath;

pathTool.onMouseDown = function(event) {
    currentPath = new window.paper.Path({
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
var coneTool = new window.paper.Tool();
var draggedCone = null;

coneTool.onMouseDown = function(event) {
    var hitResult = window.paper.project.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
    
    if (hitResult && hitResult.item) {
        var target = hitResult.item;
        
        // Only grab it if it's explicitly marked as a cone
        if (target.data && target.data.isCone) {
            draggedCone = target;
        } else if (target.parent && target.parent.data && target.parent.data.isCone) {
            draggedCone = target.parent;
        } else {
            draggedCone = null; // Ignore notes or paths
        }
    } else {
        var cone = new window.paper.Path.Circle({
            center: event.point,
            radius: 15,
            fillColor: '#e20cb7',
            strokeColor: '#ffffff',
            strokeWidth: 1
        });

        // Wrap it in a group so we can tag it properly
        var coneGroup = new window.paper.Group([cone]);
        coneGroup.data.isCone = true; // Isolates cones from notes and paths!
        
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

// --- NOTE TOOL ---

var noteTool = new window.paper.Tool();
var draggedNote = null;

noteTool.onMouseDown = function(event) {
    var hitResult = window.paper.project.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
    
    if (hitResult && hitResult.item) {
        var target = hitResult.item;
        
        if (target.data && target.data.isNote) {
            draggedNote = target;
        } else if (target.parent && target.parent.data && target.parent.data.isNote) {
            draggedNote = target.parent;
        } else {
            draggedNote = null; // It's a cone or path, don't drag it with this tool
        }
    } else {
        var labelText = prompt("Enter a label for your note (max 20 chars):", "Note");
        
        if (labelText !== null) {
            if (labelText.length > 20) {
                labelText = labelText.substring(0, 20);
            }
            
            if (labelText.trim() !== "") {
                var text = new window.paper.PointText({
                    point: [0, 0],
                    content: labelText,
                    fillColor: '#333333',
                    fontFamily: 'sans-serif',
                    fontSize: 12
                });

                var padding = 8;
                var rect = new window.paper.Rectangle(
                    text.bounds.x - padding, 
                    text.bounds.y - padding, 
                    text.bounds.width + (padding * 2), 
                    text.bounds.height + (padding * 2)
                );

                var square = new window.paper.Path.Rectangle({
                    rectangle: rect,
                    fillColor: '#b7ff00',
                    strokeColor: '#16cbc2',
                    strokeWidth: 2,
                    radius: 4
                });

                var noteGroup = new window.paper.Group([square, text]);
                noteGroup.data.isNote = true;
                noteGroup.position = event.point;

                draggedNote = noteGroup; // Immediately select it for dragging!

                saveState();
            }
        }
    }
};

noteTool.onMouseDrag = function(event) {
    if (draggedNote) {
        draggedNote.position = draggedNote.position.add(event.delta);
    }
};

noteTool.onMouseUp = function(event) {
    if (draggedNote) {
        saveState();
        draggedNote = null;
    }
};

// --- WIRE UP THE UI BUTTONS ---
function setupUI() {
    var btnPath = document.getElementById('toolbar-main-btn-path');
    var btnCone = document.getElementById('toolbar-main-btn-cone');
    var btnNote = document.getElementById('toolbar-main-btn-note'); 
    var clearButton = document.getElementById('toolbar-main-clear-btn');
    var undoButton = document.getElementById('toolbar-main-undo-btn');

    if (btnPath) {
        btnPath.addEventListener('click', function() {
            pathTool.activate();
            btnPath.classList.add('active');
            if (btnCone) btnCone.classList.remove('active');
            if (btnNote) btnNote.classList.remove('active');
        });
    }

    if (btnCone) {
        btnCone.addEventListener('click', function() {
            coneTool.activate();
            btnCone.classList.add('active');
            if (btnPath) btnPath.classList.remove('active');
            if (btnNote) btnNote.classList.remove('active');
        });
    }

    if (btnNote) {
        btnNote.addEventListener('click', function() {
            noteTool.activate();
            btnNote.classList.add('active');
            if (btnPath) btnPath.classList.remove('active');
            if (btnCone) btnCone.classList.remove('active');
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', function() {
            window.paper.project.clear();
            saveState();
        });
    }

    if (undoButton) {
        undoButton.addEventListener('click', function() {
            if (undoStack.length > 1) {
                undoStack.pop();
                var previousState = undoStack[undoStack.length - 1];
                window.paper.project.clear();
                window.paper.project.importJSON(previousState);
            }
        });
    }

    var emptyTool = new window.paper.Tool();
    emptyTool.activate();
}

setupUI();

// --- SAVE / COPY LINK BUTTON ---
var saveButton = document.getElementById('toolbar-main-save-btn');
if (saveButton) {
    saveButton.addEventListener('click', function() {
        try {
            // Generate encoded state strictly on demand when saving
            var jsonString = window.paper.project.exportJSON();
            var encoded = encodeURIComponent(jsonString);
            
            var baseUrl = window.location.origin + window.location.pathname;
            var shareableUrl = baseUrl + "#" + encoded;
            
            navigator.clipboard.writeText(shareableUrl).then(function() {
                alert('URL copied to clipboard!');
            }).catch(function(err) {
                console.error('Failed to copy URL to the clipboard: ', err);
            });
        } catch (e) {
            console.error("Failed to create sharable URL:", e);
        }
    });
}