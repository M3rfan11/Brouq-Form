const API_BASE_URL = window.location.origin;
let html5QrcodeScanner = null;

// Check authentication
async function checkAuth() {
    try {
        // Get token from localStorage as backup
        const token = localStorage.getItem('authToken');
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
            credentials: 'include',
            headers: headers
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            // Clear invalid token
            localStorage.removeItem('authToken');
            window.location.href = `login.html?redirect=${encodeURIComponent('scanner.html')}`;
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('authToken');
        window.location.href = `login.html?redirect=${encodeURIComponent('scanner.html')}`;
        return false;
    }
}

// Logout function
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = 'login.html';
    }
}

// Initialize scanner with timeout
async function initScanner() {
    const readerDiv = document.getElementById('reader');
    const cameraErrorDiv = document.getElementById('cameraError');
    const scannerControls = document.querySelector('.scanner-controls');
    const loadingMessage = document.getElementById('loadingMessage');
    const scannerOverlay = document.getElementById('scannerOverlay');
    
    // Clear any existing content
    readerDiv.innerHTML = '';
    
    // Show loading, hide error, but keep reader visible (it needs to be visible for camera to work)
    loadingMessage.style.display = 'block';
    cameraErrorDiv.style.display = 'none';
    readerDiv.style.display = 'block';
    readerDiv.style.visibility = 'visible';
    readerDiv.style.opacity = '1';
    scannerOverlay.style.display = 'none';
    updateStatus('Requesting camera access...');
    
    // Set a timeout - if camera doesn't start in 15 seconds, show error
    const timeoutId = setTimeout(() => {
        if (loadingMessage.style.display !== 'none') {
            console.error('Camera initialization timeout');
            loadingMessage.style.display = 'none';
            showCameraError('Camera access timed out. Please try:\n\n• Refreshing the page\n• Allowing camera permissions\n• Using Manual Entry instead');
        }
    }, 15000); // 15 second timeout
    
    // Prevent multiple simultaneous initializations
    if (window.scannerInitializing) {
        console.log('Scanner already initializing, skipping...');
        return;
    }
    window.scannerInitializing = true;
    
    try {
        // Stop any existing scanner
        if (html5QrcodeScanner) {
            try {
                await html5QrcodeScanner.stop().catch(() => {});
                html5QrcodeScanner.clear();
                html5QrcodeScanner = null; // Clear reference
            } catch (e) {
                console.log('Error stopping previous scanner:', e);
            }
        }
        
        // Create new scanner instance
        html5QrcodeScanner = new Html5Qrcode("reader");
        
        updateStatus('Detecting cameras...');
        
        // Try to get cameras first
        let cameraConfig = { facingMode: "environment" };
        
        try {
            const devices = await Html5Qrcode.getCameras();
            console.log('Available cameras:', devices);
            
            if (devices && devices.length > 0) {
                // Prefer back camera (environment), fallback to first available
                let cameraId = null;
                for (let device of devices) {
                    const label = (device.label || '').toLowerCase();
                    if (label.includes('back') || 
                        label.includes('rear') ||
                        label.includes('environment') ||
                        device.id.includes('back')) {
                        cameraId = device.id;
                        break;
                    }
                }
                
                // If no back camera found, use first available
                if (!cameraId && devices.length > 0) {
                    cameraId = devices[0].id;
                }
                
                if (cameraId) {
                    cameraConfig = cameraId;
                    console.log('Using camera:', cameraId);
                }
            }
        } catch (camError) {
            console.log('Could not enumerate cameras, using default:', camError);
            // Continue with default facingMode
        }
        
        updateStatus('Starting camera...');
        
        // Calculate QR box size - make it larger for better scanning
        const isMobile = window.innerWidth < 768;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - 200; // Account for header/controls
        const qrboxSize = isMobile ? Math.min(viewportWidth * 0.85, 320) : 300;
        
        // Start the scanner with optimized config for better scanning
        const config = {
            fps: 30, // Higher FPS for better scanning
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                // Use larger scanning area - 70% of viewfinder
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.min(minEdge * 0.7, qrboxSize);
                console.log('QR box size calculated:', size, 'from viewfinder:', viewfinderWidth, 'x', viewfinderHeight);
                return { width: size, height: size };
            },
            aspectRatio: 1.0,
            disableFlip: true, // Disable flip to prevent camera inversion
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        console.log('Starting camera with config:', config, 'cameraConfig:', cameraConfig);
        
        // Start the camera
        console.log('Calling html5QrcodeScanner.start()...');
        
        try {
            await html5QrcodeScanner.start(
                cameraConfig,
                config,
                (decodedText, decodedResult) => {
                    console.log('✅ QR Code detected:', decodedText);
                    onScanSuccess(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Only log errors occasionally to avoid spam
                    // console.log('Scan error:', errorMessage);
                },
                (errorMessage) => {
                    // Log only significant errors
                    if (errorMessage && !errorMessage.includes('NotFoundException')) {
                        console.error('QR Code scan error:', errorMessage);
                    }
                }
            );
            console.log('✅ html5QrcodeScanner.start() completed');
        } catch (startError) {
            console.error('❌ Error in html5QrcodeScanner.start():', startError);
            throw startError;
        }
        
        // Clear timeout on success
        clearTimeout(timeoutId);
        
        console.log('Camera start() completed');
        loadingMessage.style.display = 'none';
        
        // Wait for video to be created - check more aggressively
        console.log('Waiting for video element...');
        let videoFound = false;
        let attempts = 0;
        const maxAttempts = 20;
        let videoStyled = false; // Flag to prevent repeated styling
        let checkInterval = null; // Store interval reference
        
        const findAndStyleVideo = () => {
            if (videoStyled) {
                // Already styled, stop checking
                if (checkInterval) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                }
                return false; // Already styled, don't do it again
            }
            // Try every possible way to find the video
            const allVideos = document.querySelectorAll('video');
            console.log(`Found ${allVideos.length} video elements in document`);
            
            let videoElement = null;
            
            // Try reader div first
            videoElement = readerDiv.querySelector('video');
            if (!videoElement) {
                // Try by ID
                videoElement = document.querySelector('#reader video');
            }
            if (!videoElement) {
                // Try any video in reader's children
                const readerChildren = readerDiv.children;
                for (let child of readerChildren) {
                    videoElement = child.querySelector('video') || child.getElementsByTagName('video')[0];
                    if (videoElement) break;
                }
            }
            if (!videoElement && allVideos.length > 0) {
                // Use first video found (might be the one)
                videoElement = allVideos[0];
                console.log('Using first video found in document');
            }
            
            if (videoElement) {
                console.log('✅ Video element found!', videoElement);
                videoFound = true;
                
                // CRITICAL FIX: Height is 0px - need to set explicit height
                // Calculate dimensions once and lock them
                const containerHeight = Math.max(readerDiv.offsetHeight || window.innerHeight - 200, 400);
                const containerWidth = readerDiv.offsetWidth || window.innerWidth;
                
                console.log('Container dimensions:', containerWidth, 'x', containerHeight);
                
                // Lock container dimensions to prevent resizing
                readerDiv.style.height = containerHeight + 'px';
                readerDiv.style.minHeight = containerHeight + 'px';
                readerDiv.style.maxHeight = containerHeight + 'px';
                readerDiv.style.width = containerWidth + 'px';
                readerDiv.style.position = 'absolute';
                readerDiv.style.top = '0';
                readerDiv.style.left = '0';
                
                // Set video dimensions ONCE and lock them - prevent any resizing or flipping
                const videoStyle = `
                    width: ${containerWidth}px !important;
                    height: ${containerHeight}px !important;
                    min-height: ${containerHeight}px !important;
                    max-height: ${containerHeight}px !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    z-index: 1 !important;
                    object-fit: cover !important;
                    background: #000 !important;
                    transform: none !important;
                    -webkit-transform: none !important;
                    transition: none !important;
                    will-change: auto !important;
                    backface-visibility: hidden !important;
                    -webkit-backface-visibility: hidden !important;
                    transform-style: flat !important;
                `;
                
                // Set styles once and prevent changes
                videoElement.style.cssText = videoStyle;
                
                // Lock individual properties
                videoElement.style.width = containerWidth + 'px';
                videoElement.style.height = containerHeight + 'px';
                videoElement.style.minHeight = containerHeight + 'px';
                videoElement.style.maxHeight = containerHeight + 'px';
                videoElement.style.display = 'block';
                videoElement.style.visibility = 'visible';
                videoElement.style.opacity = '1';
                videoElement.style.position = 'fixed'; // Use fixed to prevent layout shifts
                videoElement.style.top = '0';
                videoElement.style.left = '0';
                videoElement.style.zIndex = '1';
                videoElement.style.objectFit = 'cover';
                videoElement.style.backgroundColor = '#000';
                videoElement.style.transform = 'none';
                videoElement.style.webkitTransform = 'none';
                videoElement.style.transition = 'none';
                videoElement.style.willChange = 'auto';
                videoElement.style.backfaceVisibility = 'hidden';
                videoElement.style.webkitBackfaceVisibility = 'hidden';
                videoElement.style.transformStyle = 'flat';
                
                // Prevent video from being flipped/mirrored
                videoElement.style.scale = '1';
                videoElement.style.rotate = '0deg';
                
                // Remove any attributes that might cause resizing
                videoElement.removeAttribute('height');
                videoElement.removeAttribute('width');
                
                // Prevent any future style changes by the library
                if (videoElement.style.setProperty) {
                    Object.defineProperty(videoElement.style, 'setProperty', {
                        value: function(prop, value) {
                            // Allow only certain properties to change
                            if (prop === 'opacity' || prop === 'visibility') {
                                return CSSStyleDeclaration.prototype.setProperty.call(this, prop, value);
                            }
                            // Block width/height changes
                            if (prop === 'width' || prop === 'height') {
                                return; // Ignore
                            }
                            return CSSStyleDeclaration.prototype.setProperty.call(this, prop, value);
                        }
                    });
                }
                
                // Remove any classes that might hide it
                videoElement.classList.remove('hidden', 'd-none');
                videoElement.removeAttribute('hidden');
                
                // Lock video attributes to prevent changes
                Object.defineProperty(videoElement, 'style', {
                    value: videoElement.style,
                    writable: false,
                    configurable: false
                });
                
                // Prevent any CSS class changes that might cause flipping
                const originalAddClass = videoElement.classList.add;
                videoElement.classList.add = function(...args) {
                    // Block classes that might cause issues
                    const blockedClasses = ['flip', 'mirror', 'rotate', 'transform'];
                    const filtered = args.filter(cls => !blockedClasses.some(b => cls.includes(b)));
                    if (filtered.length > 0) {
                        return originalAddClass.apply(this, filtered);
                    }
                };
                
                // Force play and lock
                videoElement.play().then(() => {
                    console.log('✅ Video playing');
                    // Lock video stream
                    if (videoElement.srcObject) {
                        const tracks = videoElement.srcObject.getVideoTracks();
                        tracks.forEach(track => {
                            // Lock camera settings
                            track.applyConstraints({
                                advanced: [{ facingMode: 'environment' }]
                            }).catch(() => {});
                        });
                    }
                }).catch(err => {
                    console.log('Video play error:', err);
                    setTimeout(() => {
                        videoElement.play().catch(e => console.log('Retry play error:', e));
                    }, 500);
                });
                
                // Find and style the scanning canvas (where QR detection happens)
                const canvasElement = readerDiv.querySelector('canvas');
                if (canvasElement) {
                    console.log('✅ Canvas found for scanning');
                    canvasElement.style.position = 'absolute';
                    canvasElement.style.top = '0';
                    canvasElement.style.left = '0';
                    canvasElement.style.zIndex = '2';
                    canvasElement.style.pointerEvents = 'none'; // Don't block touches
                    canvasElement.style.width = containerWidth + 'px';
                    canvasElement.style.height = containerHeight + 'px';
                }
                
                // Monitor video - but prevent any changes
                videoElement.addEventListener('loadedmetadata', () => {
                    console.log('✅ Video metadata loaded:', videoElement.videoWidth, 'x', videoElement.videoHeight);
                    // Re-apply locked styles after metadata loads
                    if (!videoStyled) {
                        videoElement.style.width = containerWidth + 'px';
                        videoElement.style.height = containerHeight + 'px';
                        videoElement.style.transform = 'none';
                    }
                }, { once: true });
                
                videoElement.addEventListener('playing', () => {
                    console.log('✅ Video is playing');
                }, { once: true });
                
                // Mark as styled to prevent re-styling (prevents vibration)
                videoStyled = true;
                videoElement.dataset.styled = 'true';
                
                return true;
            }
            return false;
        };
        
        // Check immediately and then periodically
        if (findAndStyleVideo()) {
            videoFound = true;
            videoStyled = true; // Mark as styled
        } else {
            checkInterval = setInterval(() => {
                attempts++;
                if (videoStyled) {
                    // Already styled, stop immediately
                    clearInterval(checkInterval);
                    checkInterval = null;
                    return;
                }
                
                if (findAndStyleVideo()) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                    videoFound = true;
                    videoStyled = true; // Mark as styled
                    return;
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    checkInterval = null;
                    console.error('❌ Video element never found after', maxAttempts, 'attempts');
                    console.log('Reader div HTML:', readerDiv.innerHTML.substring(0, 1000));
                    const allVideos = document.querySelectorAll('video');
                    console.log('All videos in document:', Array.from(allVideos).map(v => ({
                        id: v.id,
                        className: v.className,
                        parent: v.parentElement?.tagName
                    })));
                    updateStatus('Video not found - Check console');
                    
                    const manualEntry = document.getElementById('manualEntry');
                    if (manualEntry) {
                        manualEntry.style.display = 'block';
                    }
                }
            }, 200);
        }
        
        scannerOverlay.style.display = 'flex';
        cameraErrorDiv.style.display = 'none';
        scannerControls.style.display = 'flex';
        updateStatus('Camera ready - Point at QR code');
        
        // Mark initialization as complete
        window.scannerInitializing = false;
        
    } catch (error) {
        // Mark initialization as complete even on error
        window.scannerInitializing = false;
        // Clear timeout
        clearTimeout(timeoutId);
        
        loadingMessage.style.display = 'none';
        console.error('Error initializing camera:', error);
        
        let errorMessage = 'Camera access failed. ';
        
        // Provide specific error messages
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
            errorMessage += 'Please allow camera permissions in your browser settings.';
        } else if (error.name === 'NotFoundError' || error.message.includes('camera')) {
            errorMessage += 'No camera found on this device.';
        } else if (error.message.includes('HTTPS') || error.message.includes('secure')) {
            errorMessage += 'Camera requires HTTPS. Try accessing via https:// or use localhost.';
        } else {
            errorMessage += error.message || 'Unknown error occurred.';
        }
        
        showCameraError(errorMessage);
    }
}

// Show camera error helper
function showCameraError(message) {
    const readerDiv = document.getElementById('reader');
    const cameraErrorDiv = document.getElementById('cameraError');
    const scannerOverlay = document.getElementById('scannerOverlay');
    
    readerDiv.style.display = 'none';
    scannerOverlay.style.display = 'none';
    
    cameraErrorDiv.innerHTML = `
        <p><strong>Camera Not Available</strong></p>
        <p id="errorMessage" style="white-space: pre-line;">${message}</p>
        <div class="camera-help">
            <p><strong>Solution: Use Manual Entry</strong></p>
            <p>You can still verify QR codes by typing them manually:</p>
            <ol style="text-align: left; margin: 10px 0;">
                <li>Click "📝 Manual Entry" button below</li>
                <li>Copy the QR code from the email</li>
                <li>Paste and click "Verify QR Code"</li>
            </ol>
        </div>
        <button id="retryCameraBtn" class="retry-btn">Retry Camera</button>
        <button id="useManualBtn" class="retry-btn" style="background: #667eea; margin-top: 10px;">Use Manual Entry Now</button>
    `;
    cameraErrorDiv.style.display = 'block';
    updateStatus('Camera unavailable - Use Manual Entry');
}

// Handle successful scan
function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning
    html5QrcodeScanner.stop().then(() => {
        verifyQRCode(decodedText);
    }).catch(err => {
        console.error('Error stopping scanner:', err);
        verifyQRCode(decodedText);
    });
}

// Handle scan errors
function onScanError(errorMessage) {
    // Ignore continuous errors, only log if needed
    // console.log('Scan error:', errorMessage);
}

// Play success sound
function playSuccessSound() {
    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Higher pitch for success
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Fallback: just vibrate if audio fails
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    }
}

// Verify QR code
async function verifyQRCode(qrCode) {
    const resultDiv = document.getElementById('result');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const resultDetails = document.getElementById('resultDetails');
    
    // Show loading state
    resultDiv.style.display = 'block';
    resultIcon.textContent = '⏳';
    resultIcon.className = 'result-icon';
    resultTitle.textContent = 'Verifying...';
    resultMessage.textContent = 'Please wait while we verify the QR code.';
    resultDetails.innerHTML = '';

    try {
        // Extract UUID from QR code - it might be JSON or just UUID
        let qrCodeToVerify = qrCode.trim();
        
        // Try to parse as JSON first (QR code contains JSON with id field)
        try {
            const qrData = JSON.parse(qrCodeToVerify);
            if (qrData.id) {
                qrCodeToVerify = qrData.id;
                console.log('Extracted UUID from JSON:', qrCodeToVerify);
            }
        } catch (e) {
            // Not JSON, assume it's already a UUID
            console.log('QR code is not JSON, using as-is:', qrCodeToVerify);
        }
        
        console.log('Verifying QR code:', qrCodeToVerify);
        
        const response = await fetch(`${API_BASE_URL}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ qr_code: qrCodeToVerify })
        });

        // Handle authentication errors
        if (response.status === 401) {
            window.location.href = `login.html?redirect=${encodeURIComponent('scanner.html')}`;
            return;
        }

        const data = await response.json();

        if (data.expired) {
            // Expired QR code - play error sound
            if (navigator.vibrate) {
                navigator.vibrate([300, 100, 300]); // Long pattern for error
            }
            
            resultIcon.textContent = '⏰';
            resultIcon.className = 'result-icon error';
            resultTitle.textContent = 'QR Code Expired';
            resultMessage.textContent = data.message || 'This QR code has expired and cannot be used.';
            resultDetails.innerHTML = `
                <p><strong>Name:</strong> ${data.attendee.name}</p>
                <p><strong>Email:</strong> ${data.attendee.email}</p>
                ${data.attendee.expires_at ? `<p><strong>Expired On:</strong> ${new Date(data.attendee.expires_at).toLocaleString()}</p>` : ''}
            `;
            
            // Auto-resume after 4 seconds for expired codes
            setTimeout(() => {
                document.getElementById('result').style.display = 'none';
                document.getElementById('reader').style.display = 'block';
                initScanner();
            }, 4000);
        } else if (data.valid && !data.used) {
            // Valid and unused - success
            // Play success sound and vibrate (if supported)
            playSuccessSound();
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]); // Vibrate pattern
            }
            
            resultIcon.textContent = '✅';
            resultIcon.className = 'result-icon success';
            resultTitle.textContent = 'QR Code Verified!';
            resultMessage.textContent = data.message || 'Attendance confirmed successfully.';
            resultDetails.innerHTML = `
                <p><strong>Name:</strong> ${data.attendee.name}</p>
                <p><strong>Email:</strong> ${data.attendee.email}</p>
                ${data.attendee.phone ? `<p><strong>Phone:</strong> ${data.attendee.phone}</p>` : ''}
            `;
            
            // Auto-resume scanning after 3 seconds for door scanning
            setTimeout(() => {
                document.getElementById('result').style.display = 'none';
                document.getElementById('reader').style.display = 'block';
                initScanner();
            }, 3000);
        } else if (data.used) {
            // Already used - play warning sound
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]); // Different pattern for warning
            }
            
            resultIcon.textContent = '⚠️';
            resultIcon.className = 'result-icon warning';
            resultTitle.textContent = 'QR Code Already Used';
            resultMessage.textContent = data.message || 'This QR code has already been used.';
            resultDetails.innerHTML = `
                <p><strong>Name:</strong> ${data.attendee.name}</p>
                <p><strong>Email:</strong> ${data.attendee.email}</p>
                ${data.attendee.used_at ? `<p><strong>Used At:</strong> ${new Date(data.attendee.used_at).toLocaleString()}</p>` : ''}
            `;
            
            // Auto-resume after 4 seconds for used codes
            setTimeout(() => {
                document.getElementById('result').style.display = 'none';
                document.getElementById('reader').style.display = 'block';
                initScanner();
            }, 4000);
        } else {
            // Invalid QR code - play error sound
            if (navigator.vibrate) {
                navigator.vibrate(300); // Long vibration for error
            }
            
            resultIcon.textContent = '❌';
            resultIcon.className = 'result-icon error';
            resultTitle.textContent = 'Invalid QR Code';
            resultMessage.textContent = data.message || 'This QR code is not valid.';
            resultDetails.innerHTML = '';
            
            // Auto-resume after 3 seconds for invalid codes
            setTimeout(() => {
                document.getElementById('result').style.display = 'none';
                document.getElementById('reader').style.display = 'block';
                initScanner();
            }, 3000);
        }
    } catch (error) {
        console.error('Error:', error);
        resultIcon.textContent = '❌';
        resultIcon.className = 'result-icon error';
        resultTitle.textContent = 'Error';
        resultMessage.textContent = 'Failed to verify QR code. Please try again.';
        resultDetails.innerHTML = '';
    }
}

// Manual QR code entry
document.getElementById('verifyBtn').addEventListener('click', () => {
    const qrCode = document.getElementById('manualQR').value.trim();
    if (qrCode) {
        verifyQRCode(qrCode);
    } else {
        alert('Please enter a QR code');
    }
});

// Scan again button
document.getElementById('scanAgainBtn').addEventListener('click', () => {
    document.getElementById('result').style.display = 'none';
    document.getElementById('manualQR').value = '';
    document.getElementById('manualEntry').style.display = 'none';
    document.getElementById('reader').style.display = 'block';
    
    // Reset flags to allow re-initialization
    window.scannerInitializing = false;
    
    // Small delay to ensure cleanup
    setTimeout(() => {
        initScanner();
    }, 300);
});

// Toggle manual entry
document.getElementById('toggleManualBtn').addEventListener('click', () => {
    const manualEntry = document.getElementById('manualEntry');
    const reader = document.getElementById('reader');
    const scannerContainer = document.querySelector('.scanner-container-mobile');
    const startCameraBtn = document.getElementById('startCameraBtn');
    
    if (manualEntry.style.display === 'none') {
        // Show manual entry, stop scanner
        manualEntry.style.display = 'block';
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().catch(err => console.error('Error stopping scanner:', err));
        }
        reader.style.display = 'none';
        if (scannerContainer) {
            scannerContainer.style.display = 'none';
        }
        document.getElementById('toggleManualBtn').textContent = '📷 Use Camera';
        startCameraBtn.style.display = 'inline-block';
    } else {
        // Show scanner, hide manual entry
        manualEntry.style.display = 'none';
        reader.style.display = 'block';
        if (scannerContainer) {
            scannerContainer.style.display = 'flex';
        }
        startCameraBtn.style.display = 'none';
        document.getElementById('toggleManualBtn').textContent = '📝 Manual Entry';
        initScanner();
    }
});

// Retry camera button
document.getElementById('retryCameraBtn').addEventListener('click', () => {
    document.getElementById('reader').style.display = 'block';
    initScanner();
});

// Use manual entry button
document.getElementById('useManualBtn').addEventListener('click', () => {
    const scannerContainer = document.querySelector('.scanner-container-mobile');
    document.getElementById('cameraError').style.display = 'none';
    document.getElementById('manualEntry').style.display = 'block';
    document.getElementById('reader').style.display = 'none';
    if (scannerContainer) {
        scannerContainer.style.display = 'none';
    }
    document.getElementById('toggleManualBtn').textContent = '📷 Use Camera';
    document.getElementById('startCameraBtn').style.display = 'inline-block';
});

// Start camera button (shown when camera is off)
const startCameraBtn = document.getElementById('startCameraBtn');
startCameraBtn.addEventListener('click', () => {
    const scannerContainer = document.querySelector('.scanner-container-mobile');
    document.getElementById('manualEntry').style.display = 'none';
    document.getElementById('reader').style.display = 'block';
    if (scannerContainer) {
        scannerContainer.style.display = 'flex';
    }
    startCameraBtn.style.display = 'none';
    document.getElementById('toggleManualBtn').textContent = '📝 Manual Entry';
    initScanner();
});

// Enter key for manual input
document.getElementById('manualQR').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('verifyBtn').click();
    }
});

// Update status message
function updateStatus(message) {
    const statusDiv = document.getElementById('statusMessage');
    if (statusDiv) {
        statusDiv.textContent = message;
    }
    console.log('Status:', message);
}

// Initialize scanner when page loads
window.addEventListener('load', async () => {
    try {
        updateStatus('Loading...');
        console.log('Page loaded, checking authentication...');
        
        const isAuthenticated = await checkAuth();
        console.log('Authentication status:', isAuthenticated);
        
        if (isAuthenticated) {
            updateStatus('Authenticated. Testing camera...');
            
            // Add logout button listener
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
            
            // Don't show manual entry by default - try camera first
            const manualEntry = document.getElementById('manualEntry');
            if (manualEntry) {
                manualEntry.style.display = 'none';
            }
            
            // Test basic camera access first
            console.log('Testing basic camera access...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                console.log('✅ Camera access granted');
                stream.getTracks().forEach(track => track.stop()); // Stop test
                
                // Initialize scanner
                updateStatus('Initializing scanner...');
                setTimeout(() => {
                    initScanner().catch(err => {
                        console.error('❌ Scanner initialization failed:', err);
                        updateStatus('Scanner error - Use Manual Entry');
                        if (manualEntry) {
                            manualEntry.style.display = 'block';
                        }
                    });
                }, 300);
            } catch (camError) {
                console.error('❌ Camera access denied:', camError);
                updateStatus('Camera access denied - Allow permissions or use Manual Entry');
                if (manualEntry) {
                    manualEntry.style.display = 'block';
                }
            }
        } else {
            updateStatus('Not authenticated. Redirecting...');
        }
    } catch (error) {
        console.error('Error during page initialization:', error);
        updateStatus('Error: ' + error.message);
        
        const cameraError = document.getElementById('cameraError');
        if (cameraError) {
            cameraError.style.display = 'block';
            cameraError.innerHTML = `
                <p><strong>Error Loading Page</strong></p>
                <p>${error.message}</p>
                <p>You can still use manual entry below.</p>
                <button id="retryCameraBtn" class="retry-btn">Retry</button>
            `;
        }
        
        // Make sure manual entry is available
        const manualEntry = document.getElementById('manualEntry');
        if (manualEntry) {
            manualEntry.style.display = 'block';
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
});
