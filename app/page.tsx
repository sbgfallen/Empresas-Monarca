import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnnouncementsBar from "./components/AnnouncementsBar";

import Hero from "./sections/Hero";
import Categories from "./sections/Categories";
import FeaturedProducts from "./sections/FeaturedProducts";
import BannerCarousel from "./sections/BannerCarousel";
import NewsSection from "./sections/NewsSection";
import Contact from "./sections/Contact";

export default function HomePage() {
  return (
    <main className="bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      <AnnouncementsBar />

      <Navbar />

      <Hero />

      <Categories />

      {/* Banner Carousel - Hero position */}
      <BannerCarousel position="home_hero" />

      <FeaturedProducts />

      <NewsSection />

      <Contact />

      <Footer />
    </main>
  );
}
