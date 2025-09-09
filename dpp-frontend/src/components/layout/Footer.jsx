import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Github, Mail, Globe } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold">Econetra</span>
                <span className="text-xs text-muted-foreground">DPP Platform</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              EU-compliant Digital Product Passport platform for textile exporters from Tiruppur, India.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-foreground transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/dpps" className="hover:text-foreground transition-colors">
                  DPPs
                </Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-foreground transition-colors">
                  Verify DPP
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/docs" className="hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/api" className="hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="hover:text-foreground transition-colors">
                  EU Compliance
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/gdpr" className="hover:text-foreground transition-colors">
                  GDPR Compliance
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2025 Econetra DPP Platform. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="https://econetra.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a 
                href="mailto:support@econetra.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a 
                href="https://github.com/econetra/dpp-platform" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

