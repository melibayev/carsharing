import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Car,
  Shield,
  CreditCard,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronDown,
  Star,
  Users,
  Bookmark,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { REGIONS } from '@/lib/regions';
import { useCarSearch } from '@/hooks/use-cars';
import { CarCard } from '@/components/cars/car-card';

// Uzbek city data for the regions grid
const topCities = [
  { code: 'TSH', emoji: '🏙️', count: '120+' },
  { code: 'SAM', emoji: '🕌', count: '45+' },
  { code: 'BUX', emoji: '🏛️', count: '35+' },
  { code: 'FAR', emoji: '🏔️', count: '25+' },
  { code: 'AND', emoji: '🌄', count: '20+' },
  { code: 'NAM', emoji: '🌿', count: '18+' },
  { code: 'XOR', emoji: '🏜️', count: '15+' },
  { code: 'QOR', emoji: '🌅', count: '10+' },
];

// Hero background images – Ken Burns effect (Uzbekistan landmarks from Unsplash)
const heroImages = [
  'https://images.unsplash.com/photo-1663188817914-b2ffd40b8e76?w=1920&q=80', // Uzbekistan architecture
  'https://images.unsplash.com/photo-1667698346537-5230acad6846?w=1920&q=80', // Samarkand streets
  'https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?w=1920&q=80', // Uzbekistan landscape
];

const categories = [
  { key: 'sedan', icon: '🚗', bodyType: 'Sedan' },
  { key: 'suv', icon: '🚙', bodyType: 'SUV' },
  { key: 'hatchback', icon: '🚘', bodyType: 'Hatchback' },
  { key: 'minivan', icon: '🚐', bodyType: 'Minivan' },
  { key: 'truck', icon: '🛻', bodyType: 'Truck' },
  { key: 'van', icon: '🚌', bodyType: 'Van' },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [currentBg, setCurrentBg] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch featured cars
  const { data: featuredCars } = useCarSearch({ pageSize: 8, sort: 'rating' });

  // Ken Burns background rotation
  useEffect(() => {
    const timer = setInterval(() => setCurrentBg((p) => (p + 1) % heroImages.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?city=${encodeURIComponent(searchCity)}`);
  };

  const getRegionName = (code: string) => {
    const r = REGIONS.find((r) => r.code === code);
    if (!r) return code;
    return i18n.language === 'ru' ? r.cyrillic : r.capital;
  };

  return (
    <div>
      {/* ──────────────── SECTION 1: HERO ──────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Ken Burns backgrounds */}
        <AnimatePresence>
          <motion.div
            key={currentBg}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImages[currentBg]})` }}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 container text-center space-y-8 py-20">
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Glass search card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <form
              onSubmit={handleSearch}
              className="mx-auto max-w-3xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder={t('hero.searchPlaceholder')}
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    type="date"
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white rounded-xl"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold">
                  <Search className="mr-2 h-5 w-5" />
                  {t('hero.search')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ──────────────── SECTION 2: POPULAR REGIONS ──────────────── */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('regions.title')}</h2>
          <p className="text-muted-foreground">{t('regions.subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topCities.map((city) => (
            <Link key={city.code} to={`/search?city=${encodeURIComponent(REGIONS.find((r) => r.code === city.code)?.capital ?? '')}`}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full rounded-2xl overflow-hidden group">
                  <CardContent className="p-6 text-center space-y-3">
                    <span className="text-5xl block group-hover:scale-110 transition-transform">{city.emoji}</span>
                    <h3 className="font-heading font-semibold">{getRegionName(city.code)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('regions.carsAvailable', { count: city.count })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* ──────────────── SECTION 3: HOW IT WORKS ──────────────── */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('howItWorks.title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: 1, titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
              { icon: CheckCircle2, step: 2, titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
              { icon: Car, step: 3, titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center relative">
                  <item.icon className="h-7 w-7 text-accent" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-lg">{t(item.titleKey)}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── SECTION 4: FEATURED CARS ──────────────── */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('featured.title')}</h2>
            <p className="text-muted-foreground">{t('featured.subtitle')}</p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex gap-1">
            <Link to="/search">
              {t('featured.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCars?.items.slice(0, 8).map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
        <div className="text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/search">{t('featured.viewAll')}</Link>
          </Button>
        </div>
      </section>

      {/* ──────────────── SECTION 5: CATEGORIES ──────────────── */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('categories.title')}</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.key} to={`/search?bodyType=${cat.bodyType}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl">
                  <CardContent className="p-4 text-center space-y-2">
                    <span className="text-3xl">{cat.icon}</span>
                    <p className="text-sm font-medium">{t(`categories.${cat.key}`)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── SECTION 6: STATS ──────────────── */}
      <section className="container py-16 md:py-20">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('stats.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: t('stats.cars'), icon: Car },
              { value: '8', label: t('stats.cities'), icon: MapPin },
              { value: '2,000+', label: t('stats.users'), icon: Users },
              { value: '5,000+', label: t('stats.bookings'), icon: Bookmark },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <stat.icon className="h-8 w-8 text-accent mx-auto" />
                <p className="text-3xl md:text-4xl font-heading font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── SECTION 7: WHY CarSharing ──────────────── */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Nima uchun CarSharing?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Xavfsizlik", desc: "Barcha sayohatlar sug'urta bilan ta'minlangan. 24/7 yordam xizmati." },
              { icon: CreditCard, title: "Qulay narxlar", desc: "An'anaviy ijara kompaniyalariga nisbatan 35% gacha tejang." },
              { icon: Zap, title: "Tezkor bron", desc: "Bir necha daqiqada mashina toping va bron qiling." },
              { icon: Star, title: "Sharhlar tizimi", desc: "Haqiqiy foydalanuvchilar sharhlari asosida tanlang." },
              { icon: Clock, title: "Moslashuvchan muddat", desc: "1 kundan 1 oygacha — o'zingizga qulay muddat tanlang." },
              { icon: TrendingUp, title: "Egalar uchun daromad", desc: "Mashinangiz bo'sh turganida oyiga 3M+ so'm ishlang." },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-none bg-transparent">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── SECTION 8: TESTIMONIALS ──────────────── */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('testimonials.title')}</h2>
          <p className="text-muted-foreground">{t('testimonials.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Sardor K.', city: 'Toshkent', text: "CarSharing orqali mashinamni ijaraga berib, oyiga 4 million so'm ishlayman. Ajoyib platforma!", rating: 5 },
            { name: 'Malika R.', city: 'Samarqand', text: "Samarqandda to'yga mashina kerak edi. 10 daqiqada bron qildim, juda qulay!", rating: 5 },
            { name: "Bobur N.", city: "Buxoro", text: "Ish safari uchun doim CarSharing dan foydalanaman. Narxlari boshqalardan arzon.", rating: 4 },
          ].map((review) => (
            <Card key={review.name} className="rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm italic">"{review.text}"</p>
                <div className="text-sm">
                  <p className="font-semibold">{review.name}</p>
                  <p className="text-muted-foreground">{review.city}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ──────────────── SECTION 9: HOST CTA ──────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 py-16 md:py-20">
        <div className="container relative z-10 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            {t('hostCta.title')}
          </h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            {t('hostCta.subtitle')}
          </p>
          <Button size="lg" variant="secondary" className="rounded-xl font-semibold" asChild>
            <Link to="/host/cars/new">
              {t('hostCta.button')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ──────────────── SECTION 10: FAQ ──────────────── */}
      <section className="container py-16 md:py-20 space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">{t('faq.title')}</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="rounded-xl overflow-hidden">
              <button
                className="w-full text-left p-5 flex items-center justify-between"
                onClick={() => setOpenFaq(openFaq === n ? null : n)}
              >
                <span className="font-semibold">{t(`faq.q${n}`)}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === n ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === n && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground">
                      {t(`faq.a${n}`)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </section>

      {/* ──────────────── SECTION 11: APP PROMO ──────────────── */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container text-center space-y-6 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-sm">Tez kunda</Badge>
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            CarSharing mobil ilovasi
          </h2>
          <p className="text-muted-foreground">
            Tez kunda iOS va Android uchun mobil ilova chiqadi. Bildirishnoma olish uchun ro'yxatdan o'ting!
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="rounded-xl" disabled>
              App Store
            </Button>
            <Button variant="outline" className="rounded-xl" disabled>
              Google Play
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────── SECTION 12: FINAL CTA ──────────────── */}
      <section className="container py-16 md:py-20 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          {t('hero.title')}
        </h2>
        <div className="flex justify-center gap-4 flex-wrap">
          <Button size="lg" className="rounded-xl bg-accent hover:bg-accent/90 font-semibold" asChild>
            <Link to="/search">
              <Search className="mr-2 h-5 w-5" />
              {t('hero.search')}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl font-semibold" asChild>
            <Link to="/host/cars/new">
              {t('hostCta.button')}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
