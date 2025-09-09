import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Camera, 
  Upload, 
  Search, 
  AlertCircle, 
  CheckCircle,
  X,
  Scan
} from 'lucide-react'

const QRCodeScanner = ({ onScanResult, onError }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [error, setError] = useState('')
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Check for camera availability
  useEffect(() => {
    checkCameraAvailability()
    return () => {
      stopScanning()
    }
  }, [])

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setHasCamera(videoDevices.length > 0)
    } catch (err) {
      console.error('Error checking camera availability:', err)
      setHasCamera(false)
    }
  }

  const startScanning = async () => {
    try {
      setError('')
      setIsScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        
        // Start scanning process
        scanForQRCode()
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.')
      setIsScanning(false)
      if (onError) onError(err)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanForQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // In a real implementation, you would use a QR code detection library here
    // For demo purposes, we'll simulate QR code detection
    setTimeout(() => {
      if (isScanning) {
        // Simulate finding a QR code occasionally
        if (Math.random() < 0.1) { // 10% chance per scan
          const mockQRData = 'https://econetra.com/verify/dpp-12345'
          handleScanResult(mockQRData)
        } else {
          scanForQRCode() // Continue scanning
        }
      }
    }, 500)
  }

  const handleScanResult = (data) => {
    stopScanning()
    if (onScanResult) {
      onScanResult(data)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setError('')

    // In a real implementation, you would process the image to extract QR code
    // For demo purposes, we'll simulate QR code extraction
    const reader = new FileReader()
    reader.onload = (e) => {
      // Simulate QR code detection from image
      setTimeout(() => {
        const mockQRData = 'https://econetra.com/verify/dpp-67890'
        handleScanResult(mockQRData)
      }, 1000)
    }
    reader.readAsDataURL(file)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualInput.trim()) {
      setError('Please enter a DPP ID, URL, or QR code data')
      return
    }

    setError('')
    handleScanResult(manualInput.trim())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Scan className="h-5 w-5 mr-2" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan QR codes to verify Digital Product Passports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Camera Scanner */}
        {hasCamera && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Camera Scanner</h3>
              {isScanning && (
                <Button size="sm" variant="outline" onClick={stopScanning}>
                  <X className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>

            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg border"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                    <span className="text-primary text-sm font-medium">
                      Position QR code here
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={startScanning} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera Scanner
              </Button>
            )}
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Upload QR Code Image</h3>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
          </div>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Manual Entry</h3>
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="manual-input">DPP ID, URL, or QR Code Data</Label>
              <Input
                id="manual-input"
                placeholder="e.g., dpp-12345 or https://econetra.com/verify/..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">How to use:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use camera scanner to scan QR codes directly</li>
            <li>• Upload an image containing a QR code</li>
            <li>• Manually enter DPP ID or verification URL</li>
            <li>• Results will show DPP verification details</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default QRCodeScanner

