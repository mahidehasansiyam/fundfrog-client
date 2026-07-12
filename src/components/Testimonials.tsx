"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Supporter",
    quote:
      "FundFrog made it incredibly easy to support causes I care about. The credit system is transparent and I love seeing the impact of my contributions.",
    avatar: "SC",
    bg: "bg-primary-light text-primary",
  },
  {
    name: "Marcus Johnson",
    role: "Creator",
    quote:
      "I raised enough to launch my community garden project in just two weeks. FundFrog's platform is intuitive and the supporter community is amazing.",
    avatar: "MJ",
    bg: "bg-accent-light text-accent",
  },
  {
    name: "Priya Patel",
    role: "Supporter",
    quote:
      "The variety of campaigns is incredible. I've contributed to education, environment, and tech projects — all through one trustworthy platform.",
    avatar: "PP",
    bg: "bg-primary-light text-primary",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            What Our Community Says
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Hear from the people who make FundFrog special
          </p>
        </div>

        <div className="mt-16">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={32}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className="pb-12"
          >
            {testimonials.map((t) => (
              <SwiperSlide key={t.name}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-8">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${t.bg}`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-sm text-text-secondary">{t.role}</p>
                    </div>
                  </div>
                  <p className="mt-6 flex-1 leading-relaxed text-text-secondary">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
