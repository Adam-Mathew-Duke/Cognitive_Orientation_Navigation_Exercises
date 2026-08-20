// toolbar_trafficcone.js

export class TrafficConeManager {
    constructor(saveStateCallback, gridManager) {
        this.saveState = saveStateCallback || (() => {});
        this.gridManager = gridManager;
        this.tool = new window.paper.Tool();
        this.draggedItem = null;
        this.hasMoved = false;
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
            var hitResult = window.paper.project.hitTest(event.point, { 
                fill: true, 
                stroke: true, 
                tolerance: 5, 
                match: (r) => !(r.item.data && r.item.data.isGrid) 
            });

            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                this.draggedItem = target.data && target.data.isTrafficCone ? target : (target.parent && target.parent.data && target.parent.data.isTrafficCone ? target.parent : null);
            } else {
                this.draggedItem = null;
            }
        };

        this.tool.onMouseDrag = (event) => {
            this.hasMoved = true;
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
                var base = new window.paper.Path.Rectangle({ point: new window.paper.Point(-12, 9), size: new window.paper.Size(24, 6), fillColor: '#e20cb7' });
                var body = new window.paper.Path({ segments: [[0, -15], [-9, 9], [9, 9]], closed: true, fillColor: '#ff04fb', strokeColor: '#e20cb7', strokeWidth: 2 });
                var stripe = new window.paper.Path.Rectangle({ point: new window.paper.Point(-4.5, -1.5), size: new window.paper.Size(9, 4.5), fillColor: '#ffffff' });
                var group = new window.paper.Group([base, body, stripe]);
                group.position = snappedPoint;
                group.data.isTrafficCone = true;
                this.saveState();
            }
        };
    }

    activate() { 
        this.tool.activate(); 
    }
}