// toolbar_helmet.js

export class HelmetManager {
    constructor(saveStateCallback, gridManager) {
        this.saveState = saveStateCallback || (() => {});
        this.gridManager = gridManager;
        this.tool = new window.paper.Tool();
        this.draggedItem = null;
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
                match: (r) => !(r.item.data && r.item.data.isGrid) 
            });

            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                this.draggedItem = target.data && target.data.isHelmet ? target : (target.parent && target.parent.data && target.parent.data.isHelmet ? target.parent : null);
            } else {
                this.draggedItem = null;
            }
        };

        this.tool.onMouseDrag = (event) => {
            // Only count as moved if the pointer drags past a 5px threshold (prevents mobile jitter)
            if (this.downPoint && event.point.getDistance(this.downPoint) > 5) {
                this.hasMoved = true;
            }

            if (this.draggedItem) {
                this.draggedItem.position = this.draggedItem.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = (event) => {
            if (this.draggedItem) {
                this.draggedItem.position = this._snapToGrid(this.draggedItem.position);
                this.saveState();
                this.draggedItem = null;
            } else if (!this.hasMoved) {
                var snappedPoint = this._snapToGrid(event.point);
                var helmet = new window.paper.Path.Circle({ center: [0, 0], radius: 13.5, fillColor: '#ff04fb', strokeColor: '#e20cb7', strokeWidth: 2 });
                var guard = new window.paper.Path.Rectangle({ point: new window.paper.Point(-9, 3), size: new window.paper.Size(18, 6), fillColor: '#e20cb7' });
                var group = new window.paper.Group([helmet, guard]);
                group.position = snappedPoint;
                group.data.isHelmet = true;
                this.saveState();
            }
            this.downPoint = null;
        };
    }

    activate() { 
        this.tool.activate(); 
    }
}