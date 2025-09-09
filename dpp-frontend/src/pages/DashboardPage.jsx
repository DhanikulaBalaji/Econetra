import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Package, 
  QrCode, 
  Shield, 
  TrendingUp, 
  Plus,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

const DashboardPage = () => {
  const { user, userRole } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalDPPs: 0,
    verifiedDPPs: 0,
    pendingDPPs: 0
  })

  // Mock data for demonstration
  const recentProducts = [
    {
      id: '1',
      name: 'Cotton T-Shirt',
      sku: 'CT-001',
      status: 'active',
      dppStatus: 'verified',
      createdAt: '2025-01-15'
    },
    {
      id: '2',
      name: 'Organic Jeans',
      sku: 'OJ-002',
      status: 'active',
      dppStatus: 'pending',
      createdAt: '2025-01-14'
    },
    {
      id: '3',
      name: 'Silk Scarf',
      sku: 'SS-003',
      status: 'active',
      dppStatus: 'verified',
      createdAt: '2025-01-13'
    }
  ]

  const recentDPPs = [
    {
      id: 'dpp-001',
      productName: 'Cotton T-Shirt',
      status: 'verified',
      ipfsCid: 'QmX1Y2Z3...',
      createdAt: '2025-01-15',
      verifications: 12
    },
    {
      id: 'dpp-002',
      productName: 'Organic Jeans',
      status: 'pending',
      ipfsCid: 'QmA4B5C6...',
      createdAt: '2025-01-14',
      verifications: 0
    }
  ]

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalProducts: 15,
      totalDPPs: 12,
      verifiedDPPs: 10,
      pendingDPPs: 2
    })
  }, [])

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}. Here's your DPP platform overview.
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button asChild>
            <Link to="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dpps/new">
              <QrCode className="h-4 w-4 mr-2" />
              Create DPP
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total DPPs</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDPPs}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified DPPs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedDPPs}</div>
            <p className="text-xs text-muted-foreground">
              83% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending DPPs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDPPs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>
              Your latest registered products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(product.dppStatus)}
                    <Badge className={getStatusColor(product.dppStatus)}>
                      {product.dppStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/products">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent DPPs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent DPPs</CardTitle>
            <CardDescription>
              Your latest Digital Product Passports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDPPs.map((dpp) => (
                <div key={dpp.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                      <QrCode className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{dpp.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {dpp.verifications} verifications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(dpp.status)}
                    <Badge className={getStatusColor(dpp.status)}>
                      {dpp.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dpps">
                  <Eye className="h-4 w-4 mr-2" />
                  View All DPPs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/products/new">
                <Plus className="h-6 w-6 mb-2" />
                Register New Product
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dpps/new">
                <QrCode className="h-6 w-6 mb-2" />
                Generate DPP
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/verify">
                <Shield className="h-6 w-6 mb-2" />
                Verify DPP
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage

