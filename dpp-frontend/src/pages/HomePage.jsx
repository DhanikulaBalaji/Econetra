import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Shield, 
  Globe, 
  QrCode, 
  CheckCircle, 
  ArrowRight,
  Leaf,
  Lock,
  Zap
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "EU Compliance",
      description: "Fully compliant with EU DPP delegated acts and ESPR regulations for textiles."
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Product Registration",
      description: "Easy registration of textile products with detailed metadata and material composition."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "IPFS Storage",
      description: "Decentralized storage ensures data availability and immutability."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Blockchain Verification",
      description: "Polygon blockchain integration for tamper-proof verification."
    },
    {
      icon: <QrCode className="h-6 w-6" />,
      title: "QR Code Generation",
      description: "Unique QR codes for each product enabling easy verification."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Verification",
      description: "Instant verification portal for consumers and regulators."
    }
  ]

  const standards = [
    "JSON-LD",
    "GS1 Digital Link",
    "EPCIS 2.0",
    "ESPR Compliant",
    "GDPR Ready"
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                <Leaf className="h-3 w-3 mr-1" />
                EU DPP Compliant Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Digital Product Passports for 
                <span className="text-primary"> Textile Exports</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Streamline your textile exports from Tiruppur to the EU with our comprehensive 
                DPP platform. Ensure compliance, enhance transparency, and build trust.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/verify">
                  Verify DPP
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {standards.map((standard) => (
                <Badge key={standard} variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {standard}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for DPP Compliance
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools and features required to create, 
              manage, and verify Digital Product Passports for textile exports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to create and manage Digital Product Passports for your textile products.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Register Products</h3>
              <p className="text-muted-foreground">
                Add your textile products with detailed information including material composition, 
                production location, and sustainability data.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">Generate DPP</h3>
              <p className="text-muted-foreground">
                Our platform automatically creates EU-compliant DPPs with JSON-LD formatting, 
                IPFS storage, and blockchain verification.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">Export & Verify</h3>
              <p className="text-muted-foreground">
                Attach QR codes to your products and enable instant verification by 
                consumers and EU regulators through our public portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join textile exporters from Tiruppur who are already using our platform 
                to ensure EU compliance and build customer trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/register">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/demo">
                    View Demo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default HomePage

