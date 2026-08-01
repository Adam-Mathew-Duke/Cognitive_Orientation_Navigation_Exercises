// Grab your menu elements (keeping your existing menu code)
const openBtn = document.getElementById('open-menu-btn');
const closeBtn = document.getElementById('close-menu-btn');
const backdrop = document.getElementById('menu-backdrop');
const addConeBtn = document.getElementById('add-cone');
const addPathBtn = document.getElementById('add-path');
const clearBtn = document.getElementById('clear-course');
const svg = document.getElementById('course-svg');

// Path elements & state for multiple independent paths
const pathsContainer = document.getElementById('paths-container');
let currentPathElement = null;
let currentPathPoints = [];
let isDrawingMode = false;

// Open/Close menu handlers...
openBtn.addEventListener('click', () => backdrop.classList.add('show'));
closeBtn.addEventListener('click', () => backdrop.classList.remove('show'));
backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) backdrop.classList.remove('show');
});

// --- SPAWN NEW CONE (Max 8 limit) ---
addConeBtn.addEventListener('click', () => {
    isDrawingMode = false; // Turn off path mode when adding a cone
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

// --- TOGGLE PATH DRAWING MODE ---
addPathBtn.addEventListener('click', () => {
    isDrawingMode = !isDrawingMode; // Toggle mode on/off
    
    if (isDrawingMode) {
        addPathBtn.style.background = "rgba(255, 255, 255, 0.3)";
        addPathBtn.textContent = "Finish Path";
        
        // Create a brand new independent polyline element, leaving old paths untouched
        currentPathPoints = [];
        currentPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        currentPathElement.setAttribute('fill', 'none');
        currentPathElement.setAttribute('stroke', 'yellow');
        currentPathElement.setAttribute('stroke-width', '1.5');
        currentPathElement.setAttribute('stroke-dasharray', '2,2');
        pathsContainer.appendChild(currentPathElement);
    } else {
        addPathBtn.style.background = "";
        addPathBtn.textContent = "Add Path";
        currentPathElement = null; // Lock in current line
    }
    
    backdrop.classList.remove('show');
});

// --- CLEAR ALL CONES & PATHS ---
clearBtn.addEventListener('click', () => {
    const cones = svg.querySelectorAll('.draggable-cone');
    cones.forEach(cone => cone.remove());
    
    // Wipe out all path elements
    if (pathsContainer) pathsContainer.innerHTML = '';
    
    currentPathPoints = [];
    currentPathElement = null;
    isDrawingMode = false;
    addPathBtn.style.background = "";
    addPathBtn.textContent = "Add Path";

    backdrop.classList.remove('show');
});

// --- CLICK TO DRAW PATH (Only when mode is active) ---
svg.addEventListener('click', (e) => {
    if (!isDrawingMode || !currentPathElement) return;
    if (e.target.closest('.draggable-cone')) return;

    let pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    let svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());

    currentPathPoints.push(`${svgPoint.x},${svgPoint.y}`);
    currentPathElement.setAttribute('points', currentPathPoints.join(' '));
});

// --- DRAGGING LOGIC (Delegated for all cones) ---
let activeGroup = null;
let isDragging = false;
let startX, startY;

window.addEventListener('mousedown', (e) => startDrag(e));
window.addEventListener('touchstart', (e) => startDrag(e), { passive: false });

function startDrag(e) {
    const targetGroup = e.target.closest('.draggable-cone');
    if (!targetGroup) return;

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

    const r = 4;
    const minX = 1 + r;
    const maxX = 39 - r;
    if (currentX < minX) currentX = minX;
    if (currentX > maxX) currentX = maxX;

    const minY = 1 + r;
    const maxY = 79 - r;
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