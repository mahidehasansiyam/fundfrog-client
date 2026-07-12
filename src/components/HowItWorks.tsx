import { HiUserAdd, HiLightBulb, HiCash } from "react-icons/hi";

const steps = [
  {
    icon: HiUserAdd,
    title: "Create Your Account",
    description:
      "Sign up as a Creator or Supporter. It takes just a minute and you'll join a community of changemakers.",
  },
  {
    icon: HiLightBulb,
    title: "Start or Support a Campaign",
    description:
      "Creators launch campaigns for their ideas. Supporters browse and contribute credits to projects they believe in.",
  },
  {
    icon: HiCash,
    title: "Make an Impact",
    description:
      "Watch your ideas come to life or your contributions make a difference. Withdraw earnings or support more projects.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Three simple steps to get started with FundFrog
          </p>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="group text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon />
                </div>
                <div className="mt-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
