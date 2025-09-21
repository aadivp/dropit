"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { Menu, Home, LogIn, Monitor, User, LogOut } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/call-monitor", label: "Call Monitor", icon: Monitor },
  ]

  return (
    <nav className="gradient-hero text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/images/drop-it-logo.png" alt="Drop It Logo" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold">Vapi Negotiation System</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            {/* User authentication section */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-blue-100">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-blue-100 hover:text-white hover:bg-white/10 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-3 text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                
                {/* Mobile User authentication section */}
                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 text-foreground p-2 rounded-lg bg-muted/50">
                        <User className="h-5 w-5" />
                        <span>{user.email}</span>
                      </div>
                      <Button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        variant="ghost"
                        className="w-full justify-start text-foreground hover:text-primary hover:bg-muted mt-2"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        <span>Logout</span>
                      </Button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center space-x-3 text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
