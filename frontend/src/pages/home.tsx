import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Building2,
  Mountain,
  Landmark,
  TreePine,
  Sunrise,
  Waves,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { REGIONS } from '@/lib/regions';
import { useCarSearch } from '@/hooks/use-cars';
import { CarCard } from '@/components/cars/car-card';

const topCities = [
  { code: 'TSH', icon: Building2, count: '120+' },
  { code: 'SAM', icon: Landmark, count: '45+' },
  { code: 'BUX', icon: Landmark, count: '35+' },
  { code: 'FAR', icon: Mountain, count: '25+' },
  { code: 'AND', icon: Sunrise, count: '20+' },
  { code: 'NAM', icon: TreePine, count: '18+' },
  { code: 'XOR', icon: Sun, count: '15+' },
  { code: 'QOR', icon: Waves, count: '10+' },
];

const heroImages = [
  'https://images.unsplash.com/photo-1663188817914-b2ffd40b8e76?w=1920&q=80',
  'https://images.unsplash.com/photo-1667698346537-5230acad6846?w=1920&q=80',
  'https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?w=1920&q=80',
];

const categories = [
  { key: 'sedan', icon: Car, bodyType: 'Sedan', label: 'Sedan' },
  { key: 'suv', icon: Car, bodyType: 'SUV', label: 'SUV' },
  { key: 'hatchback', icon: Car, bodyType: 'Hatchback', label: 'Hatchback' },
  { key: 'minivan', icon: Car, bodyType: 'Minivan', label: 'Minivan' },
  { key: 'truck', icon: Car, bodyType: 'Truck', label: 'Truck' },
  { key: 'van', icon: Car, bodyType: 'Van', label: 'Van' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [currentBg, setCurrentBg] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: featuredCars } = useCarSearch({ pageSize: 8, sort: 'rating' });

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
    return r.capital;
  };

  return (
    <div>
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
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
            Rent a car across Uzbekistan
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Choose from thousands of verified cars at affordable prices
          </motion.p>

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
                    placeholder="Where are you going?"
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
                  Search
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: POPULAR REGIONS */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Popular regions</h2>
          <p className="text-muted-foreground">Car rentals in the beautiful cities of Uzbekistan</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topCities.map((city) => (
            <Link key={city.code} to={`/search?city=${encodeURIComponent(REGIONS.find((r) => r.code === city.code)?.capital ?? '')}`}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full rounded-2xl overflow-hidden group">
                  <CardContent className="p-6 text-center space-y-3">
                    <city.icon className="h-10 w-10 mx-auto text-accent group-hover:scale-110 transition-transform" />
                    <h3 className="font-heading font-semibold">{getRegionName(city.code)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {city.count} cars
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: 1, title: 'Choose a car', desc: 'Find the perfect car from thousands of options' },
              { icon: CheckCircle2, step: 2, title: 'Book it', desc: 'Select your dates and book in minutes' },
              { icon: Car, step: 3, title: 'Drive', desc: 'Get the keys and enjoy your trip' },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center relative">
                  <item.icon className="h-7 w-7 text-accent" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED CARS */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Featured cars</h2>
            <p className="text-muted-foreground">Most popular and top-rated cars</p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex gap-1">
            <Link to="/search">
              View all <ArrowRight className="h-4 w-4" />
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
            <Link to="/search">View all</Link>
          </Button>
        </div>
      </section>

      {/* SECTION 5: CATEGORIES */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Categories</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.key} to={`/search?bodyType=${cat.bodyType}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl">
                  <CardContent className="p-4 text-center space-y-2">
                    <cat.icon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">{cat.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: STATS */}
      <section className="container py-16 md:py-20">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">CarSharing in numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Cars', icon: Car },
              { value: '8', label: 'Cities', icon: MapPin },
              { value: '2,000+', label: 'Users', icon: Users },
              { value: '5,000+', label: 'Bookings', icon: Bookmark },
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

      {/* SECTION 7: WHY CarSharing */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Why CarSharing?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Safety first', desc: 'All trips are covered by insurance. 24/7 support available.' },
              { icon: CreditCard, title: 'Affordable prices', desc: 'Save up to 35% compared to traditional rental companies.' },
              { icon: Zap, title: 'Quick booking', desc: 'Find and book a car in just a few minutes.' },
              { icon: Star, title: 'Trusted reviews', desc: 'Choose based on real reviews from verified users.' },
              { icon: Clock, title: 'Flexible duration', desc: 'From 1 day to 1 month \u2014 pick the duration that works for you.' },
              { icon: TrendingUp, title: 'Earn as a host', desc: 'List your idle car and earn 3M+ so\'m per month.' },
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

      {/* SECTION 8: TESTIMONIALS */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">What our users say</h2>
          <p className="text-muted-foreground">Reviews from our happy customers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Sardor K.', city: 'Tashkent', text: 'I earn 4 million so\'m per month renting out my car on CarSharing. Amazing platform!', rating: 5 },
            { name: 'Malika R.', city: 'Samarkand', text: 'Needed a car for a wedding in Samarkand. Booked in 10 minutes, very convenient!', rating: 5 },
            { name: 'Bobur N.', city: 'Bukhara', text: 'I always use CarSharing for business trips. Prices are better than the competition.', rating: 4 },
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

      {/* SECTION 9: HOST CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 py-16 md:py-20">
        <div className="container relative z-10 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Earn money while your car sits idle
          </h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Hosts earn an average of $3,000 per month
          </p>
          <Button size="lg" variant="secondary" className="rounded-xl font-semibold" asChild>
            <Link to="/host/cars/new">
              List your car <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* SECTION 10: FAQ */}
      <section className="container py-16 md:py-20 space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: 'How does CarSharing work?', a: 'CarSharing connects private car owners with renters. Choose a car, book it, and pick it up.' },
            { q: 'How are prices set?', a: 'Prices are set by car owners. The rate is per day. Fuel and insurance are separate.' },
            { q: 'Do I need documents?', a: 'Yes, a valid driver\'s license and passport are required.' },
            { q: 'Can I cancel a booking?', a: 'Free cancellation is available up to 24 hours before. See terms for details.' },
          ].map((item, n) => (
            <Card key={n} className="rounded-xl overflow-hidden">
              <button
                className="w-full text-left p-5 flex items-center justify-between"
                onClick={() => setOpenFaq(openFaq === n ? null : n)}
              >
                <span className="font-semibold">{item.q}</span>
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
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 11: APP PROMO */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container text-center space-y-6 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-sm">Coming soon</Badge>
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            CarSharing mobile app
          </h2>
          <p className="text-muted-foreground">
            The iOS and Android app is coming soon. Sign up to get notified!
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

      {/* SECTION 12: FINAL CTA */}
      <section className="container py-16 md:py-20 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Rent a car across Uzbekistan
        </h2>
        <div className="flex justify-center gap-4 flex-wrap">
          <Button size="lg" className="rounded-xl bg-accent hover:bg-accent/90 font-semibold" asChild>
            <Link to="/search">
              <Search className="mr-2 h-5 w-5" />
              Search
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl font-semibold" asChild>
            <Link to="/host/cars/new">
              List your car
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
