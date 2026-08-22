// toolbar_cone.js

export class ConeManager {
    constructor(saveStateCallback, gridManager) {
        this.saveState = saveStateCallback || (() => {});
        this.gridManager = gridManager;
        this.tool = new window.paper.Tool();
        this.draggedCone = null;
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
                tolerance: 5,
                match: (result) => {
                    if (result.item.data && result.item.data.isGrid) {
                        return false;
                    }
                    if (result.item.parent && result.item.parent.data && result.item.parent.data.isGrid) {
                        return false;
                    }
                    return true;
                }
            });
            
            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                if (target.data && target.data.isCone) {
                    this.draggedCone = target;
                } else if (target.parent && target.parent.data && target.parent.data.isCone) {
                    this.draggedCone = target.parent;
                } else {
                    this.draggedCone = null; 
                }

                if (this.draggedCone) {
                    this.draggedCone.scale(1.15);
                }
            } else {
                this.draggedCone = null;
            }
        };

        this.tool.onMouseDrag = (event) => {
            // Only count as moved if the pointer drags past a 5px threshold (prevents mobile jitter)
            if (this.downPoint && event.point.getDistance(this.downPoint) > 5) {
                this.hasMoved = true;
            }

            if (this.draggedCone) {
                this.draggedCone.position = this.draggedCone.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = (event) => {
            if (this.draggedCone) {
                this.draggedCone.scale(1 / 1.15);
                this.draggedCone.position = this._snapToGrid(this.draggedCone.position);
                this.saveState();
                this.draggedCone = null;
            } else if (!this.hasMoved) {
                // SNAPPED POSITION FOR NEW CONE
                var snappedPoint = this._snapToGrid(event.point);

                var coneBase = new window.paper.Path.Circle({
                    center: snappedPoint,
                    radius: 22,
                    strokeColor: '#e20cb7',
                    strokeWidth: 2,
                    fillColor: '#ff04fb22'
                });

                var coneTop = new window.paper.Path.Circle({
                    center: snappedPoint,
                    radius: 8,
                    fillColor: '#e20cb7',
                    strokeColor: '#ffffff',
                    strokeWidth: 1
                });

                var coneGroup = new window.paper.Group([coneBase, coneTop]);
                coneGroup.data.isCone = true;

                this.saveState();
            }
            this.downPoint = null;
        };
    }

    activate() {
        this.tool.activate();
    }
}