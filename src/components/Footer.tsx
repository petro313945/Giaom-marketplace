import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t mt-auto bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Giaom Marketplace</h3>
            <p className="text-sm text-muted-foreground">
              Discover unique products from independent sellers around the world.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/category/electronics" className="text-muted-foreground hover:text-foreground">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/category/clothing" className="text-muted-foreground hover:text-foreground">
                  Clothing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/auth/login" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/auth/sign-up" className="text-muted-foreground hover:text-foreground">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/become-seller" className="text-muted-foreground hover:text-foreground">
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Giaom Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
