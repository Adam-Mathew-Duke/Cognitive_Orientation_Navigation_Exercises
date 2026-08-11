// toolbar_cone.js

export class ConeManager {
    constructor(saveStateCallback) {
        this.saveState = saveStateCallback || (() => {});
        this.tool = new window.paper.Tool();
        this.draggedCone = null;
        
        this._initListeners();
    }

    _initListeners() {
        this.tool.onMouseDown = (event) => {
            var hitResult = window.paper.project.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
            
            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                
                // Only grab it if it's explicitly marked as a cone
                if (target.data && target.data.isCone) {
                    this.draggedCone = target;
                } else if (target.parent && target.parent.data && target.parent.data.isCone) {
                    this.draggedCone = target.parent;
                } else {
                    this.draggedCone = null; // Ignore notes or paths
                }
            } else {

            var coneBase = new window.paper.Path.Circle({
                center: event.point,
                radius: 22,
                strokeColor: '#e20cb7',
                strokeWidth: 2,
                fillColor: '#ff04fb22' // Subtle translucent outer footprint
            });

            var coneTop = new window.paper.Path.Circle({
                center: event.point,
                radius: 8,
                fillColor: '#e20cb7',
                strokeColor: '#ffffff',
                strokeWidth: 1
            });

            var coneGroup = new window.paper.Group([coneBase, coneTop]);
            coneGroup.data.isCone = true;

                    this.saveState();
            }
        };

        this.tool.onMouseDrag = (event) => {
            if (this.draggedCone) {
                this.draggedCone.position = this.draggedCone.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = () => {
            if (this.draggedCone) {
                this.saveState();
                this.draggedCone = null;
            }
        };
    }

    activate() {
        this.tool.activate();
    }
}