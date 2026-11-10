import { useEffect, useRef, useState } from 'react';
import { Camera, X, SwitchCamera, AlertCircle, RefreshCw } from 'lucide-react';
import './CameraModal.css';

export default function CameraModal({ open, onClose, onCapture, onFallback }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashing, setFlashing] = useState(false);

  // Check available cameras
  useEffect(() => {
    if (!open) return;
    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, [open]);

  // Start / restart camera stream
  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported by your browser or connection.');
      setLoading(false);
      return;
    }

    const startStream = async () => {
      stopCamera();
      try {
        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (firstErr) {
          // Fallback if specific facingMode constraint fails on some laptops/desktops
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (active) {
              videoRef.current?.play().catch(() => {});
              setLoading(false);
            }
          };
        }
      } catch (err) {
        if (!active) return;
        setLoading(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission was blocked. Please grant camera permission in your browser address bar.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera was detected on this device.');
        } else {
          setError(err.message || 'Unable to access camera.');
        }
      }
    };

    startStream();

    return () => {
      active = false;
      stopCamera();
    };
  }, [open, facingMode]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    setFlashing(true);
    setTimeout(() => setFlashing(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Mirror user/front camera frame for natural appearance
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.92);
  };

  if (!open) return null;

  return (
    <div className="camera-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Camera">
      <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="camera-modal-header">
          <div className="camera-modal-title">
            <Camera size={18} />
            <span>Take Photo</span>
          </div>
          <button type="button" className="camera-modal-close" onClick={onClose} aria-label="Close camera">
            <X size={20} />
          </button>
        </div>

        <div className="camera-viewport">
          {flashing && <div className="camera-flash" />}

          {loading && (
            <div className="camera-status">
              <RefreshCw size={24} className="camera-spin" />
              <span>Starting camera…</span>
            </div>
          )}

          {error ? (
            <div className="camera-error">
              <AlertCircle size={32} />
              <p>{error}</p>
              {onFallback && (
                <button
                  type="button"
                  className="camera-fallback-btn"
                  onClick={() => {
                    onClose();
                    onFallback();
                  }}
                >
                  Choose from files instead
                </button>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`camera-video ${facingMode === 'user' ? 'camera-video--mirrored' : ''}`}
              />
              <div className="camera-crosshairs">
                <div className="camera-corner camera-corner--tl" />
                <div className="camera-corner camera-corner--tr" />
                <div className="camera-corner camera-corner--bl" />
                <div className="camera-corner camera-corner--br" />
              </div>
            </>
          )}
        </div>

        <div className="camera-modal-footer">
          {hasMultipleCameras && (
            <button
              type="button"
              className="camera-action-btn camera-action-btn--secondary"
              onClick={toggleCamera}
              title="Flip camera"
              aria-label="Flip camera"
              disabled={loading || !!error}
            >
              <SwitchCamera size={22} />
            </button>
          )}

          <button
            type="button"
            className="camera-shutter-btn"
            onClick={handleCapture}
            disabled={loading || !!error}
            aria-label="Capture photo"
          >
            <div className="camera-shutter-inner" />
          </button>

          {onFallback && (
            <button
              type="button"
              className="camera-action-btn camera-action-btn--secondary"
              onClick={() => {
                onClose();
                onFallback();
              }}
              title="Upload file instead"
              aria-label="Upload file instead"
            >
              <span className="camera-upload-text">Files</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

