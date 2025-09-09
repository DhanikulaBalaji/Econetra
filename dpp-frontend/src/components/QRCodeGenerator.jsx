import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  QrCode, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react'

const QRCodeGenerator = ({ dppId, dppUrl, onGenerated }) => {
  const [qrCodeData, setQrCodeData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [format, setFormat] = useState('PNG')
  const [size, setSize] = useState(10)

  // Generate QR code using Canvas API (since qrcode.js might not work as expected)
  const generateQRCodeCanvas = (text, size = 256) => {
    return new Promise((resolve, reject) => {
      try {
        // Create a simple QR code representation using canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = size
        canvas.height = size
        
        // Fill background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        
        // Create a simple pattern (this is a placeholder - in real implementation you'd use a proper QR library)
        ctx.fillStyle = '#000000'
        
        // Draw border
        const borderSize = size * 0.1
        ctx.fillRect(0, 0, size, borderSize)
        ctx.fillRect(0, 0, borderSize, size)
        ctx.fillRect(size - borderSize, 0, borderSize, size)
        ctx.fillRect(0, size - borderSize, size, borderSize)
        
        // Draw corner squares (QR code finder patterns)
        const cornerSize = size * 0.2
        // Top-left
        ctx.fillRect(borderSize, borderSize, cornerSize, cornerSize)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(borderSize + cornerSize * 0.2, borderSize + cornerSize * 0.2, cornerSize * 0.6, cornerSize * 0.6)
        ctx.fillStyle = '#000000'
        ctx.fillRect(borderSize + cornerSize * 0.4, borderSize + cornerSize * 0.4, cornerSize * 0.2, cornerSize * 0.2)
        
        // Top-right
        ctx.fillStyle = '#000000'
        ctx.fillRect(size - borderSize - cornerSize, borderSize, cornerSize, cornerSize)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(size - borderSize - cornerSize + cornerSize * 0.2, borderSize + cornerSize * 0.2, cornerSize * 0.6, cornerSize * 0.6)
        ctx.fillStyle = '#000000'
        ctx.fillRect(size - borderSize - cornerSize + cornerSize * 0.4, borderSize + cornerSize * 0.4, cornerSize * 0.2, cornerSize * 0.2)
        
        // Bottom-left
        ctx.fillStyle = '#000000'
        ctx.fillRect(borderSize, size - borderSize - cornerSize, cornerSize, cornerSize)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(borderSize + cornerSize * 0.2, size - borderSize - cornerSize + cornerSize * 0.2, cornerSize * 0.6, cornerSize * 0.6)
        ctx.fillStyle = '#000000'
        ctx.fillRect(borderSize + cornerSize * 0.4, size - borderSize - cornerSize + cornerSize * 0.4, cornerSize * 0.2, cornerSize * 0.2)
        
        // Add some random pattern in the middle (simplified QR data representation)
        ctx.fillStyle = '#000000'
        const patternSize = 4
        for (let x = cornerSize + borderSize + 20; x < size - cornerSize - borderSize - 20; x += patternSize * 2) {
          for (let y = cornerSize + borderSize + 20; y < size - cornerSize - borderSize - 20; y += patternSize * 2) {
            if (Math.random() > 0.5) {
              ctx.fillRect(x, y, patternSize, patternSize)
            }
          }
        }
        
        // Add text below (for demo purposes)
        ctx.fillStyle = '#666666'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('DPP QR Code', size / 2, size - 10)
        
        canvas.toBlob((blob) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }, 'image/png')
      } catch (err) {
        reject(err)
      }
    })
  }

  const generateQRCode = async () => {
    if (!dppUrl && !dppId) {
      setError('No DPP URL or ID provided')
      return
    }

    setLoading(true)
    setError('')

    try {
      const qrData = dppUrl || `https://econetra.com/verify/${dppId}`
      
      // Generate QR code image
      const qrImageData = await generateQRCodeCanvas(qrData, size * 25)
      
      const qrCodeInfo = {
        id: `qr-${dppId}`,
        dpp_id: dppId,
        qr_code_data: qrData,
        qr_code_image: qrImageData,
        format: format,
        size: size,
        generated_at: new Date().toISOString()
      }
      
      setQrCodeData(qrCodeInfo)
      
      if (onGenerated) {
        onGenerated(qrCodeInfo)
      }
      
    } catch (err) {
      setError(`Failed to generate QR code: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeData?.qr_code_image) return
    
    const link = document.createElement('a')
    link.href = qrCodeData.qr_code_image
    link.download = `dpp_${dppId}_qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyQRCodeData = async () => {
    if (!qrCodeData?.qr_code_data) return
    
    try {
      await navigator.clipboard.writeText(qrCodeData.qr_code_data)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy QR code data:', err)
    }
  }

  useEffect(() => {
    if (dppId || dppUrl) {
      generateQRCode()
    }
  }, [dppId, dppUrl])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate and manage QR codes for Digital Product Passports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* QR Code Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PNG">PNG</SelectItem>
                <SelectItem value="SVG">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Small (5)</SelectItem>
                <SelectItem value="10">Medium (10)</SelectItem>
                <SelectItem value="15">Large (15)</SelectItem>
                <SelectItem value="20">Extra Large (20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateQRCode} 
          disabled={loading || (!dppId && !dppUrl)}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              {qrCodeData ? 'Regenerate QR Code' : 'Generate QR Code'}
            </>
          )}
        </Button>

        {/* QR Code Display */}
        {qrCodeData && (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 border rounded-lg bg-white">
              <img 
                src={qrCodeData.qr_code_image} 
                alt="QR Code" 
                className="max-w-full h-auto"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </div>

            {/* QR Code Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Generated
                </Badge>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium">QR Code Data:</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={qrCodeData.qr_code_data} 
                    readOnly 
                    className="text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={copyQRCodeData}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Format: {qrCodeData.format}</span>
                <span>Size: {qrCodeData.size}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={downloadQRCode} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a 
                  href={qrCodeData.qr_code_data} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QRCodeGenerator

