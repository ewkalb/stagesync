// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Upload, Users, Library, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 border-white/10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="text-xl">Stage</span>Sync
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/upload" className="hover:text-zinc-300 transition-colors flex items-center gap-2 text-white/90">
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <Link href="/videos" className="hover:text-zinc-300 transition-colors flex items-center gap-2 text-white/90">
              <Library className="w-4 h-4" />
              Videos
            </Link>
            <Link href="/compare" className="hover:text-zinc-300 transition-colors flex items-center gap-2 text-white/90">
              <Users className="w-4 h-4" />
              Compare
            </Link>
            <Link href="/account" className="hover:text-zinc-300 transition-colors flex items-center gap-2 text-white/90">
              <User className="w-4 h-4" />
              Account
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-zinc-950 z-50 border-white/10">
        <div className="flex items-center justify-around h-14 text-xs">
          <Link href="/upload" className="flex flex-col items-center hover:text-zinc-300 text-white/90">
            <Upload className="w-5 h-5 mb-1" />Upload
          </Link>
          <Link href="/videos" className="flex flex-col items-center hover:text-zinc-300 text-white/90">
            <Library className="w-5 h-5 mb-1" />Videos
          </Link>
          <Link href="/compare" className="flex flex-col items-center hover:text-zinc-300 text-white/90">
            <Users className="w-5 h-5 mb-1" />Compare
          </Link>
          <Link href="/account" className="flex flex-col items-center hover:text-zinc-300 text-white/90">
            <User className="w-5 h-5 mb-1" />Account
          </Link>
        </div>
      </div>
    </nav>
  );
}