// src/utils/audioManager.js
const audioManager = {
    currentAudio: null,
    currentCallback: null, // Callback to inform the component if audio was stopped externally
    stopCurrent: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentCallback) {
                this.currentCallback(false); // Notify component that playback stopped
            }
            // Do not nullify currentAudio and currentCallback here,
            // let the component that "owns" the audio do it on 'ended' or when it plays a new one.
        }
    },
    setCurrentAudio: function (audioInstance, componentCallback) {
        this.stopCurrent(); // Stop any audio that might be playing elsewhere
        this.currentAudio = audioInstance;
        this.currentCallback = componentCallback;
    },
    clearCurrentAudio: function (audioInstance) {
        // Clears manager's reference if audioInstance is the one currently managed.
        if (this.currentAudio === audioInstance) {
            this.currentAudio = null;
            this.currentCallback = null;
        }
    }
};

export default audioManager; 