// Grab your elements
const openBtn = document.getElementById('open-menu-btn');
const closeBtn = document.getElementById('close-menu-btn');
const backdrop = document.getElementById('menu-backdrop');

// Open the menu when the open button is clicked
openBtn.addEventListener('click', () => {
    backdrop.classList.add('show');
});

// Close the menu when the close button is clicked
closeBtn.addEventListener('click', () => {
    backdrop.classList.remove('show');
});

// Optional: Close the menu if they click outside the pink box (on the backdrop)
backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
        backdrop.classList.remove('show');
    }
});

const circle = document.getElementById('draggable-cone');
const svg = circle.ownerSVGElement;

let isDragging = false;
let startX, startY;

circle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    circle.parentNode.appendChild(circle);
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    let pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    let startPt = svg.createSVGPoint();
    startPt.x = startX;
    startPt.y = startY;

    let cursorPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    let startPoint = startPt.matrixTransform(svg.getScreenCTM().inverse());

    const dx = cursorPoint.x - startPoint.x;
    const dy = cursorPoint.y - startPoint.y;

    let currentCx = parseFloat(circle.getAttribute('cx')) || 0;
    let currentCy = parseFloat(circle.getAttribute('cy')) || 0;
    let r = parseFloat(circle.getAttribute('r')) || 0;

    // Calculate new positions
    let newCx = currentCx + dx;
    let newCy = currentCy + dy;

    // --- BOUNDING LOGIC ---
    // Min/Max X based on viewbox width (0 to 40) minus/plus radius
    const minX = r;
    const maxX = 40 - r;
    if (newCx < minX) newCx = minX;
    if (newCx > maxX) newCx = maxX;

    // Min/Max Y based on viewbox height (0 to 80) minus/plus radius
    const minY = 2 + r;
    const maxY = 78 - r;
    if (newCy < minY) newCy = minY;
    if (newCy > maxY) newCy = maxY;
    // ----------------------

    circle.setAttribute('cx', newCx);
    circle.setAttribute('cy', newCy);

    startX = e.clientX;
    startY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// --- TOUCH START / MOUSE DOWN ---
// (Make sure you also add 'touchstart' to your start listener)
circle.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    e.preventDefault(); // Prevents page scrolling while dragging
});

// --- TOUCH MOVE / MOUSE MOVE ---
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove, { passive: false });

function handleMove(e) {
    if (!isDragging) return;

    // Get clientX/Y depending on whether it's a touch or mouse event
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

    let currentCx = parseFloat(circle.getAttribute('cx')) || 0;
    let currentCy = parseFloat(circle.getAttribute('cy')) || 0;
    let r = parseFloat(circle.getAttribute('r')) || 0;

    // Calculate new positions
    let newCx = currentCx + dx;
    let newCy = currentCy + dy;

    // --- BOUNDING LOGIC ---
    const minX = r;
    const maxX = 40 - r;
    if (newCx < minX) newCx = minX;
    if (newCx > maxX) newCx = maxX;

    const minY = 2 + r;
    const maxY = 78 - r;
    if (newCy < minY) newCy = minY;
    if (newCy > maxY) newCy = maxY;
    // ----------------------

    circle.setAttribute('cx', newCx);
    circle.setAttribute('cy', newCy);

    startX = clientX;
    startY = clientY;
    
    // Prevent default scrolling behavior on touch devices
    if (e.type === 'touchmove') {
        e.preventDefault();
    }
}

// --- TOUCH END / MOUSE UP ---
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('touchend', () => { isDragging = false; });