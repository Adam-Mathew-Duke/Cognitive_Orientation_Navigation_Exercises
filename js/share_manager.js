// share_manager.js

export class ShareManager {
    constructor(buttonId) {
        this.button = document.getElementById(buttonId);
        this._initListener();
    }

    _initListener() {
        if (this.button) {
            this.button.addEventListener('click', () => {
                this.copyShareableURL();
            });
        }
    }

    copyShareableURL() {
        try {
            var jsonString = window.paper.project.exportJSON();
            var encoded = encodeURIComponent(jsonString);
            
            var baseUrl = window.location.origin + window.location.pathname;
            var shareableUrl = baseUrl + "#" + encoded;
            
            navigator.clipboard.writeText(shareableUrl).then(function() {
                alert('URL copied to clipboard!');
            }).catch(function(err) {
                console.error('Failed to copy URL to the clipboard: ', err);
            });
        } catch (e) {
            console.error("Failed to create sharable URL:", e);
        }
    }
}