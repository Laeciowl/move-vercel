import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const toEmbedUrl = (url: string): string => {
  if (!url) return "";
  // Already embed format
  if (url.includes("youtube.com/embed/")) return url;
  // youtu.be/VIDEO_ID format
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=VIDEO_ID format
  const watchMatch = url.match(/[?&]v=([^?&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
};

const VideoSection = () => {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/9AoueBf7Tr0");

  useEffect(() => {
    const fetchVideo = async () => {
      const { data } = await supabase
        .from("platform_videos")
        .select("youtube_url")
        .eq("key", "hero_video")
        .single();
      if (data?.youtube_url) setVideoUrl(toEmbedUrl(data.youtube_url));
    };
    fetchVideo();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Conheça a Movê
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja como a plataforma funciona e como podemos te ajudar na sua jornada profissional
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/50">
            <iframe
              src={videoUrl}
              title="Apresentação da Movê"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
