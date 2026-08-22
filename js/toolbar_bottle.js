// toolbar_bottle.js

export class WaterBottleManager {
    constructor(saveStateCallback, gridManager) {
        this.saveState = saveStateCallback || (() => {});
        this.gridManager = gridManager;
        this.tool = new window.paper.Tool();
        this.draggedBottle = null;
        this.hasMoved = false;
        this.downPoint = null; // Track where the touch started
        this.gridSpacing = gridManager ? gridManager.spacing : 40;
        
        this._initListeners();
    }

    _snapToGrid(point) {
        return new window.paper.Point(
            Math.round(point.x / this.gridSpacing) * this.gridSpacing,
            Math.round(point.y / this.gridSpacing) * this.gridSpacing
        );
    }

    _initListeners() {
        this.tool.onMouseDown = (event) => {
            this.hasMoved = false;
            this.downPoint = event.point; // Record starting point

            var hitResult = window.paper.project.hitTest(event.point, { 
                fill: true, 
                stroke: true, 
                tolerance: 15,
                match: (result) => {
                    if (result.item.data && result.item.data.isGrid) return false;
                    if (result.item.parent && result.item.parent.data && result.item.parent.data.isGrid) return false;
                    return true;
                }
            });
            
            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                if (target.data && target.data.isBottle) {
                    this.draggedBottle = target;
                } else if (target.parent && target.parent.data && target.parent.data.isBottle) {
                    this.draggedBottle = target.parent;
                } else {
                    this.draggedBottle = null; 
                }
            } else {
                this.draggedBottle = null;
            }
        };

        this.tool.onMouseDrag = (event) => {
            // Only count as moved if the pointer drags past a 5px threshold (prevents mobile jitter)
            if (this.downPoint && event.point.getDistance(this.downPoint) > 5) {
                this.hasMoved = true;
            }

            if (this.draggedBottle) {
                this.draggedBottle.position = this.draggedBottle.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = (event) => {
            if (this.draggedBottle) {
                this.draggedBottle.position = this._snapToGrid(this.draggedBottle.position);
                this.saveState();
                this.draggedBottle = null;
            } else if (!this.hasMoved) {
                var snappedPoint = this._snapToGrid(event.point);

                // Bottle Cap
                var cap = new window.paper.Path.Rectangle({
                    point: new window.paper.Point(-2, -11),
                    size: new window.paper.Size(4, 3),
                    fillColor: '#e20cb7',
                    strokeColor: '#ffffff',
                    strokeWidth: 1.5,
                    radius: 0.5
                });

                // Bottle Body
                var body = new window.paper.Path.Rectangle({
                    point: new window.paper.Point(-5, -8),
                    size: new window.paper.Size(10, 16),
                    strokeColor: '#ff04fb59',
                    strokeWidth: 2,
                    fillColor: '#ff04fb22',
                    radius: 2
                });

                // Label stripe
                var label = new window.paper.Path.Rectangle({
                    point: new window.paper.Point(-5, -2),
                    size: new window.paper.Size(10, 6),
                    fillColor: '#e20cb7',
                    fillOpacity: 0.6
                });

                var bottleGroup = new window.paper.Group([body, label, cap]);
                
                // Scale and place on grid
                bottleGroup.scale(2.0);
                bottleGroup.position = snappedPoint;
                bottleGroup.data.isBottle = true;

                this.saveState();
            }
            this.downPoint = null;
        };
    }

    activate() {
        this.tool.activate();
    }
}