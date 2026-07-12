"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import HeroBanner from "@/components/HeroBanner";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";

const slides = [
  {
    title: "Bring Your Ideas to Life",
    subtitle:
      "FundFrog connects creators with supporters who believe in their vision. Start your campaign today.",
    cta: "Start a Campaign",
    ctaHref: "/register",
    bgClass: "bg-gradient-to-br from-[#0D7C5A] to-[#065F46]",
  },
  {
    title: "Support Dreams That Matter",
    subtitle:
      "Browse campaigns in education, environment, tech, and more. Every contribution makes a difference.",
    cta: "Explore Campaigns",
    ctaHref: "/campaigns",
    bgClass: "bg-gradient-to-br from-[#1E3A5F] to-[#0F2440]",
  },
  {
    title: "Join a Community of Changemakers",
    subtitle:
      "Whether you're a creator with a dream or a supporter with a heart, there's a place for you here.",
    cta: "Join FundFrog",
    ctaHref: "/register",
    bgClass: "bg-gradient-to-br from-[#7C2D12] to-[#431407]",
  },
];

export default function Home() {
  return (
    <>
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.title}>
            <HeroBanner {...slide} />
          </SwiperSlide>
        ))}
      </Swiper>

      <HowItWorks />
      <Testimonials />
    </>
  );
}
