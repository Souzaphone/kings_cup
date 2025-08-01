# Webcam & Drink Detection Feature

## Overview

This feature adds real-time webcam streaming and AI-powered drink detection to the King's Cup multiplayer card game. Players can see each other's webcam feeds during gameplay, and the system automatically detects when players are drinking, integrating this with the game mechanics.

## Features

### 1. Real-time Video Streaming
- **Peer-to-peer WebRTC connections** for efficient video streaming
- **Multiple participant support** - see all players' webcam feeds simultaneously
- **Automatic connection management** - handles player joining/leaving
- **Low-latency streaming** optimized for real-time gameplay

### 2. AI-Powered Drink Detection
- **Computer vision using MediaPipe Pose** for real-time pose estimation
- **Drinking gesture recognition** - detects when hand is near face in drinking motion
- **Automatic game integration** - drinking events trigger game actions
- **Visual indicators** - beer emoji appears when drinking is detected

### 3. Game Integration
- **Automatic drinking completion** - AI detection replaces manual "I'm done drinking" actions
- **Real-time notifications** - all players see when someone is drinking
- **Seamless card event integration** - works with all existing drinking card mechanics

## Technical Implementation

### Frontend Components

#### WebcamManager Class (`/static/webcam.js`)
- Manages webcam access and video streaming
- Handles WebRTC peer connections using SimplePeer
- Implements MediaPipe pose detection for drink recognition
- Provides UI for video display and drinking indicators

#### Main Game Integration (`/static/main.js`)
- `toggleWebcam()` function for enabling/disabling webcam
- Integration with existing game socket events
- Cleanup handling when leaving games

### Backend Components

#### Server Socket Events (`app.js`)
- `webcam_ready` - Player announces webcam is available
- `webrtc_offer/answer/ice_candidate` - WebRTC signaling
- `drinking_state_change` - Real-time drinking detection events
- `player_drinking_state` - Broadcast drinking status to all players

### Dependencies Added
- `simple-peer` - WebRTC peer connections
- `@mediapipe/pose` - AI pose estimation
- `@mediapipe/camera_utils` - Camera utilities
- `@tensorflow/tfjs` - Machine learning framework

## Usage Instructions

### For Players

1. **Enable Webcam**
   - Click the "Enable Webcam" button in the game interface
   - Grant camera permissions when prompted
   - Your video will appear in the video panel on the right side

2. **Automatic Drink Detection**
   - The system automatically detects when you're drinking
   - A beer emoji 🍺 appears on your video when drinking is detected
   - No need to manually indicate when you're done drinking

3. **Viewing Other Players**
   - Other players' webcam feeds appear automatically when they enable their cameras
   - Drinking indicators show when other players are drinking

### For Developers

#### Enabling Webcam Programmatically
```javascript
// Initialize webcam manager
const webcamManager = new WebcamManager();
await webcamManager.initialize(socket, gameId, playerName);

// Set up drinking detection callback
webcamManager.setDrinkingCallback((playerName, isDrinking) => {
    console.log(`${playerName} ${isDrinking ? 'started' : 'stopped'} drinking`);
});
```

#### Adding Custom Drink Detection Logic
```javascript
// Override the detectDrinking method for custom logic
WebcamManager.prototype.detectDrinking = function(landmarks) {
    // Custom drinking detection algorithm
    // Return true if drinking, false otherwise
};
```

## Configuration

### Pose Detection Settings
The system uses MediaPipe Pose with the following configuration:
- `modelComplexity: 1` - Balance between accuracy and performance
- `minDetectionConfidence: 0.5` - Minimum confidence for pose detection
- `minTrackingConfidence: 0.5` - Minimum confidence for pose tracking

### Drinking Detection Algorithm
The algorithm detects drinking by analyzing:
1. **Hand position relative to face** - Hand must be near nose area
2. **Hand elevation** - Hand must be above shoulder level
3. **Normalized distance calculation** - Uses shoulder distance for scale normalization

### Video Display Settings
- **Video resolution**: 640x480 for optimal performance
- **Display size**: 140x105 pixels in game interface
- **Position**: Fixed panel on right side of game area
- **Auto-mute**: Local video is muted to prevent audio feedback

## Testing

### Test Page
Access `/test-webcam` for isolated testing of webcam functionality:
- Basic webcam initialization
- Pose detection testing
- Drinking detection validation
- Socket event simulation

### Manual Testing Steps
1. Start the server: `npm start`
2. Open browser to `http://localhost:5000/test-webcam`
3. Click "Start Webcam" and grant permissions
4. Simulate drinking motions to test detection
5. Check logs for detection events

## Troubleshooting

### Common Issues

#### "Could not access webcam"
- **Cause**: Browser permissions not granted
- **Solution**: Check browser settings and grant camera access

#### "WebRTC connection failed"
- **Cause**: Network firewall or NAT issues
- **Solution**: Ensure appropriate ports are open, consider STUN/TURN servers

#### "Pose detection not working"
- **Cause**: MediaPipe scripts failed to load
- **Solution**: Check internet connection and CDN availability

#### "False positive drinking detection"
- **Cause**: Hand near face for other reasons (scratching, thinking)
- **Solution**: Adjust detection thresholds in `detectDrinking()` method

### Performance Optimization

1. **Reduce video quality** for slower connections
2. **Limit number of simultaneous streams** (currently supports unlimited)
3. **Implement adaptive bitrate** based on connection quality
4. **Add connection quality indicators**

## Security Considerations

### Privacy
- All video streams are peer-to-peer (no server recording)
- Webcam access requires explicit user permission
- Videos are not stored or transmitted to external servers

### Performance
- MediaPipe processing runs locally in browser
- WebRTC reduces server bandwidth usage
- Pose detection optimized for real-time performance

## Future Enhancements

### Planned Features
1. **Advanced gesture recognition** - Recognize different drink types
2. **Drinking speed detection** - Fast vs slow drinking
3. **Custom poses** - Players can define custom gestures
4. **Video recording** - Optional game replay functionality
5. **Face recognition** - Enhanced player identification
6. **Augmented reality effects** - Virtual game elements overlay

### Technical Improvements
1. **STUN/TURN server integration** for better NAT traversal
2. **Adaptive video quality** based on network conditions
3. **Mobile device optimization** - Touch-friendly controls
4. **WebAssembly pose detection** for better performance
5. **Background blur/replacement** for privacy

## API Reference

### WebcamManager Methods

#### `initialize(socket, gameId, playerName)`
Initializes webcam and pose detection systems.

#### `setDrinkingCallback(callback)`
Sets callback function for drinking detection events.

#### `destroy()`
Cleans up all webcam resources and connections.

### Socket Events

#### Client → Server
- `webcam_ready` - Announces webcam availability
- `drinking_state_change` - Reports drinking detection

#### Server → Client
- `player_webcam_ready` - Another player enabled webcam
- `player_drinking_state` - Another player's drinking status changed

## License & Credits

- **MediaPipe**: Google's machine learning framework
- **SimplePeer**: WebRTC library by Feross Aboukhadijeh
- **Socket.IO**: Real-time communication framework

This feature enhances the King's Cup experience by adding visual interaction and automated drink detection, making the game more engaging and eliminating the need for manual drinking confirmations.