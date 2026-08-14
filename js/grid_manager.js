export class GridManager 
{
    constructor(view, spacing = 40) 
    {
        this.view = view;
        this.spacing = spacing;
        this.gridGroup = new window.paper.Group();
        this.gridGroup.sendToBack(); // Keep grid behind all cones, paths, and notes
        
        this.drawGrid();
        this.initResizeHandler();
    }

    // Helper method to "snap that cat" 🐈 onto the grid coordinates
    snapToGrid(point) 
    {
        return new window.paper.Point(
            Math.round(point.x / this.spacing) * this.spacing,
            Math.round(point.y / this.spacing) * this.spacing
        );
    }

    drawGrid() 
    {
        // Clear any existing grid lines before redrawing
        this.gridGroup.removeChildren();

        const bounds = this.view.bounds;
        const color = 'rgba(226, 12, 183, 0.31)'; // Subtle pink matching your theme

        // Determine starting points aligned to the grid spacing
        const startX = Math.floor(bounds.left / this.spacing) * this.spacing;
        const endX = Math.ceil(bounds.right / this.spacing) * this.spacing;
        const startY = Math.floor(bounds.top / this.spacing) * this.spacing;
        const endY = Math.ceil(bounds.bottom / this.spacing) * this.spacing;

        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.spacing) 
        {
            const line = new window.paper.Path.Line({
                from: [x, bounds.top],
                to: [x, bounds.bottom],
                strokeColor: color,
                strokeWidth: 1
            });
            line.data.isGrid = true; // Tag it so hit-tests can ignore it
            this.gridGroup.addChild(line);
        }

        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.spacing) 
        {
            const line = new window.paper.Path.Line({
                from: [bounds.left, y],
                to: [bounds.right, y],
                strokeColor: color,
                strokeWidth: 1
            });
            line.data.isGrid = true; // Tag it so hit-tests can ignore it
            this.gridGroup.addChild(line);
        }

        // Ensure the grid stays at the very bottom layer
        this.gridGroup.sendToBack();
    }

    initResizeHandler() 
    {
        // Redraw grid smoothly when the canvas view size changes
        const oldOnResize = this.view.onResize;
        this.view.onResize = (event) => 
        {
            if (typeof oldOnResize === 'function') oldOnResize(event);
            this.drawGrid();
        };
    }
}