// toolbar_shoe.js

export class ShoeManager {
    constructor(saveStateCallback, gridManager) {
        this.saveState = saveStateCallback || (() => {});
        this.gridManager = gridManager;
        this.tool = new window.paper.Tool();
        this.draggedShoe = null;
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
                match: (result) => {
                    if (result.item.data && result.item.data.isGrid) return false;
                    if (result.item.parent && result.item.parent.data && result.item.parent.data.isGrid) return false;
                    return true;
                }
            });
            
            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                if (target.data && target.data.isShoe) {
                    this.draggedShoe = target;
                } else if (target.parent && target.parent.data && target.parent.data.isShoe) {
                    this.draggedShoe = target.parent;
                } else {
                    this.draggedShoe = null; 
                }
            } else {
                this.draggedShoe = null;
            }
        };

        this.tool.onMouseDrag = (event) => {
            this.hasMoved = true;
            if (this.draggedShoe) {
                this.draggedShoe.position = this.draggedShoe.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = (event) => {
            if (this.draggedShoe) {
                this.draggedShoe.position = this._snapToGrid(this.draggedShoe.position);
                this.saveState();
                this.draggedShoe = null;
            } else if (!this.hasMoved) {
                var snappedPoint = this._snapToGrid(event.point);

                // Shoe Upper Body
                var shoeUpper = new window.paper.Path({
                    pathData: 'M-10 1.5C-10 1.5 -9 -3 -6 -4.5C-3 -6 -0.5 -6 1.5 -4.5C3.5 -3 5.5 -4 7.5 -5.5C9.5 -7 10 -5 10 -3.5C10 -2 9 -0.5 8 0.5C7 1.5 5 1.5 3 1.5H-10V1.5Z',
                    strokeColor: '#ff04fb59',
                    strokeWidth: 2,
                    strokeJoin: 'round',
                    fillColor: '#ff04fb22'
                });

                // Shoe Sole
                var shoeSole = new window.paper.Path({
                    pathData: 'M-11 2.5H9.5C10.3 2.5 10.5 3.2 10.5 4C10.5 4.8 10.3 5.5 9.5 5.5H-11C-11.8 5.5 -12 4.8 -12 4C-12 3.2 -11.8 2.5 -11 2.5Z',
                    position: new window.paper.Point(0, 2),
                    fillColor: '#e20cb7',
                    strokeColor: '#ffffff',
                    strokeWidth: 1.5,
                    strokeJoin: 'round'
                });

                var shoeGroup = new window.paper.Group([shoeUpper, shoeSole]);
                
                // Scale it up to match the cone's footprint and position it at the snapped point
                shoeGroup.scale(2.2);
                shoeGroup.position = snappedPoint;
                
                shoeGroup.data.isShoe = true;

                this.saveState();
            }
        };
    }

    activate() {
        this.tool.activate();
    }
}