// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Upload, Users } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🎯</span>
            StageSync
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/upload" className="hover:text-primary transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <Link href="/compare" className="hover:text-primary transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" />
              Compare
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Future logout or profile here */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="flex items-center justify-around h-14">
          <Link href="/upload" className="flex flex-col items-center text-xs text-muted-foreground hover:text-primary">
            <Upload className="w-5 h-5 mb-1" />
            Upload
          </Link>
          <Link href="/compare" className="flex flex-col items-center text-xs text-muted-foreground hover:text-primary">
            <Users className="w-5 h-5 mb-1" />
            Compare
          </Link>
        </div>
      </div>
    </nav>
  );
}