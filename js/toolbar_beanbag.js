// toolbar_beanbag.js

export class BeanBagManager {
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
                this.draggedItem = target.data && target.data.isBeanBag ? target : (target.parent && target.parent.data && target.parent.data.isBeanBag ? target.parent : null);
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
                
                var bag = new window.paper.Path.Ellipse({
                    point: new window.paper.Point(-10, -6),
                    size: new window.paper.Size(20, 12),
                    strokeColor: '#e20cb7',
                    strokeWidth: 2,
                    fillColor: '#ff04fb',
                    fillOpacity: 0.4
                });
                
                var group = new window.paper.Group([bag]);
                group.position = snappedPoint;
                group.data.isBeanBag = true;
                
                this.saveState();
            }
        };
    }

    activate() { 
        this.tool.activate(); 
    }
}