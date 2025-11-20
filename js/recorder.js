/**
 * Recorder Service
 * Handles Audio Recording and Visualization
 */

class RecorderService {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.animationId = null;
        this.isRecording = false;
    }

    async init(canvasElement) {
        this.canvas = canvasElement;
        this.canvasCtx = this.canvas.getContext("2d");

        // Resize canvas
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
            this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // We don't rely on this internal onstop for the main flow anymore, 
            // but it's good for safety if the stream stops unexpectedly.
            this.mediaRecorder.onstop = () => {
                // No-op here, handled in stopRecording
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startVisualization();
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied. Please ensure you are using HTTPS or localhost.");
            return false;
        }
    }

    stopRecording() {
        return new Promise((resolve) => {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.onstop = () => {
                    const mimeType = this.mediaRecorder.mimeType || "audio/webm";
                    this.audioBlob = new Blob(this.audioChunks, { type: mimeType });
                    this.stopVisualization();
                    this.isRecording = false;
                    this.stream.getTracks().forEach(track => track.stop());
                    resolve(this.audioBlob);
                };
                try {
                    this.mediaRecorder.stop();
                } catch (e) {
                    console.warn("MediaRecorder stop failed:", e);
                    // Force resolve if stop fails
                    this.isRecording = false;
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    }

    startVisualization() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            this.analyser.getByteTimeDomainData(this.dataArray);

            this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.02)'; // Fade effect
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.canvasCtx.lineWidth = 2;
            this.canvasCtx.strokeStyle = '#FF7675'; // Danger color
            this.canvasCtx.beginPath();

            const sliceWidth = this.canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = this.dataArray[i] / 128.0;
                const y = v * this.canvas.height / 2;

                if (i === 0) {
                    this.canvasCtx.moveTo(x, y);
                } else {
                    this.canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
            this.canvasCtx.stroke();
        };

        draw();
    }

    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getAudioUrl() {
        if (this.audioBlob) {
            return URL.createObjectURL(this.audioBlob);
        }
        return null;
    }
}

window.RecorderService = new RecorderService();
