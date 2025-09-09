import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])

  // Mock data for demonstration
  const mockProducts = [
    {
      id: '1',
      product_name: 'Organic Cotton T-Shirt',
      description: 'Premium organic cotton t-shirt made in Tiruppur',
      sku: 'CT-001',
      gtin: '1234567890123',
      material_composition: { 'Organic Cotton': '95%', 'Elastane': '5%' },
      production_location: 'Tiruppur, Tamil Nadu, India',
      production_date: '2025-01-15',
      color: 'White',
      size: 'M',
      status: 'active',
      created_at: '2025-01-15T10:30:00Z',
      dpp_status: 'verified'
    },
    {
      id: '2',
      product_name: 'Sustainable Denim Jeans',
      description: 'Eco-friendly denim jeans with recycled materials',
      sku: 'DJ-002',
      gtin: '1234567890124',
      material_composition: { 'Organic Cotton': '80%', 'Recycled Polyester': '18%', 'Elastane': '2%' },
      production_location: 'Tiruppur, Tamil Nadu, India',
      production_date: '2025-01-14',
      color: 'Blue',
      size: '32',
      status: 'active',
      created_at: '2025-01-14T09:15:00Z',
      dpp_status: 'pending'
    },
    {
      id: '3',
      product_name: 'Silk Scarf',
      description: 'Handwoven silk scarf with traditional patterns',
      sku: 'SS-003',
      gtin: '1234567890125',
      material_composition: { 'Mulberry Silk': '100%' },
      production_location: 'Tiruppur, Tamil Nadu, India',
      production_date: '2025-01-13',
      color: 'Multi',
      size: 'One Size',
      status: 'active',
      created_at: '2025-01-13T14:20:00Z',
      dpp_status: 'verified'
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts)
      setFilteredProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Filter products based on search term
    const filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">
            Manage your textile products and their Digital Product Passports
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link to="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
              </p>
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.product_name}</CardTitle>
                    <CardDescription className="mt-1">
                      SKU: {product.sku}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(product.dpp_status)}
                    <Badge className={getStatusColor(product.dpp_status)}>
                      {product.dpp_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Color:</span> {product.color}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {product.size}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Location:</span> {product.production_location}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(product.material_composition).map(([material, percentage]) => (
                      <Badge key={material} variant="outline" className="text-xs">
                        {material}: {percentage}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created: {formatDate(product.created_at)}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link to={`/products/${product.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link to={`/products/${product.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  {product.dpp_status === 'verified' && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/dpps/${product.id}/qr`}>
                        <QrCode className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {products.filter(p => p.dpp_status === 'verified').length}
              </div>
              <div className="text-sm text-muted-foreground">Verified DPPs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.dpp_status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending DPPs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {products.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Products</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductsPage

