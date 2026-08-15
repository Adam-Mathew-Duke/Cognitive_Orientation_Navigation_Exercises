// zoom_manager.js

export class ZoomManager 
{
    // Class instance
    constructor(view)
    {
        // Class instance properties
        this.view = view;
        this.gridManager = null; // Can be linked later or via setter
        this.defaultZoom = view.zoom;
        this.defaultCenter = view.center.clone();
        this.oldSize = view.size.clone();
        this.resizeTimeout = null;
        this.minZoom = 0.5;
        this.maxZoom = 5;

        this.tooltip = document.getElementById('tooltip_item-id');
        
        // Touch interaction states
        this.initialPinchDistance = null;
        this.initialZoom = 1;
        this.pinchCenter = null;

        // One-finger pan touch tracking states
        this.isPanning = false;
        this.lastTouchPosition = null;

        // Desktop mouse pan tracking states
        this.isMouseDragging = false;
        this.lastMousePosition = null;
        
        this.initListeners();
        this.initResizeHandler();
        this.initInteractiveZoomListeners();
    }

    // Link your GridManager here
    setGridManager(gridManager) {
        this.gridManager = gridManager;
    }

    // Centralized helper to update zoom, position, and refresh the grid
    _applyZoom(newZoom, newCenter = null) {
        const oldZoom = this.view.zoom;
        if (newZoom === oldZoom) return;

        this.view.zoom = newZoom;

        if (newCenter) {
            this.view.center = this.view.center.add(newCenter.subtract(this.view.center).multiply(1 - (oldZoom / newZoom)));
        }

        // Redraw grid so lines match new bounds and thickness adjusts
        if (this.gridManager) {
            this.gridManager.drawGrid();
        }

        this.updateButtonStates();
    }

    // Helper method to check if the PAN button is currently active
    isPanActive() 
    {
        const panBtn = document.getElementById('toolbar-main-pan-btn');
        if (!panBtn) return true; // Fallback if button doesn't exist yet
        
        return panBtn.classList.contains('active') || panBtn.getAttribute('aria-pressed') === 'true';
    }

    // Element listeners
    initListeners() 
    {
        const panBtn = document.getElementById('toolbar-main-pan-btn');
        if (panBtn) {
            panBtn.addEventListener('click', () => {
                const isActive = panBtn.classList.toggle('active');
                panBtn.setAttribute('aria-pressed', isActive);
                if (this.tooltip) {
                    this.tooltip.innerText = isActive ? "Pan mode enabled." : "Pan mode disabled.";
                }
            });
        }

        // Button element listeners
        const zoomInBtn = document.getElementById('toolbar-main-zoom-in-btn');
        const zoomOutBtn = document.getElementById('toolbar-main-zoom-out-btn');
        const zoomDefaultBtn = document.getElementById('toolbar-main-zoom-default-btn');

        // Zoom default button listener
        if (zoomDefaultBtn) 
        {
            zoomDefaultBtn.addEventListener('click', () =>
            {
                if (this.tooltip) this.tooltip.innerText = "Zoomed back to the default view.";
                this.resetZoom();
            });
        }

        // Zoom in button listener
        if (zoomInBtn) 
        {
            zoomInBtn.addEventListener('click', () => 
            {
                if (this.tooltip) this.tooltip.innerText = "View has been zoomed in.";
                this.zoomIn();
            });
        }

        // Zoom out button listener
        if (zoomOutBtn) 
        {
            zoomOutBtn.addEventListener('click', () => 
            {
                if (this.tooltip) this.tooltip.innerText = "View has been zoomed out.";
                this.zoomOut();
            });
        }
    }

    // Attach wheel, mouse, and touch event listeners to the canvas element
    initInteractiveZoomListeners() 
    {
        const canvas = this.view.element;
        if (!canvas) return;

        // 1. Scroll-to-Zoom (Mouse Wheel) -> Locked behind the PAN button
        canvas.addEventListener('wheel', (event) => 
        {
            if (!this.isPanActive()) return;

            event.preventDefault();

            const oldZoom = this.view.zoom;
            const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
            const newZoom = Math.min(Math.max(oldZoom * zoomFactor, this.minZoom), this.maxZoom);

            if (newZoom === oldZoom) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const mousePosition = this.view.viewToProject(new paper.Point(mouseX, mouseY));

            this._applyZoom(newZoom, mousePosition);
        }, { passive: false });

        // 2. Desktop Mouse Drag Pan (Left Click Hold & Move) -> Locked behind PAN button
        canvas.addEventListener('mousedown', (event) => 
        {
            // Only respond to left-click (button 0) and if Pan mode is active
            if (event.button !== 0 || !this.isPanActive()) return;

            this.isMouseDragging = true;
            this.lastMousePosition = new paper.Point(event.clientX, event.clientY);
            canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (event) => 
        {
            if (!this.isMouseDragging) return;

            const currentMousePosition = new paper.Point(event.clientX, event.clientY);
            const deltaScreen = this.lastMousePosition.subtract(currentMousePosition);
            
            // Convert screen offset to project coordinates based on current zoom
            const deltaProject = deltaScreen.divide(this.view.zoom);

            this.view.center = this.view.center.add(deltaProject);
            this.lastMousePosition = currentMousePosition;

            // Redraw grid to track camera movement
            if (this.gridManager) {
                this.gridManager.drawGrid();
            }
        });

        window.addEventListener('mouseup', () => 
        {
            if (this.isMouseDragging) {
                this.isMouseDragging = false;
                this.lastMousePosition = null;
                canvas.style.cursor = '';
            }
        });

        // 3. Touch Handlers (Pinch-to-zoom with 2 fingers, Pan with 1 finger) -> Locked behind PAN button
        canvas.addEventListener('touchstart', (event) => 
        {
            if (!this.isPanActive()) 
            {
                this.initialPinchDistance = null;
                this.pinchCenter = null;
                this.isPanning = false;
                return;
            }

            if (event.touches.length === 2) 
            {
                // Switch from panning to pinch zooming
                this.isPanning = false;
                const t1 = event.touches[0];
                const t2 = event.touches[1];
                const rect = canvas.getBoundingClientRect();

                this.initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                this.initialZoom = this.view.zoom;

                const screenMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
                const screenMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
                this.pinchCenter = this.view.viewToProject(new paper.Point(screenMidX, screenMidY));
            } 
            else if (event.touches.length === 1) 
            {
                // Start one-finger pan
                this.isPanning = true;
                this.lastTouchPosition = new paper.Point(event.touches[0].clientX, event.touches[0].clientY);
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (event) => 
        {
            if (!this.isPanActive()) 
            {
                this.initialPinchDistance = null;
                this.pinchCenter = null;
                this.isPanning = false;
                return;
            }

            // Handle 2-finger pinch zoom
            if (event.touches.length === 2 && this.initialPinchDistance) 
            {
                event.preventDefault();

                const t1 = event.touches[0];
                const t2 = event.touches[1];
                
                const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                const scaleFactor = currentDistance / this.initialPinchDistance;
                
                const newZoom = Math.min(Math.max(this.initialZoom * scaleFactor, this.minZoom), this.maxZoom);
                
                this._applyZoom(newZoom, this.pinchCenter);
            }
            // Handle 1-finger drag pan
            else if (event.touches.length === 1 && this.isPanning && this.lastTouchPosition) 
            {
                event.preventDefault();

                const currentTouch = new paper.Point(event.touches[0].clientX, event.touches[0].clientY);
                const deltaScreen = this.lastTouchPosition.subtract(currentTouch);
                
                // Convert screen delta offset to project coordinates based on current zoom
                const deltaProject = deltaScreen.divide(this.view.zoom);

                this.view.center = this.view.center.add(deltaProject);
                this.lastTouchPosition = currentTouch;

                // Redraw grid to follow the camera movement
                if (this.gridManager) {
                    this.gridManager.drawGrid();
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (event) => 
        {
            if (event.touches.length < 2) 
            {
                this.initialPinchDistance = null;
                this.pinchCenter = null;
            }
            if (event.touches.length === 0) 
            {
                this.isPanning = false;
                this.lastTouchPosition = null;
            }
        });
    }

    // Reset the paper.js canvas scale when a window resize is detected
    initResizeHandler() 
    {
        this.view.onResize = (event) => 
        {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => 
            {
                var scaleX = this.view.size.width / this.oldSize.width;
                var scaleY = this.view.size.height / this.oldSize.height;

                paper.project.activeLayer.children.forEach((item) => 
                {
                    if (item.data && (item.data.isCone || item.data.isNote)) 
                    {
                        item.position.x *= scaleX;
                        item.position.y *= scaleY;
                    } 
                    else 
                    {
                        item.scale(scaleX, scaleY, new paper.Point(0, 0));
                    }
                });

                this.oldSize = this.view.size.clone();

                if (this.gridManager) {
                    this.gridManager.drawGrid();
                }
            }, 250); 
        };
    }

    // Update states for all zoom buttons based on current zoom limits
    updateButtonStates() {
        const zoomInBtn = document.getElementById('toolbar-main-zoom-in-btn');
        const zoomOutBtn = document.getElementById('toolbar-main-zoom-out-btn');
        const zoomDefaultBtn = document.getElementById('toolbar-main-zoom-default-btn');

        if (zoomDefaultBtn) {
            if (this.view.zoom === this.defaultZoom) {
                zoomDefaultBtn.setAttribute('disabled', 'true');
            } else {
                zoomDefaultBtn.removeAttribute('disabled');
            }
        }

        if (zoomInBtn) {
            if (this.view.zoom >= this.maxZoom) {
                zoomInBtn.setAttribute('disabled', 'true');
            } else {
                zoomInBtn.removeAttribute('disabled');
            }
        }

        if (zoomOutBtn) {
            if (this.view.zoom <= this.minZoom) {
                zoomOutBtn.setAttribute('disabled', 'true');
            } else {
                zoomOutBtn.removeAttribute('disabled');
            }
        }
    }

    // Zoom in method (targeted to view center for button clicks)
    zoomIn(factor = 1.25) 
    {
        const oldZoom = this.view.zoom;
        const newZoom = Math.min(oldZoom * factor, this.maxZoom);
        this._applyZoom(newZoom);
    }

    // Zoom out method
    zoomOut(factor = 1.25) 
    {
        const oldZoom = this.view.zoom;
        const newZoom = Math.max(oldZoom / factor, this.minZoom);
        this._applyZoom(newZoom);
    }

    // Zoom reset method
    resetZoom() 
    {
        const newZoom = this.defaultZoom;
        const newCenter = this.defaultCenter ? this.defaultCenter.clone() : null;
        
        this.view.zoom = newZoom;
        if (newCenter) {
            this.view.center = newCenter;
        }

        if (this.gridManager) {
            this.gridManager.drawGrid();
        }

        this.updateButtonStates();
    }
}