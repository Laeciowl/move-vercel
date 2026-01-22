import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoSection from "@/components/VideoSection";
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
        <VideoSection />
        <AboutSection />
        <WhyMoveSection />
        <WhatWeOfferSection />
        <SignupSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
