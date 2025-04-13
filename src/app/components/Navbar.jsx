// src/app/components/Navbar.jsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle"; // <<< Import ThemeToggle

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Title */}
        <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">HealthGuard AI</span>
        </Link>

        {/* Desktop Navigation & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-2">
          <Link href="/#features" passHref legacyBehavior>
            <Button variant="ghost">Features</Button>
          </Link>
          <Link href="/#how-it-works" passHref legacyBehavior>
            <Button variant="ghost">How it Works</Button>
          </Link>
          <Link href="/#about" passHref legacyBehavior>
            <Button variant="ghost">About</Button>
          </Link>
          <Link href="/chat" passHref legacyBehavior>
            <Button>Try the Chat</Button>
          </Link>
          {/* --- Add Theme Toggle Here --- */}
          <ThemeToggle />
          {/* --------------------------- */}
        </div>

        {/* Mobile Menu Trigger & Theme Toggle */}
        <div className="flex items-center md:hidden">
           {/* --- Add Theme Toggle Here (before menu) --- */}
           <ThemeToggle />
           {/* ------------------------------------------ */}
           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2"> {/* Added margin */}
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-6">
              {/* Mobile Menu Content */}
              <div className="flex flex-col space-y-4 mt-6">
                 {/* ... your mobile links ... */}
                 <Link href="/" passHref legacyBehavior><SheetClose asChild><Button variant="ghost" className="justify-start text-lg">Home</Button></SheetClose></Link>
                 <Link href="/#features" passHref legacyBehavior><SheetClose asChild><Button variant="ghost" className="justify-start text-lg">Features</Button></SheetClose></Link>
                 <Link href="/#how-it-works" passHref legacyBehavior><SheetClose asChild><Button variant="ghost" className="justify-start text-lg">How it Works</Button></SheetClose></Link>
                 <Link href="/#about" passHref legacyBehavior><SheetClose asChild><Button variant="ghost" className="justify-start text-lg">About</Button></SheetClose></Link>
                 <Link href="/chat" passHref legacyBehavior><SheetClose asChild><Button className="w-full text-lg">Try the Chat</Button></SheetClose></Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}