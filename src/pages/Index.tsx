import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoSection from "@/components/VideoSection";
import AboutSection from "@/components/AboutSection";
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
        <SignupSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
