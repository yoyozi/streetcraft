import Link from 'next/link';
import { APP_NAME, SOCIAL_INSTAGRAM, SOCIAL_FACEBOOK } from "@/lib/constants";
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=38+Stafford+Street+Westdene+Johannesburg';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Contact</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a href="mailto:info@streetcraft.co.za" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                info@streetcraft.co.za
              </a>
            </li>
            <li>
              <a href="tel:+27637317733" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                063 731 7733
              </a>
            </li>
            <li>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-foreground transition-colors">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                38 Stafford Street, Westdene, Johannesburg
              </a>
            </li>
          </ul>
        </div>

        {/* Partners */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Partners</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a href="http://netsecurity.co.za" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors">
                <ExternalLink className="h-4 w-4 shrink-0" />
                NetSecurity
              </a>
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Policies</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            <li><Link href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
            <li><Link href="/cancellation-policy" className="hover:text-foreground transition-colors">Cancellation Policy</Link></li>
            <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide mb-4">Follow Us</h3>
          <p className="text-sm text-muted-foreground italic mb-3">Coming soon…</p>
          <div className="flex gap-3">
            {/* Instagram */}
            <a href={SOCIAL_INSTAGRAM || '#'} aria-label="Instagram" target={SOCIAL_INSTAGRAM ? '_blank' : undefined} rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href={SOCIAL_FACEBOOK || '#'} aria-label="Facebook" target={SOCIAL_FACEBOOK ? '_blank' : undefined} rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-muted-foreground">
          &copy; {currentYear} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;