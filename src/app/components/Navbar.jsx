import {Heart, Menu} from "lucide-react";
import { Button } from "@/components/ui/button";
export default function  Navbar(){
    return(
        <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">HealthGuard AI</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <Button variant="ghost">Features</Button>
            <Button variant="ghost">How it Works</Button>
            <Button variant="ghost">About</Button>
            <Button>Get Started</Button>
          </div>
          <Button variant="ghost" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    )
}