// vars
const openBtn = document.getElementById('open-menu-btn');
const closeBtn = document.getElementById('close-menu-btn');
const backdrop = document.getElementById('menu-backdrop');
const addConeBtn = document.getElementById('add-cone');
const addPathBtn = document.getElementById('add-path');
const undoBtn = document.getElementById('undo-action');
const clearBtn = document.getElementById('clear-course');
const svg = document.getElementById('course-svg');
const pathsContainer = document.getElementById('paths-container');
let currentPathElement = null;
let currentPathPoints = [];
let isDrawingMode = false;

// Undo Stack History
let undoStack = [];

function pushState() {
    const notesInput = document.getElementById('notes-box');
    const currentState = {
        svgContent: svg.innerHTML,
        pathsContent: pathsContainer ? pathsContainer.innerHTML : '',
        notesValue: notesInput ? notesInput.value : ''
    };
    undoStack.push(currentState);
}

// add the menu effect when the open menu button is pressed
openBtn.addEventListener('click', () => backdrop.classList.add('show'));

// remove the menu effect when the menu close button is pressed
closeBtn.addEventListener('click', () => backdrop.classList.remove('show'));

// remove the backdrop menu effect when the menu is closed
backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) backdrop.classList.remove('show');
});

// add cone button
addConeBtn.addEventListener('click', () => {
    pushState(); // Save state before adding cone
    
    // Reset drawing mode completely
    isDrawingMode = false;
    if (currentPathElement) {
        currentPathElement.remove();
        currentPathElement = null;
    }
    currentPathPoints = [];
    addPathBtn.style.background = "";
    addPathBtn.textContent = "Add Path";

    const existingCones = svg.querySelectorAll('.draggable-cone');
    if (existingCones.length >= 8) {
        alert("Maximum limit of 8 cones reached!");
        return;
    }

    const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    newGroup.setAttribute('class', 'draggable-cone');
    newGroup.setAttribute('transform', 'translate(10, 30)');
    const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerCircle.setAttribute('cx', '10');
    outerCircle.setAttribute('cy', '10');
    outerCircle.setAttribute('r', '4');
    outerCircle.setAttribute('fill', 'rgba(0,0,0,0.1)');
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', '10');
    innerCircle.setAttribute('cy', '10');
    innerCircle.setAttribute('r', '2');
    innerCircle.setAttribute('fill', 'yellow');
    newGroup.appendChild(outerCircle);
    newGroup.appendChild(innerCircle);
    svg.appendChild(newGroup);
    backdrop.classList.remove('show');
});

// add path button
addPathBtn.addEventListener('click', () => {
    if (!isDrawingMode) {
        // START DRAWING: Push the clean state *before* starting the new path line
        pushState();
        
        isDrawingMode = true;
        addPathBtn.style.background = "rgba(255, 255, 255, 0.3)";
        addPathBtn.textContent = "Finish Path";
        currentPathPoints = [];
        currentPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        currentPathElement.setAttribute('fill', 'none');
        currentPathElement.setAttribute('stroke', 'yellow');
        currentPathElement.setAttribute('stroke-width', '1.5');
        currentPathElement.setAttribute('stroke-dasharray', '2,2');
        pathsContainer.appendChild(currentPathElement);
    } else {
        // FINISH DRAWING: If user clicks finish without drawing points, pop the unnecessary state we just pushed
        if (currentPathPoints.length === 0) {
            if (currentPathElement) {
                currentPathElement.remove();
            }
            undoStack.pop(); // Remove the state we pushed since nothing was actually added
        }
        
        isDrawingMode = false;
        addPathBtn.style.background = "";
        addPathBtn.textContent = "Add Path";
        currentPathElement = null;
        currentPathPoints = [];
    }
    backdrop.classList.remove('show');
});

// undo button listener
if (undoBtn) {
    undoBtn.addEventListener('click', () => {
        if (undoStack.length === 0) {
            alert("Nothing to undo!");
            return;
        }
        
        // Clean up any active drawing elements first
        if (currentPathElement) {
            currentPathElement.remove();
        }
        
        const previousState = undoStack.pop();
        
        svg.innerHTML = previousState.svgContent;
        if (pathsContainer) {
            pathsContainer.innerHTML = previousState.pathsContent;
        }
        
        const notesInput = document.getElementById('notes-box');
        if (notesInput) {
            notesInput.value = previousState.notesValue;
        }
        
        // Fully reset drawing mode variables
        isDrawingMode = false;
        currentPathElement = null;
        currentPathPoints = [];
        if (addPathBtn) {
            addPathBtn.style.background = "";
            addPathBtn.textContent = "Add Path";
        }
        
        backdrop.classList.remove('show');
    });
}

// clear course button
clearBtn.addEventListener('click', () => {
    pushState(); 
    
    if (currentPathElement) {
        currentPathElement.remove();
    }
    
    const items = svg.querySelectorAll('.draggable-cone, .draggable-icon');
    items.forEach(item => item.remove());
    if (pathsContainer) pathsContainer.innerHTML = '';
    currentPathPoints = [];
    currentPathElement = null;
    isDrawingMode = false;
    addPathBtn.style.background = "";
    addPathBtn.textContent = "Add Path";
    
    const notesInput = document.getElementById('notes-box');
    if (notesInput) notesInput.value = '';

    backdrop.classList.remove('show');
});

// draw path svg - FIXED: Re-binds pathsContainer reference incase it was wiped by innerHTML undo
svg.addEventListener('click', (e) => {
    // If we are in drawing mode, but currentPathElement got detached or lost during an undo, recreate it dynamically!
    if (isDrawingMode && (!currentPathElement || !currentPathElement.isConnected)) {
        let activePathsContainer = document.getElementById('paths-container');
        if (!activePathsContainer) {
            activePathsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            activePathsContainer.setAttribute('id', 'paths-container');
            svg.appendChild(activePathsContainer);
        }
        currentPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        currentPathElement.setAttribute('fill', 'none');
        currentPathElement.setAttribute('stroke', 'yellow');
        currentPathElement.setAttribute('stroke-width', '1.5');
        currentPathElement.setAttribute('stroke-dasharray', '2,2');
        activePathsContainer.appendChild(currentPathElement);
    }

    if (!isDrawingMode || !currentPathElement) return;
    if (e.target.closest('.draggable-cone, .draggable-icon')) return;
    
    let pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    let svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    currentPathPoints.push(`${svgPoint.x},${svgPoint.y}`);
    currentPathElement.setAttribute('points', currentPathPoints.join(' '));
});

// touch and mouse listeners
let activeGroup = null;
let isDragging = false;
let startX, startY;
window.addEventListener('mousedown', (e) => startDrag(e));
window.addEventListener('touchstart', (e) => startDrag(e), { passive: false });

function startDrag(e) {
    const targetGroup = e.target.closest('.draggable-cone, .draggable-icon');
    if (!targetGroup) return;
    
    if (isDrawingMode) {
        if (currentPathPoints.length === 0 && currentPathElement) {
            currentPathElement.remove();
            undoStack.pop();
        }
        isDrawingMode = false;
        currentPathElement = null;
        currentPathPoints = [];
        addPathBtn.style.background = "";
        addPathBtn.textContent = "Add Path";
    }

    pushState(); // Save state before moving an element
    isDragging = true;
    activeGroup = targetGroup;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    svg.appendChild(activeGroup);
    if (e.type === 'touchstart') e.preventDefault();
}

function handleMove(e) {
    if (!isDragging || !activeGroup) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    let startPt = svg.createSVGPoint();
    startPt.x = startX;
    startPt.y = startY;
    let cursorPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    let startPoint = startPt.matrixTransform(svg.getScreenCTM().inverse());
    const dx = cursorPoint.x - startPoint.x;
    const dy = cursorPoint.y - startPoint.y;
    let currentTransform = activeGroup.getAttribute('transform') || 'translate(0,0)';
    let match = /translate\(([^,]+),\s*([^\)]+)\)/.exec(currentTransform);
    let currentTranslateX = match ? parseFloat(match[1]) : 0;
    let currentTranslateY = match ? parseFloat(match[2]) : 0;
    let currentX = 10 + currentTranslateX + dx;
    let currentY = 10 + currentTranslateY + dy;

    let minX, maxX, minY, maxY;
    const r = 4;
    minX = 1 + r;
    maxX = 39 - r;
    minY = 1 + r;
    maxY = 79 - r;

    if (currentX < minX) currentX = minX;
    if (currentX > maxX) currentX = maxX;
    if (currentY < minY) currentY = minY;
    if (currentY > maxY) currentY = maxY;

    let newTranslateX = currentX - 10;
    let newTranslateY = currentY - 10;
    activeGroup.setAttribute('transform', `translate(${newTranslateX}, ${newTranslateY})`);
    startX = clientX;
    startY = clientY;
    if (e.type === 'touchmove') e.preventDefault();
}

window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('mouseup', () => { isDragging = false; activeGroup = null; });
window.addEventListener('touchend', () => { isDragging = false; activeGroup = null; });

// notes menu
const closeNotesButton = document.getElementById('close-notes-menu');
const notesdrop = document.getElementById('notes-backdrop');
closeNotesButton.addEventListener('click', () => notesdrop.classList.remove('show'));

const openNotes = document.getElementById('open-notes-button');
openNotes.addEventListener('click', () => {
    notesdrop.classList.add('show');
    backdrop.classList.remove('show');
});

const saveCourseBtn = document.getElementById('save-course');

saveCourseBtn.addEventListener('click', () => {
    const cones = document.querySelectorAll('.draggable-cone');
    const coneData = [];

    cones.forEach(cone => {
        const transform = cone.getAttribute('transform');
        const match = /translate\(([^,]+),\s*([^\)]+)\)/.exec(transform);
        if (match) {
            coneData.push({
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
            });
        }
    });

    const activePathsContainer = document.getElementById('paths-container');
    const paths = activePathsContainer ? activePathsContainer.querySelectorAll('polyline') : [];
    const pathData = [];

    paths.forEach(path => {
        const points = path.getAttribute('points');
        if (points) {
            pathData.push(points);
        }
    });

    const notesInput = document.getElementById('notes-box');
    const notesData = notesInput ? notesInput.value : '';

    const url = new URL(window.location.href);
    url.searchParams.set('cones', JSON.stringify(coneData));
    url.searchParams.set('paths', JSON.stringify(pathData));
    if (notesData) {
        url.searchParams.set('notes', notesData);
    } else {
        url.searchParams.delete('notes');
    }
    
    window.history.replaceState({}, '', url);
    navigator.clipboard.writeText(url.toString());
    alert("Course and notes saved! Shareable URL copied to clipboard.");
});

function loadCourseFromURL() {
    const params = new URLSearchParams(window.location.search);
    const coneParam = params.get('cones');
    const pathParam = params.get('paths');
    const notesParam = params.get('notes');

    if (!coneParam && !pathParam && !notesParam) return;

    try {
        if (coneParam) {
            const coneData = JSON.parse(coneParam);
            coneData.forEach(data => {
                const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                newGroup.setAttribute('class', 'draggable-cone');
                newGroup.setAttribute('transform', `translate(${data.x}, ${data.y})`);

                const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                outerCircle.setAttribute('cx', '10');
                outerCircle.setAttribute('cy', '10');
                outerCircle.setAttribute('r', '4');
                outerCircle.setAttribute('fill', 'rgba(0,0,0,0.1)');

                const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                innerCircle.setAttribute('cx', '10');
                innerCircle.setAttribute('cy', '10');
                innerCircle.setAttribute('r', '2');
                innerCircle.setAttribute('fill', 'yellow');

                newGroup.appendChild(outerCircle);
                newGroup.appendChild(innerCircle);
                svg.appendChild(newGroup);
            });
        }

        if (pathParam) {
            let activePathsContainer = document.getElementById('paths-container');
            if (!activePathsContainer) {
                activePathsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                activePathsContainer.setAttribute('id', 'paths-container');
                svg.appendChild(activePathsContainer);
            }
            const pathData = JSON.parse(pathParam);
            pathData.forEach(points => {
                const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                pathElement.setAttribute('fill', 'none');
                pathElement.setAttribute('stroke', 'yellow');
                pathElement.setAttribute('stroke-width', '1.5');
                pathElement.setAttribute('stroke-dasharray', '2,2');
                pathElement.setAttribute('points', points);
                activePathsContainer.appendChild(pathElement);
            });
        }

        if (notesParam) {
            const notesInput = document.getElementById('notes-box');
            if (notesInput) {
                notesInput.value = notesParam;
            }
        }
    } catch (e) {
        console.error("Could not parse course data from URL:", e);
    }
}

window.addEventListener('DOMContentLoaded', loadCourseFromURL);