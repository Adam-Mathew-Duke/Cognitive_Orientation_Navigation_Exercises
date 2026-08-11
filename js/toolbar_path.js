// toolbar_path.js

export class PathManager {
    constructor(saveStateCallback) {
        this.saveState = saveStateCallback || (() => {});
        this.tool = new window.paper.Tool();
        this.currentPath = null;
        this.currentGlowPath = null;
        this.pathGroup = null;

        this._initListeners();
    }

    _initListeners() {
        this.tool.onMouseDown = (event) => {
            // 1. Create a wide, soft outer glow path
            this.currentGlowPath = new window.paper.Path({
                segments: [event.point],
                strokeColor: '#ff04fb59', // Matches your cone outer hue
                strokeWidth: 8,
                strokeCap: 'round',
                strokeJoin: 'round'
            });

            // 2. Create the sharp core path on top
            this.currentPath = new window.paper.Path({
                segments: [event.point],
                strokeColor: '#e20cb7', // Matches your cone inner color
                strokeWidth: 3,
                strokeCap: 'round',
                strokeJoin: 'round'
            });
        };

        this.tool.onMouseDrag = (event) => {
            if (this.currentPath && this.currentGlowPath) {
                this.currentPath.add(event.point);
                this.currentGlowPath.add(event.point);
            }
        };

        this.tool.onMouseUp = () => {
            if (this.currentPath && this.currentGlowPath) {
                this.currentPath.simplify();
                this.currentGlowPath.simplify();

                // Group them together so they act as a single unit for selection/clearing
                this.pathGroup = new window.paper.Group([this.currentGlowPath, this.currentPath]);
                this.pathGroup.data.isPath = true;

                this.saveState();

                this.currentPath = null;
                this.currentGlowPath = null;
                this.pathGroup = null;
            }
        };
    }

    activate() {
        this.tool.activate();
    }
}