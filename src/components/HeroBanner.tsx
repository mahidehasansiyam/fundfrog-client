interface HeroBannerProps {
  title: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  bgClass: string;
}

export default function HeroBanner({
  title,
  subtitle,
  cta,
  ctaHref,
  bgClass,
}: HeroBannerProps) {
  return (
    <div
      className={`flex min-h-[70vh] items-center justify-center px-4 ${bgClass}`}
    >
      <div className="max-w-3xl text-center">
        <h2 className="animate-fade-up font-heading text-4xl font-bold leading-tight text-white md:text-6xl">
          {title}
        </h2>
        <p className="animate-fade-up delay-200 mt-6 text-lg text-white/85 md:text-xl">
          {subtitle}
        </p>
        <a
          href={ctaHref}
          className="animate-fade-up delay-300 mt-8 inline-block rounded-lg bg-accent px-8 py-3.5 font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
