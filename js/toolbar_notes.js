// toolbar_notes.js

export class NoteManager {
    constructor(saveStateCallback) {
        this.saveState = saveStateCallback || (() => {});
        this.tool = new window.paper.Tool();
        this.draggedNote = null;

        this._initListeners();
    }

    _initListeners() {
        this.tool.onMouseDown = (event) => {
            var hitResult = window.paper.project.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
            
            if (hitResult && hitResult.item) {
                var target = hitResult.item;
                
                if (target.data && target.data.isNote) {
                    this.draggedNote = target;
                } else if (target.parent && target.parent.data && target.parent.data.isNote) {
                    this.draggedNote = target.parent;
                } else {
                    this.draggedNote = null; 
                }
            } else {

                var labelText = prompt("Note text:", "Note");
                    
                if (labelText.trim() !== "") {
                    var text = new window.paper.PointText({
                        point: [0, 0],
                        content: labelText,
                        fillColor: '#ffffff',
                        fontFamily: 'sans-serif',
                        fontSize: 12
                    });

                    var padding = 14;
                    var rect = new window.paper.Rectangle(
                        text.bounds.x - padding, 
                        text.bounds.y - padding, 
                        text.bounds.width + (padding * 2), 
                        text.bounds.height + (padding * 2)
                    );

                    var square = new window.paper.Path.Rectangle({
                        rectangle: rect,
                        fillColor: '#ff04fb59',
                        strokeColor: '#e20cb7',
                        strokeWidth: 2,
                        radius: 8
                    });

                    var noteGroup = new window.paper.Group([square, text]);
                    noteGroup.data.isNote = true;
                    noteGroup.position = event.point;

                    this.draggedNote = noteGroup; 

                    this.saveState();
                }
            }
        };

        this.tool.onMouseDrag = (event) => {
            if (this.draggedNote) {
                this.draggedNote.position = this.draggedNote.position.add(event.delta);
            }
        };

        this.tool.onMouseUp = () => {
            if (this.draggedNote) {
                this.saveState();
                this.draggedNote = null;
            }
        };
    }

    activate() {
        this.tool.activate();
    }
}