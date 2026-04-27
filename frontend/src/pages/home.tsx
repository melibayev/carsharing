import { Link } from 'react-router-dom';
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
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { CarsAroundMe } from '@/components/home/CarsAroundMe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { REGIONS } from '@/lib/regions';
import { useCarSearch } from '@/hooks/use-cars';
import { CarCard } from '@/components/cars/car-card';
import { useBookingIntent } from '@/hooks/use-booking-intent';
import { useAuthStore } from '@/stores/auth-store';

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
  const { intent, updateIntent, submit, goToOnboarding } = useBookingIntent();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [currentBg, setCurrentBg] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: featuredCars } = useCarSearch({ pageSize: 8, sort: 'rating' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentBg((p) => (p + 1) % heroImages.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const getRegionName = (code: string) => {
    const r = REGIONS.find((r) => r.code === code);
    if (!r) return code;
    return r.capital;
  };

  return (
    <div>
      {/* SECTION 1: HERO with booking intent */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <Badge variant="secondary" className="text-sm px-4 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Trusted by 2,000+ drivers
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight">
              Find your perfect ride
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Rent verified cars from local hosts across 8 cities. Book in minutes, drive in hours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <form
              onSubmit={handleSearch}
              className="mx-auto max-w-3xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    placeholder="City or region"
                    value={intent.city}
                    onChange={(e) => updateIntent({ city: e.target.value })}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    type="date"
                    value={intent.startDate}
                    onChange={(e) => updateIntent({ startDate: e.target.value })}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white rounded-xl"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input
                    type="date"
                    value={intent.endDate}
                    onChange={(e) => updateIntent({ endDate: e.target.value })}
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

          {/* Quick sign-up CTA under search */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={goToOnboarding}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New here? Create an account in 5 minutes
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* SECTION 2: TRUST BAR */}
      <section className="border-b bg-card">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: 'Verified cars', icon: Car },
              { value: '8', label: 'Cities covered', icon: MapPin },
              { value: '4.8', label: 'Average rating', icon: Star },
              { value: '5,000+', label: 'Trips completed', icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-3">
                <stat.icon className="h-5 w-5 text-accent shrink-0" />
                <div className="text-left">
                  <p className="font-heading font-bold text-lg">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="container py-16 md:py-20">
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to get on the road</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: 1, title: 'Search and choose', desc: 'Browse hundreds of verified cars. Filter by price, type, and location.' },
              { icon: CheckCircle2, step: 2, title: 'Book instantly', desc: 'Select your dates and book in minutes. No paperwork needed.' },
              { icon: Car, step: 3, title: 'Pick up and drive', desc: 'Meet the host, get the keys, and hit the road with confidence.' },
            ].map((item) => (
              <motion.div
                key={item.step}
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.step * 0.15 }}
              >
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center relative">
                  <item.icon className="h-7 w-7 text-accent" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" className="rounded-xl" onClick={goToOnboarding}>
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED CARS */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">Featured cars</h2>
              <p className="text-muted-foreground">Top-rated cars loved by our community</p>
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
              <Link to="/search">View all cars</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 4B: CARS AROUND ME */}
      <CarsAroundMe />

      {/* SECTION 5: POPULAR REGIONS */}
      <section className="container py-16 md:py-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Popular regions</h2>
          <p className="text-muted-foreground">Explore car rentals across Uzbekistan</p>
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

      {/* SECTION 6: CATEGORIES */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Browse by type</h2>
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

      {/* SECTION 7: WHY CarSharing */}
      <section className="container py-16 md:py-20">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Why CarSharing?</h2>
            <p className="text-muted-foreground">Everything you need for worry-free car rental</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Insurance included', desc: 'Every trip comes with comprehensive coverage. Drive with peace of mind.' },
              { icon: CreditCard, title: 'Best prices', desc: 'Save up to 35% compared to traditional rental agencies. No hidden fees.' },
              { icon: Zap, title: 'Instant booking', desc: 'Book a car in under 3 minutes. Many cars offer instant confirmation.' },
              { icon: Star, title: 'Verified reviews', desc: 'Every review is from a real trip. Choose your car with confidence.' },
              { icon: Clock, title: 'Flexible duration', desc: 'Rent from 1 day to 1 month. Weekly and monthly discounts available.' },
              { icon: TrendingUp, title: 'Earn as a host', desc: 'List your idle car and earn up to $3,000 per month passively.' },
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
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">What our users say</h2>
            <p className="text-muted-foreground">Real stories from real drivers and hosts</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sardor K.', role: 'Host', city: 'Tashkent', text: 'I earn $3,000 per month renting out my Malibu. The platform handles everything.', rating: 5 },
              { name: 'Malika R.', role: 'Guest', city: 'Samarkand', text: 'Needed a car for a wedding. Booked in 10 minutes, picked it up next morning. Super easy!', rating: 5 },
              { name: 'Bobur N.', role: 'Guest', city: 'Bukhara', text: 'I use CarSharing for all my business trips. Better selection and prices than any rental agency.', rating: 4 },
            ].map((review) => (
              <Card key={review.name} className="rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed">"{review.text}"</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-muted-foreground">{review.city}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{review.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: HOST CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 py-16 md:py-20">
        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
                Turn your parked car into passive income
              </h2>
              <p className="text-lg text-white/80">
                Hosts on CarSharing earn an average of $3,000/month. You set the price, the schedule, and the rules.
              </p>
              <ul className="space-y-3">
                {[
                  'Free to list your car',
                  'Insurance coverage on every trip',
                  'You choose who rents your car',
                  '24/7 customer support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/90">
                    <CheckCircle2 className="h-5 w-5 text-white/80 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" variant="secondary" className="rounded-xl font-semibold" asChild>
                <Link to="/host/cars/new">
                  List your car <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="grid grid-cols-2 gap-4 text-white/90">
                {[
                  { value: '$3,000', label: 'Avg monthly earnings' },
                  { value: '85%', label: 'Host payout rate' },
                  { value: '24h', label: 'Avg first booking' },
                  { value: '4.8', label: 'Host satisfaction' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-2xl font-heading font-bold">{s.value}</p>
                    <p className="text-xs text-white/70">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FAQ */}
      <section className="container py-16 md:py-20 space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: 'How does CarSharing work?', a: 'CarSharing connects car owners with renters. Browse listings, book the one you like, and pick it up from the host. It takes just a few minutes.' },
            { q: 'What documents do I need?', a: 'You need a valid driver\'s license and a national ID or passport. Upload them during onboarding and you\'re ready to book.' },
            { q: 'Is there insurance?', a: 'Yes, every trip includes comprehensive insurance coverage. Both drivers and car owners are protected.' },
            { q: 'How do I set my price as a host?', a: 'You set daily, weekly, and monthly rates. You also control cleaning fees, deposit amounts, and mileage limits.' },
            { q: 'Can I cancel a booking?', a: 'Free cancellation is available up to 24 hours before the trip starts. After that, a cancellation fee may apply.' },
            { q: 'How do payouts work for hosts?', a: 'Hosts receive 85% of the trip cost. Payouts are processed automatically after each completed trip.' },
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

      {/* SECTION 11: FINAL CTA */}
      <section className="container py-16 md:py-24 text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-heading font-bold">
          Ready to hit the road?
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Join thousands of drivers and hosts. Create your account in 5 minutes and start exploring.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Button size="lg" className="rounded-xl bg-accent hover:bg-accent/90 font-semibold" asChild>
            <Link to="/search">
              <Search className="mr-2 h-5 w-5" />
              Browse cars
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl font-semibold" onClick={goToOnboarding}>
            <UserPlus className="mr-2 h-5 w-5" />
            Create account
          </Button>
        </div>
      </section>
    </div>
  );
}
