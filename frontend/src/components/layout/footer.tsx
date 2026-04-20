import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import { REGIONS } from '@/lib/regions';

const topRegions = REGIONS.filter((r) => ['TSH', 'SAM', 'BUX', 'FAR', 'AND', 'XOR'].includes(r.code));

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Car className="h-5 w-5 text-primary" />
            CarSharing
          </Link>
          <p className="text-sm text-muted-foreground">
            Uzbekistan's first P2P car rental platform
          </p>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-3">Regions</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {topRegions.map((r) => (
              <li key={r.code}>
                <Link to={`/search?city=${encodeURIComponent(r.capital)}`} className="hover:text-foreground">
                  {r.capital}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-3">List your car</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/host/cars/new" className="hover:text-foreground">List your car</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact us</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CarSharing. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
