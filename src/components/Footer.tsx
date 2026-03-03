import { Link } from 'react-router-dom'
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h5 className="font-semibold mb-4">Shop</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/gift-cards" className="text-muted-foreground hover:text-foreground">
                  Gift cards
                </Link>
              </li>
              <li>
                <Link to="/auth/sign-up" className="text-muted-foreground hover:text-foreground">
                  Giaom Registry
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-muted-foreground hover:text-foreground">
                  Sitemap
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground">
                  Giaom blog
                </Link>
              </li>
              <li>
                <Link to="/uk" className="text-muted-foreground hover:text-foreground">
                  Giaom United Kingdom
                </Link>
              </li>
              <li>
                <Link to="/de" className="text-muted-foreground hover:text-foreground">
                  Giaom Germany
                </Link>
              </li>
              <li>
                <Link to="/ca" className="text-muted-foreground hover:text-foreground">
                  Giaom Canada
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Sell</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/become-seller" className="text-muted-foreground hover:text-foreground">
                  Sell on Giaom
                </Link>
              </li>
              <li>
                <Link to="/teams" className="text-muted-foreground hover:text-foreground">
                  Teams
                </Link>
              </li>
              <li>
                <Link to="/forums" className="text-muted-foreground hover:text-foreground">
                  Forums
                </Link>
              </li>
              <li>
                <Link to="/affiliates" className="text-muted-foreground hover:text-foreground">
                  Affiliates & Creators
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">About</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground">
                  Giaom, Inc.
                </Link>
              </li>
              <li>
                <Link to="/policies" className="text-muted-foreground hover:text-foreground">
                  Policies
                </Link>
              </li>
              <li>
                <Link to="/investors" className="text-muted-foreground hover:text-foreground">
                  Investors
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-muted-foreground hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-muted-foreground hover:text-foreground">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/impact" className="text-muted-foreground hover:text-foreground">
                  Impact
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-muted-foreground hover:text-foreground">
                  Legal imprint
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Help</h5>
            <ul className="space-y-2 text-sm mb-6">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy-settings" className="text-muted-foreground hover:text-foreground">
                  Privacy settings
                </Link>
              </li>
            </ul>
            <div className="flex gap-4">
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

        </div>

        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@giaom.com" className="hover:text-foreground transition-colors">
                  support@giaom.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-foreground transition-colors">
                  +1 (234) 567-890
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="hover:text-foreground transition-colors">
                  123 Commerce Street, Business City, BC 12345
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2025 Giaom. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
