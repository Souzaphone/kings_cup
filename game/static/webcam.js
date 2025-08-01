/// webcam.js - Webcam streaming and drink detection functionality

class WebcamManager {
    constructor() {
        this.localStream = null;
        this.peers = {};
        this.videoElements = {};
        this.pose = null;
        this.isDrinking = false;
        this.drinkingCallback = null;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
    }

    async initialize(socket, gameId, playerName) {
        this.socket = socket;
        this.gameId = gameId;
        this.playerName = playerName;
        
        // Set up pose detection - will be initialized after MediaPipe scripts load
        this.initializePoseDetection();
        
        // Set up video display area
        this.setupVideoUI();
        
        // Start local webcam
        await this.startWebcam();
        
        // Set up socket listeners for WebRTC signaling
        this.setupSignaling();
        
        this.isInitialized = true;
        console.log('WebcamManager initialized');
    }

    setupVideoUI() {
        // Create video container in the game interface
        const videoContainer = document.createElement('div');
        videoContainer.id = 'video-container';
        videoContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 300px;
            height: 200px;
            z-index: 1000;
            background: rgba(0,0,0,0.8);
            border-radius: 10px;
            padding: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        `;
        
        document.body.appendChild(videoContainer);
        
        // Create local video element
        this.createVideoElement(this.playerName, true);
    }

    createVideoElement(playerName, isLocal = false) {
        const videoContainer = document.getElementById('video-container');
        
        const videoWrapper = document.createElement('div');
        videoWrapper.id = `video-wrapper-${playerName}`;
        videoWrapper.style.cssText = `
            position: relative;
            width: 140px;
            height: 105px;
            border-radius: 5px;
            overflow: hidden;
            border: 2px solid ${isLocal ? '#00ff00' : '#ffffff'};
        `;
        
        const video = document.createElement('video');
        video.id = `video-${playerName}`;
        video.autoplay = true;
        video.muted = isLocal; // Mute local video to prevent feedback
        video.playsInline = true;
        video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        
        const label = document.createElement('div');
        label.textContent = playerName;
        label.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            text-align: center;
            font-size: 12px;
            padding: 2px;
        `;
        
        // Drinking indicator
        const drinkingIndicator = document.createElement('div');
        drinkingIndicator.id = `drinking-${playerName}`;
        drinkingIndicator.textContent = '🍺';
        drinkingIndicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            font-size: 20px;
            display: none;
        `;
        
        videoWrapper.appendChild(video);
        videoWrapper.appendChild(label);
        videoWrapper.appendChild(drinkingIndicator);
        videoContainer.appendChild(videoWrapper);
        
        this.videoElements[playerName] = video;
        
        return video;
    }

    async startWebcam() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true
            });
            
            const localVideo = this.videoElements[this.playerName];
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
            
            // Set up pose detection on local video
            this.setupPoseDetection();
            
            console.log('Webcam started successfully');
            
            // Notify other players that this user has webcam ready
            this.socket.emit('webcam_ready', {
                gameId: this.gameId,
                playerName: this.playerName
            });
            
        } catch (error) {
            console.error('Error accessing webcam:', error);
            alert('Could not access webcam. Please check permissions.');
        }
    }

    async initializePoseDetection() {
        // Load MediaPipe scripts dynamically
        await this.loadMediaPipeScripts();
        
        if (window.Pose) {
            this.pose = new window.Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });
            
            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.pose.onResults(this.onPoseResults.bind(this));
        }
    }

    async loadMediaPipeScripts() {
        const scripts = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
        ];

        for (const scriptSrc of scripts) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = scriptSrc;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    setupPoseDetection() {
        if (!this.pose || !window.Camera) return;
        
        // Create hidden canvas for pose detection
        this.canvas = document.createElement('canvas');
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.ctx = this.canvas.getContext('2d');
        
        const camera = new window.Camera(this.videoElements[this.playerName], {
            onFrame: async () => {
                if (this.pose) {
                    await this.pose.send({image: this.videoElements[this.playerName]});
                }
            },
            width: 640,
            height: 480
        });
        camera.start();
    }

    onPoseResults(results) {
        if (!results.poseLandmarks) return;
        
        const landmarks = results.poseLandmarks;
        
        // Detect drinking gesture using pose landmarks
        const isDrinkingNow = this.detectDrinking(landmarks);
        
        if (isDrinkingNow !== this.isDrinking) {
            this.isDrinking = isDrinkingNow;
            
            // Show/hide drinking indicator
            const indicator = document.getElementById(`drinking-${this.playerName}`);
            if (indicator) {
                indicator.style.display = this.isDrinking ? 'block' : 'none';
            }
            
            // Emit drinking state change
            this.socket.emit('drinking_state_change', {
                gameId: this.gameId,
                playerName: this.playerName,
                isDrinking: this.isDrinking
            });
            
            // Trigger callback if set
            if (this.drinkingCallback) {
                this.drinkingCallback(this.playerName, this.isDrinking);
            }
            
            console.log(`${this.playerName} ${this.isDrinking ? 'started' : 'stopped'} drinking`);
        }
    }

    detectDrinking(landmarks) {
        // Get key landmarks for drinking detection
        const leftWrist = landmarks[15];   // Left wrist
        const rightWrist = landmarks[16];  // Right wrist
        const leftShoulder = landmarks[11]; // Left shoulder
        const rightShoulder = landmarks[12]; // Right shoulder
        const nose = landmarks[0];         // Nose
        
        if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !nose) {
            return false;
        }
        
        // Check if either hand is near the face (drinking gesture)
        const leftHandNearFace = this.isHandNearFace(leftWrist, nose, leftShoulder);
        const rightHandNearFace = this.isHandNearFace(rightWrist, nose, rightShoulder);
        
        return leftHandNearFace || rightHandNearFace;
    }

    isHandNearFace(wrist, nose, shoulder) {
        // Calculate distance between wrist and nose
        const distance = Math.sqrt(
            Math.pow(wrist.x - nose.x, 2) + Math.pow(wrist.y - nose.y, 2)
        );
        
        // Calculate shoulder distance for normalization
        const shoulderDistance = Math.sqrt(
            Math.pow(shoulder.x - nose.x, 2) + Math.pow(shoulder.y - nose.y, 2)
        );
        
        // Hand is considered near face if within 0.3 times the shoulder distance
        const normalizedDistance = distance / shoulderDistance;
        const isNearFace = normalizedDistance < 0.3;
        
        // Also check if hand is above shoulder level (drinking motion)
        const isAboveShoulderLevel = wrist.y < shoulder.y;
        
        return isNearFace && isAboveShoulderLevel;
    }

    setupSignaling() {
        // Handle new players joining
        this.socket.on('player_webcam_ready', (data) => {
            const { playerName } = data;
            if (playerName !== this.playerName) {
                this.createPeerConnection(playerName, true); // Initiator
            }
        });
        
        // Handle WebRTC signaling
        this.socket.on('webrtc_offer', async (data) => {
            const { from, offer } = data;
            if (from !== this.playerName) {
                await this.handleOffer(from, offer);
            }
        });
        
        this.socket.on('webrtc_answer', async (data) => {
            const { from, answer } = data;
            if (from !== this.playerName && this.peers[from]) {
                await this.peers[from].signal(answer);
            }
        });
        
        this.socket.on('webrtc_ice_candidate', async (data) => {
            const { from, candidate } = data;
            if (from !== this.playerName && this.peers[from]) {
                await this.peers[from].signal(candidate);
            }
        });
        
        // Handle drinking state changes from other players
        this.socket.on('player_drinking_state', (data) => {
            const { playerName, isDrinking } = data;
            if (playerName !== this.playerName) {
                const indicator = document.getElementById(`drinking-${playerName}`);
                if (indicator) {
                    indicator.style.display = isDrinking ? 'block' : 'none';
                }
            }
        });
        
        // Handle player leaving
        this.socket.on('player_left', (data) => {
            const { players } = data;
            // Remove video elements for players who left
            Object.keys(this.videoElements).forEach(playerName => {
                if (playerName !== this.playerName && !players.includes(playerName)) {
                    this.removeVideoElement(playerName);
                }
            });
        });
    }

    async createPeerConnection(targetPlayer, isInitiator) {
        if (this.peers[targetPlayer]) return; // Already connected
        
        const peer = new window.SimplePeer({
            initiator: isInitiator,
            stream: this.localStream,
            trickle: false
        });
        
        peer.on('signal', (data) => {
            if (data.type === 'offer') {
                this.socket.emit('webrtc_offer', {
                    gameId: this.gameId,
                    to: targetPlayer,
                    from: this.playerName,
                    offer: data
                });
            } else if (data.type === 'answer') {
                this.socket.emit('webrtc_answer', {
                    gameId: this.gameId,
                    to: targetPlayer,
                    from: this.playerName,
                    answer: data
                });
            }
        });
        
        peer.on('stream', (stream) => {
            // Create video element for remote player if it doesn't exist
            if (!this.videoElements[targetPlayer]) {
                this.createVideoElement(targetPlayer, false);
            }
            this.videoElements[targetPlayer].srcObject = stream;
        });
        
        peer.on('error', (error) => {
            console.error(`WebRTC error with ${targetPlayer}:`, error);
        });
        
        this.peers[targetPlayer] = peer;
    }

    async handleOffer(fromPlayer, offer) {
        await this.createPeerConnection(fromPlayer, false);
        await this.peers[fromPlayer].signal(offer);
    }

    removeVideoElement(playerName) {
        const wrapper = document.getElementById(`video-wrapper-${playerName}`);
        if (wrapper) {
            wrapper.remove();
        }
        
        if (this.videoElements[playerName]) {
            delete this.videoElements[playerName];
        }
        
        if (this.peers[playerName]) {
            this.peers[playerName].destroy();
            delete this.peers[playerName];
        }
    }

    // Set callback for drinking detection events
    setDrinkingCallback(callback) {
        this.drinkingCallback = callback;
    }

    // Clean up resources
    destroy() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        Object.values(this.peers).forEach(peer => peer.destroy());
        
        const videoContainer = document.getElementById('video-container');
        if (videoContainer) {
            videoContainer.remove();
        }
        
        this.isInitialized = false;
    }
}

export { WebcamManager };