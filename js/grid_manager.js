export class GridManager 
{
constructor(view, spacing = 40) 
    {
        this.view = view;
        this.baseSpacing = spacing;
        this.spacing = spacing;
        this.gridGroup = new window.paper.Group();
        this.gridGroup.sendToBack();
        
        // Draw immediately
        this.drawGrid();
        
        // Safety net: Force a redraw on the very first frame render when canvas dimensions are 100% guaranteed layout-ready
        const handleFirstFrame = (event) => {
            this.drawGrid();
            this.view.off('frame', handleFirstFrame);
        };
        this.view.on('frame', handleFirstFrame);

        this.initHandlers();
    }

    snapToGrid(point) 
    {
        return new window.paper.Point(
            Math.round(point.x / this.baseSpacing) * this.baseSpacing,
            Math.round(point.y / this.baseSpacing) * this.baseSpacing
        );
    }

    drawGrid() 
    {
        this.gridGroup.removeChildren();

        const bounds = this.view.bounds;
        const zoom = this.view.zoom;

        // --- CLEANER LOD STEPPING ---
        // Dynamically adjust grid frequency based on zoom so lines never crowd together
        let stepMultiplier = 1;
        if (zoom < 0.25) stepMultiplier = 8;
        else if (zoom < 0.5) stepMultiplier = 4;
        else if (zoom < 0.8) stepMultiplier = 2;

        this.spacing = this.baseSpacing * stepMultiplier;

        // Keep stroke width stable and crisp
        const strokeWidth = Math.max(1, 1 / zoom); 

        // Solid, clean colors instead of low-alpha multi-line compounding
        const color = 'rgba(226, 12, 183, 0.25)';
        const centerColor = 'rgba(226, 12, 183, 0.55)';

        // Add padding so the grid extends beyond the current viewport
        const padding = Math.max(bounds.width, bounds.height) * 0.5;
        const paddedBounds = bounds.expand(padding);

        const startX = Math.floor(paddedBounds.left / this.spacing) * this.spacing;
        const endX = Math.ceil(paddedBounds.right / this.spacing) * this.spacing;
        const startY = Math.floor(paddedBounds.top / this.spacing) * this.spacing;
        const endY = Math.ceil(paddedBounds.bottom / this.spacing) * this.spacing;

        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.spacing) 
        {
            const isCenterAxis = Math.abs(x) < 0.001; 
            const lineColor = isCenterAxis ? centerColor : color;
            const lineWidth = isCenterAxis ? strokeWidth * 1.5 : strokeWidth;

            const line = new window.paper.Path.Line({
                from: [x, paddedBounds.top],
                to: [x, paddedBounds.bottom],
                strokeColor: lineColor,
                strokeWidth: lineWidth
            });
            line.data.isGrid = true;
            this.gridGroup.addChild(line);
        }

        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.spacing) 
        {
            const isCenterAxis = Math.abs(y) < 0.001;
            const lineColor = isCenterAxis ? centerColor : color;
            const lineWidth = isCenterAxis ? strokeWidth * 1.5 : strokeWidth;

            const line = new window.paper.Path.Line({
                from: [paddedBounds.left, y],
                to: [paddedBounds.right, y],
                strokeColor: lineColor,
                strokeWidth: lineWidth
            });
            line.data.isGrid = true;
            this.gridGroup.addChild(line);
        }

        this.gridGroup.sendToBack();
    }

    initHandlers() 
    {
        const oldOnResize = this.view.onResize;
        this.view.onResize = (event) => {
            if (typeof oldOnResize === 'function') oldOnResize(event);
            this.drawGrid();
        };
    }

    _restoreGrid() {
    if (this.gridManager) {
        // 1. Make the grid visible again if it was hidden
        if (this.gridManager.gridGroup) {
            this.gridManager.gridGroup.visible = true;
        }
        // 2. Trigger the grid manager to redraw the grid lines/dots
        this.gridManager.drawGrid();
    }
}
}