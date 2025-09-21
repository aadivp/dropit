import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Vapi Negotiation System</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Automate your customer service negotiations with AI. Get refunds, returns, and bill reductions without the
              hassle.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link
                href="/call-monitor"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Call Monitor
              </Link>
              <Link href="/login" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Sign In
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@vapi.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>1-800-VAPI-AI</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Vapi Negotiation System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
