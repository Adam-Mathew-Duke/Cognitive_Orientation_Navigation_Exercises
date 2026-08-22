// toolbar_rock.js

export class RockManager {
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
                tolerance: 15, 
                match: (r) => !(r.item.data && r.item.data.isGrid) 
            });

            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                this.draggedItem = target.data && target.data.isRock ? target : (target.parent && target.parent.data && target.parent.data.isRock ? target.parent : null);
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
                var rock = new window.paper.Path({ segments: [[-8, 4], [-10, -2], [-4, -8], [4, -8], [10, -2], [8, 6]], closed: true, fillColor: '#e20cb7', strokeColor: '#ff04fb', strokeWidth: 1.5 });
                var group = new window.paper.Group([rock]);
                group.position = snappedPoint;
                group.data.isRock = true;
                this.saveState();
            }
        };
    }

    activate() { 
        this.tool.activate(); 
    }
}