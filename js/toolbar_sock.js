// toolbar_sock.js

export class SockManager {
    constructor(saveStateCallback, gridManager) {
        this.saveState = saveStateCallback || (() => {});
        this.gridManager = gridManager;
        this.tool = new window.paper.Tool();
        this.draggedSock = null;
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
                match: (result) => {
                    if (result.item.data && result.item.data.isGrid) return false;
                    if (result.item.parent && result.item.parent.data && result.item.parent.data.isGrid) return false;
                    return true;
                }
            });
            
            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                if (target.data && target.data.isSock) {
                    this.draggedSock = target;
                } else if (target.parent && target.parent.data && target.parent.data.isSock) {
                    this.draggedSock = target.parent;
                } else {
                    this.draggedSock = null; 
                }
            } else {
                this.draggedSock = null;
            }
        };

        this.tool.onMouseDrag = (event) => {
            this.hasMoved = true;
            if (this.draggedSock) {
                this.draggedSock.position = this.draggedSock.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = (event) => {
            if (this.draggedSock) {
                this.draggedSock.position = this._snapToGrid(this.draggedSock.position);
                this.saveState();
                this.draggedSock = null;
            } else if (!this.hasMoved) {
                var snappedPoint = this._snapToGrid(event.point);

                // Sock Main Body (Vertical leg + horizontal foot)
                var body = new window.paper.Path.Rectangle({
                    point: new window.paper.Point(-4, -10),
                    size: new window.paper.Size(8, 16),
                    strokeColor: '#ff04fb59',
                    strokeWidth: 2,
                    fillColor: '#ff04fb22',
                    radius: 1
                });

                // Cuff stripe at the top
                var cuff = new window.paper.Path.Rectangle({
                    point: new window.paper.Point(-4, -10),
                    size: new window.paper.Size(8, 4),
                    fillColor: '#e20cb7',
                    fillOpacity: 0.6
                });

                // Toe/Heel accent block
                var toe = new window.paper.Path.Rectangle({
                    point: new window.paper.Point(0, 2),
                    size: new window.paper.Size(4, 4),
                    fillColor: '#e20cb7'
                });

                var sockGroup = new window.paper.Group([body, cuff, toe]);
                
                sockGroup.scale(2.0);
                sockGroup.position = snappedPoint;
                sockGroup.data.isSock = true;

                this.saveState();
            }
        };
    }

    activate() {
        this.tool.activate();
    }
}