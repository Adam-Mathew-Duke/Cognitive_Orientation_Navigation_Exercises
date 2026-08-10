// js/toolbar_zoom.js

export class ZoomManager 
{
    constructor(view) 
    {
        this.view = view;
        this.defaultZoom = view.zoom;
        this.defaultCenter = view.center.clone();
        this.oldSize = view.size.clone();
        this.resizeTimeout = null;
        this.initListeners();
        this.initResizeHandler();
    }

    initListeners() 
    {
        const zoomInBtn = document.getElementById('toolbar-main-zoom-in-btn');
        const zoomOutBtn = document.getElementById('toolbar-main-zoom-out-btn');
        const zoomDefaultBtn = document.getElementById('toolbar-main-zoom-default-btn');

        if (zoomDefaultBtn) 
        {
            zoomDefaultBtn.addEventListener('click', () =>
            {
                this.resetZoom();
            });
        }

        if (zoomInBtn) 
        {
            zoomInBtn.addEventListener('click', () => 
            {
                this.zoomIn();
            });
        }

        if (zoomOutBtn) 
        {
            zoomOutBtn.addEventListener('click', () => 
            {
                this.zoomOut();
            });
        }
    }

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

    zoomIn() 
    {
        var oldZoom = this.view.zoom;
        var oldCenter = this.view.center;
        var newZoom = Math.min(oldZoom * 1.5, 5);  
        this.view.zoom = newZoom;
        this.view.center = oldCenter.add(this.view.center.subtract(oldCenter).multiply(oldZoom / this.view.zoom));
    }

    zoomOut() 
    {
        var oldZoom = this.view.zoom;
        var oldCenter = this.view.center;
        var newZoom = Math.max(oldZoom / 1.2, 0.5);
        this.view.zoom = newZoom;
        this.view.center = oldCenter.add(this.view.center.subtract(oldCenter).multiply(oldZoom / this.view.zoom));
    }

    resetZoom() 
    {
        this.view.zoom = this.defaultZoom;
        this.view.center = this.defaultCenter.clone();
    }
}