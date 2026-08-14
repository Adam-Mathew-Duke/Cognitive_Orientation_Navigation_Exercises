export class ZoomManager 
{
    // Class instance
    constructor(view)
    {
        // Class instance properties
        this.view = view;
        this.defaultZoom = view.zoom;
        this.defaultCenter = view.center.clone();
        this.oldSize = view.size.clone();
        this.resizeTimeout = null;
        this.minZoom = 0.5;
        this.maxZoom = 5;

        this.tooltip = document.getElementById('tooltip_item-id');
        
        // Touch pinch states
        this.initialPinchDistance = null;
        this.initialZoom = 1;
        this.pinchCenter = null;
        
        this.initListeners();
        this.initResizeHandler();
        this.initInteractiveZoomListeners();
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
                this.updateButtonStates();
            });
        }

        // Zoom in button listener
        if (zoomInBtn) 
        {
            zoomInBtn.addEventListener('click', () => 
            {
                if (this.tooltip) this.tooltip.innerText = "View has been zoomed in.";
                this.zoomIn();
                this.updateButtonStates();
            });
        }

        // Zoom out button listener
        if (zoomOutBtn) 
        {
            zoomOutBtn.addEventListener('click', () => 
            {
                if (this.tooltip) this.tooltip.innerText = "View has been zoomed out.";
                this.zoomOut();
                this.updateButtonStates();
            });
        }
    }

    // Attach wheel and touch event listeners to the canvas element
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

            this.view.zoom = newZoom;
            this.view.center = this.view.center.add(mousePosition.subtract(this.view.center).multiply(1 - (oldZoom / newZoom)));

            this.updateButtonStates();
        }, { passive: false });

        // 2. Pinch-to-Zoom (Touch Devices) -> Strictly locked behind the PAN button
        canvas.addEventListener('touchstart', (event) => 
        {
            if (!this.isPanActive()) 
            {
                this.initialPinchDistance = null;
                this.pinchCenter = null;
                return;
            }

            if (event.touches.length === 2) 
            {
                const t1 = event.touches[0];
                const t2 = event.touches[1];
                const rect = canvas.getBoundingClientRect();

                this.initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                this.initialZoom = this.view.zoom;

                const screenMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
                const screenMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
                this.pinchCenter = this.view.viewToProject(new paper.Point(screenMidX, screenMidY));
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (event) => 
        {
            if (!this.isPanActive()) 
            {
                this.initialPinchDistance = null;
                this.pinchCenter = null;
                return;
            }

            if (event.touches.length === 2 && this.initialPinchDistance) 
            {
                event.preventDefault();

                const t1 = event.touches[0];
                const t2 = event.touches[1];
                
                const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                const scaleFactor = currentDistance / this.initialPinchDistance;
                
                const newZoom = Math.min(Math.max(this.initialZoom * scaleFactor, this.minZoom), this.maxZoom);
                if (newZoom === this.view.zoom) return;

                const oldZoom = this.view.zoom;
                this.view.zoom = newZoom;

                this.view.center = this.view.center.add(this.pinchCenter.subtract(this.view.center).multiply(1 - (oldZoom / newZoom)));

                this.updateButtonStates();
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (event) => 
        {
            if (event.touches.length < 2) 
            {
                this.initialPinchDistance = null;
                this.pinchCenter = null;
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
                    } else 
                    {
                        item.scale(scaleX, scaleY, new paper.Point(0, 0));
                    }
                });

                this.oldSize = this.view.size.clone();
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
        
        if (newZoom === oldZoom) return;

        this.view.zoom = newZoom;
    }

    // Zoom out method
    zoomOut(factor = 1.25) 
    {
        const oldZoom = this.view.zoom;
        const newZoom = Math.max(oldZoom / factor, this.minZoom);

        if (newZoom === oldZoom) return;

        this.view.zoom = newZoom;
    }

    // Zoom reset method
    resetZoom() 
    {
        this.view.zoom = this.defaultZoom;
        if (this.defaultCenter && typeof this.defaultCenter.clone === 'function') {
            this.view.center = this.defaultCenter.clone();
        }
    }
}