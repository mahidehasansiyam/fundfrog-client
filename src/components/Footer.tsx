import Link from "next/link";
import { FaLinkedin, FaFacebook, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐸</span>
            <span className="font-heading text-xl font-bold text-primary">
              FundFrog
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-text-secondary transition-colors hover:text-primary"
              aria-label="LinkedIn"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-text-secondary transition-colors hover:text-primary"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-text-secondary transition-colors hover:text-primary"
              aria-label="GitHub"
            >
              <FaGithub />
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-text-secondary">
          &copy; {new Date().getFullYear()} FundFrog. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
