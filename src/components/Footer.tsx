import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-lg mb-4">Giaom</h4>
            <p className="text-sm text-muted-foreground">
              Your marketplace for unique, handcrafted, and vintage items from independent sellers worldwide.
            </p>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Shop</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/category/electronics" className="text-muted-foreground hover:text-foreground">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/category/fashion" className="text-muted-foreground hover:text-foreground">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/category/home-garden" className="text-muted-foreground hover:text-foreground">
                  Home & Garden
                </Link>
              </li>
              <li>
                <Link to="/category/sports" className="text-muted-foreground hover:text-foreground">
                  Sports
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">About</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/become-seller" className="text-muted-foreground hover:text-foreground">
                  Sell on Giaom
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
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-4">Follow Us</h5>
            <div className="flex gap-4">
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Giaom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
