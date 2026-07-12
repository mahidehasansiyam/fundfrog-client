"use client";

import { useState } from "react";
import Link from "next/link";
import { HiMenu, HiX, HiLogout } from "react-icons/hi";
import { useAuth } from "@/lib/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐸</span>
          <span className="font-heading text-xl font-bold text-primary">
            FundFrog
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/campaigns"
            className="font-medium text-text-secondary transition-colors hover:text-primary"
          >
            Explore Campaigns
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-red-600"
              >
                <HiLogout className="text-lg" />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-text-secondary transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-2xl text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/campaigns"
              className="font-medium text-text-secondary transition-colors hover:text-primary"
              onClick={() => setMenuOpen(false)}
            >
              Explore Campaigns
            </Link>

            {user ? (
              <>
                <span className="font-medium text-foreground">{user.name}</span>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 font-medium text-red-600 transition-colors hover:text-red-700"
                >
                  <HiLogout className="text-lg" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-medium text-text-secondary transition-colors hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary px-5 py-2.5 text-center font-medium text-white transition-colors hover:bg-primary-hover"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
