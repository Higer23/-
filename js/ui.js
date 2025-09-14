// ui.js
const dom = {
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalContent: document.getElementById('modal-content'),
    errorMessage: document.getElementById('error-message'),
    spinnerOverlay: document.getElementById('spinner-overlay'),
    statusMessage: document.getElementById('status-message')
};

/**
 * Plays a sound effect using Tone.js.
 * @param {Array} noteSequence - Array of notes to play. e.g., [{note: "C4", duration: "8n"}]
 */
export const playSound = async (noteSequence) => {
    try {
        await Tone.start();
        const synth = new Tone.Synth().toDestination();
        const now = Tone.now();
        noteSequence.forEach((note, i) => synth.triggerAttackRelease(note.note, note.duration, now + i * 0.15));
    } catch (error) {
        console.warn("Could not play sound effect:", error);
    }
};

/**
 * Shakes the modal and displays an error message.
 * @param {string} message - The error message to display.
 */
export const shakeModal = (message) => {
    dom.errorMessage.textContent = message;
    dom.errorMessage.classList.remove('hidden');
    dom.modalContent.classList.add('animate-shake');
    setTimeout(() => dom.modalContent.classList.remove('animate-shake'), 500);
};

/**
 * Shows a status message at the bottom right.
 * @param {string} message - The message to display.
 * @param {boolean} isSuccess - Determines if the message is for success or failure.
 */
export const showStatusMessage = (message, isSuccess) => {
    dom.statusMessage.textContent = message;
    dom.statusMessage.className = `fixed bottom-5 right-5 p-4 rounded-lg text-white font-bold shadow-lg z-[70] transition-all duration-500 ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`;
    dom.statusMessage.classList.remove('opacity-0', 'translate-y-4');
    setTimeout(() => {
        dom.statusMessage.classList.add('opacity-0', 'translate-y-4');
    }, 4000);
};

/**
 * Toggles the loading spinner overlay.
 * @param {boolean} show - Whether to show or hide the spinner.
 */
export const toggleSpinner = (show) => {
    dom.spinnerOverlay.classList.toggle('hidden', !show);
};

/**
 * Toggles the entry modal.
 * @param {boolean} show - Whether to show or hide the modal.
 */
export const toggleModal = (show) => {
    dom.modalBackdrop.classList.toggle('hidden', !show);
};
