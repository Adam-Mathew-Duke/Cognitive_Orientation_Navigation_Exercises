// --- DEBOUNCED & NORMALIZED RESIZE HANDLER ---
var oldSize = view.size.clone();
var resizeTimeout = null;

view.onResize = function(event) {
    // Clear any pending resize trigger to debounce mobile browser chrome shifting
    clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(function() {
        var scaleX = view.size.width / oldSize.width;
        var scaleY = view.size.height / oldSize.height;

        // Loop through all top-level items in the active layer
        project.activeLayer.children.forEach(function(item) {
            if (item.data && (item.data.isCone || item.data.isNote)) {
                // For cones and notes: Scale position relatively so they don't drift
                item.position.x *= scaleX;
                item.position.y *= scaleY;
            } else {
                // For regular freehand drawing paths: Let them scale/stretch normally from origin
                item.scale(scaleX, scaleY, new Point(0, 0));
            }
        });

        oldSize = view.size.clone();
    }, 250); // Wait 250ms for mobile rotation/chrome animation to fully settle
};

var zoomInBtn = document.getElementById('zoom-in-btn');
var zoomOutBtn = document.getElementById('zoom-out-btn');

if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
        var oldZoom = view.zoom;
        var oldCenter = view.center;
        var newZoom = Math.min(oldZoom * 1.5, 5);
        
        view.zoom = newZoom;
        view.center = oldCenter.add(view.center.subtract(oldCenter).multiply(oldZoom / view.zoom));
    });
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
        var oldZoom = view.zoom;
        var oldCenter = view.center;
        var newZoom = Math.max(oldZoom / 1.2, 0.5);
        
        view.zoom = newZoom;
        view.center = oldCenter.add(view.center.subtract(oldCenter).multiply(oldZoom / view.zoom));
    });
}

// --- URL STATE ENCODING / DECODING HELPERS ---
function loadStateFromURL() {
    try {
        var hash = window.location.hash.substring(1);
        if (hash) {
            // Decode the URI component back into a raw JSON string
            var jsonString = decodeURIComponent(hash);
            project.clear();
            project.importJSON(jsonString);
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
    var currentState = project.exportJSON();
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentState) {
        undoStack.push(currentState);
        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        }
    }
    // Notice we removed background URL updates from here to keep your address bar clean!
}

// Load from URL hash on startup, otherwise save initial blank state
if (!loadStateFromURL()) {
    saveState();
}

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
        var cone = new Path.Circle({
            center: event.point,
            radius: 15,
            fillColor: '#e20cb7',
            strokeColor: '#ffffff',
            strokeWidth: 1
        });

        // Wrap it in a group so we can tag it properly
        var coneGroup = new Group([cone]);
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

var noteTool = new Tool();
var draggedNote = null;

noteTool.onMouseDown = function(event) {
    var hitResult = project.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
    
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
                var text = new PointText({
                    point: [0, 0],
                    content: labelText,
                    fillColor: '#333333',
                    fontFamily: 'sans-serif',
                    fontSize: 12
                });

                var padding = 8;
                var rect = new Rectangle(
                    text.bounds.x - padding, 
                    text.bounds.y - padding, 
                    text.bounds.width + (padding * 2), 
                    text.bounds.height + (padding * 2)
                );

                var square = new Path.Rectangle({
                    rectangle: rect,
                    fillColor: '#b7ff00',
                    strokeColor: '#16cbc2',
                    strokeWidth: 2,
                    radius: 4
                });

                var noteGroup = new Group([square, text]);
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
    var btnPath = document.getElementById('btn-path');
    var btnCone = document.getElementById('btn-cone');
    var btnNote = document.getElementById('btn-note'); 
    var clearButton = document.getElementById('clear-btn');
    var undoButton = document.getElementById('undo-btn');

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

    var emptyTool = new Tool();
    emptyTool.activate();
}

setupUI();

// --- SAVE / COPY LINK BUTTON ---
var saveButton = document.getElementById('save-btn');
if (saveButton) {
    saveButton.addEventListener('click', function() {
        try {
            // Generate encoded state strictly on demand when saving
            var jsonString = project.exportJSON();
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