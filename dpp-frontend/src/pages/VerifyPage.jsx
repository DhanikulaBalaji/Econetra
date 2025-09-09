import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  QrCode, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Globe, 
  Calendar,
  MapPin,
  Leaf,
  Shield,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react'

const VerifyPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [error, setError] = useState('')

  // Mock verification data
  const mockDPPData = {
    dpp_id: 'dpp-12345',
    product_name: 'Organic Cotton T-Shirt',
    product_description: 'Premium organic cotton t-shirt made in Tiruppur, India',
    material_composition: {
      'Organic Cotton': '95%',
      'Elastane': '5%'
    },
    production_location: 'Tiruppur, Tamil Nadu, India',
    production_date: '2025-01-15',
    blockchain_hash: '0x1234567890abcdef...',
    ipfs_cid: 'QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
    ipfs_gateway_url: 'https://ipfs.io/ipfs/QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
    issued_at: '2025-01-15T10:30:00Z',
    verification_status: {
      overall_valid: true,
      database_check: true,
      ipfs_check: true,
      blockchain_check: true,
      data_integrity: true
    },
    compliance_info: {
      eu_regulations: ['ESPR', 'DPP Delegated Act'],
      standards: ['JSON-LD', 'GS1 Digital Link', 'EPCIS 2.0'],
      blockchain_network: 'Polygon'
    },
    json_ld_data: {
      '@context': 'https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/',
      '@type': 'DigitalProductPassport',
      'dpp:sustainability': {
        'dpp:carbonFootprint': {
          'schema:value': '2.5',
          'schema:unitCode': 'KGM'
        },
        'dpp:recyclability': 'Fully recyclable',
        'dpp:waterUsage': {
          'schema:value': '15',
          'schema:unitCode': 'LTR'
        }
      }
    }
  }

  const handleVerify = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a DPP ID, QR code, or IPFS CID')
      return
    }

    setLoading(true)
    setError('')
    setVerificationResult(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful verification
      setVerificationResult(mockDPPData)
    } catch (err) {
      setError('Failed to verify DPP. Please check your input and try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Verify Digital Product Passport</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enter a DPP ID, scan a QR code, or provide an IPFS CID to verify the authenticity 
          and compliance of a Digital Product Passport.
        </p>
      </div>

      {/* Search Form */}
      <Card className="max-w-2xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Verification Search
          </CardTitle>
          <CardDescription>
            Enter any of the following: DPP ID, QR code data, or IPFS CID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">DPP Identifier</Label>
              <div className="flex space-x-2">
                <Input
                  id="search"
                  placeholder="e.g., dpp-12345 or QmX1Y2Z3..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button onClick={handleVerify} disabled={loading}>
                  {loading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verificationResult && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {verificationResult.verification_status.database_check ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground">Record Found</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {verificationResult.verification_status.ipfs_check ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium">IPFS</p>
                  <p className="text-xs text-muted-foreground">Data Available</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {verificationResult.verification_status.blockchain_check ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium">Blockchain</p>
                  <p className="text-xs text-muted-foreground">Hash Verified</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {verificationResult.verification_status.data_integrity ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium">Integrity</p>
                  <p className="text-xs text-muted-foreground">Data Intact</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-center">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified & Compliant
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{verificationResult.product_name}</h3>
                <p className="text-muted-foreground">{verificationResult.product_description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Production Location:</span>
                  </div>
                  <p className="text-sm ml-6">{verificationResult.production_location}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Production Date:</span>
                  </div>
                  <p className="text-sm ml-6">{formatDate(verificationResult.production_date)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Material Composition</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(verificationResult.material_composition).map(([material, percentage]) => (
                    <Badge key={material} variant="outline">
                      {material}: {percentage}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sustainability Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="h-5 w-5 mr-2" />
                Sustainability Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">2.5 kg</div>
                  <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">15 L</div>
                  <p className="text-sm text-muted-foreground">Water Usage</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-bold text-green-600">Fully Recyclable</div>
                  <p className="text-sm text-muted-foreground">End of Life</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Compliance & Standards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">EU Regulations</h4>
                  <div className="flex flex-wrap gap-2">
                    {verificationResult.compliance_info.eu_regulations.map((regulation) => (
                      <Badge key={regulation} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {regulation}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Standards</h4>
                  <div className="flex flex-wrap gap-2">
                    {verificationResult.compliance_info.standards.map((standard) => (
                      <Badge key={standard} variant="outline">
                        {standard}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Blockchain Network</h4>
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {verificationResult.compliance_info.blockchain_network}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>DPP ID</Label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">{verificationResult.dpp_id}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(verificationResult.dpp_id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>IPFS CID</Label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm break-all">{verificationResult.ipfs_cid}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(verificationResult.ipfs_cid)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={verificationResult.ipfs_gateway_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Blockchain Hash</Label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm break-all">{verificationResult.blockchain_hash}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(verificationResult.blockchain_hash)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Issued Date</Label>
                <p className="text-sm">{formatDate(verificationResult.issued_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1" onClick={() => window.print()}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={verificationResult.ipfs_gateway_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on IPFS
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default VerifyPage

