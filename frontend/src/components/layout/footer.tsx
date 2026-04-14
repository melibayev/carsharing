import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car } from 'lucide-react';
import { REGIONS } from '@/lib/regions';

const topRegions = REGIONS.filter((r) => ['TSH', 'SAM', 'BUX', 'FAR', 'AND', 'XOR'].includes(r.code));

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Car className="h-5 w-5 text-primary" />
            CarSharing
          </Link>
          <p className="text-sm text-muted-foreground">
            {t('footer.aboutText')}
          </p>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-3">{t('footer.regions')}</h4>
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
          <h4 className="font-heading font-semibold mb-3">{t('nav.listYourCar')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/host/cars/new" className="hover:text-foreground">{t('nav.listYourCar')}</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold mb-3">{t('footer.support')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">{t('howItWorks.title')}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t('footer.contact')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-foreground">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
