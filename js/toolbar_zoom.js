// js/toolbar_zoom.js
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
        this.initListeners();
        this.initResizeHandler();
    }

    // Element listeners
    initListeners() 
    {
        // Button element listeners
        const zoomInBtn = document.getElementById('toolbar-main-zoom-in-btn');
        const zoomOutBtn = document.getElementById('toolbar-main-zoom-out-btn');
        const zoomDefaultBtn = document.getElementById('toolbar-main-zoom-default-btn');

        // Zoom default button listener
        if (zoomDefaultBtn) 
        {
            zoomDefaultBtn.addEventListener('click', () =>
            {
                this.resetZoom();
            });
        }

        // Zoom in button listener
        if (zoomInBtn) 
        {
            zoomInBtn.addEventListener('click', () => 
            {
                this.zoomIn();
            });
        }

        // Zoom out button listener
        if (zoomOutBtn) 
        {
            zoomOutBtn.addEventListener('click', () => 
            {
                this.zoomOut();
            });
        }
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
            }, 250); // time for the view to rotate on mobile
        };
    }

    // Zoom in method
    zoomIn() 
    {
        var oldZoom = this.view.zoom;
        var oldCenter = this.view.center;
        var newZoom = Math.min(oldZoom * 1.5, 5);  
        this.view.zoom = newZoom;
        this.view.center = oldCenter.add(this.view.center.subtract(oldCenter).multiply(oldZoom / this.view.zoom));
    }

    // Zoom out method
    zoomOut() 
    {
        var oldZoom = this.view.zoom;
        var oldCenter = this.view.center;
        var newZoom = Math.max(oldZoom / 1.2, 0.5);
        this.view.zoom = newZoom;
        this.view.center = oldCenter.add(this.view.center.subtract(oldCenter).multiply(oldZoom / this.view.zoom));
    }

    // Zoom reset method
    resetZoom() 
    {
        this.view.zoom = this.defaultZoom;
        this.view.center = this.defaultCenter.clone();
    }
}
