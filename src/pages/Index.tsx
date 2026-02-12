import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoSection from "@/components/VideoSection";
import PathCardsSection from "@/components/PathCardsSection";
import StatsSection from "@/components/StatsSection";
import AboutSection from "@/components/AboutSection";
import WhyMoveSection from "@/components/WhyMoveSection";
import WhatWeOfferSection from "@/components/WhatWeOfferSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <PathCardsSection />
        <StatsSection />
        <AboutSection />
        <WhyMoveSection />
        <WhatWeOfferSection />
        <VideoSection />
        <SignupSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
