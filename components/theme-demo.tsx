'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ThemeDemo() {
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold" style={{ color: '#ec5c2b' }}>
            StreetCraft Theme Colors
          </CardTitle>
          <CardDescription>
            Your brand colors (#ec5c2b and #e2db2c) in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Direct Color Examples */}
          <div className="space-y-2">
            <h4 className="font-semibold">Direct Brand Colors</h4>
            <div className="flex flex-wrap gap-2">
              <div 
                className="px-4 py-2 rounded text-white font-medium"
                style={{ backgroundColor: '#ec5c2b' }}
              >
                Primary Orange (#ec5c2b)
              </div>
              <div 
                className="px-4 py-2 rounded text-black font-medium"
                style={{ backgroundColor: '#e2db2c' }}
              >
                Secondary Yellow (#e2db2c)
              </div>
              <div 
                className="px-4 py-2 rounded text-white font-medium"
                style={{ backgroundColor: '#d44a1a' }}
              >
                Dark Orange (#d44a1a)
              </div>
            </div>
          </div>

          {/* ShadCN Button Examples */}
          <div className="space-y-2">
            <h4 className="font-semibold">ShadCN UI Buttons (Using CSS Variables)</h4>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-primary hover:bg-primary/90">
                Primary Button
              </Button>
              <Button variant="secondary" className="bg-secondary hover:bg-secondary/90">
                Secondary Button
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Outline Primary
              </Button>
              <Button variant="default" className="bg-accent hover:bg-accent/90">
                Accent Button
              </Button>
            </div>
          </div>

          {/* Tailwind Color Examples */}
          <div className="space-y-2">
            <h4 className="font-semibold">Tailwind Utility Classes</h4>
            <div className="flex flex-wrap gap-2">
              <div className="px-4 py-2 bg-primary text-primary-foreground rounded">
                bg-primary
              </div>
              <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
                bg-secondary
              </div>
              <div className="px-4 py-2 bg-accent text-accent-foreground rounded">
                bg-accent
              </div>
              <div className="px-4 py-2 text-primary border border-primary rounded">
                text-primary
              </div>
            </div>
          </div>

          {/* Badge Examples */}
          <div className="space-y-2">
            <h4 className="font-semibold">Badge Components</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">
                Primary Badge
              </Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                Secondary Badge
              </Badge>
              <Badge variant="outline" className="border-primary text-primary">
                Outline Badge
              </Badge>
            </div>
          </div>

          {/* Custom CSS Classes */}
          <div className="space-y-2">
            <h4 className="font-semibold">Custom CSS Classes (New)</h4>
            <div className="flex flex-wrap gap-2">
              <div className="px-4 py-2 brand-orange rounded">
                .brand-orange
              </div>
              <div className="px-4 py-2 brand-yellow rounded">
                .brand-yellow
              </div>
              <div className="px-4 py-2 text-brand-orange border border-brand-orange rounded">
                .text-brand-orange
              </div>
              <div className="px-4 py-2 text-brand-yellow border-2 rounded" style={{ borderColor: '#e2db2c' }}>
                .text-brand-yellow
              </div>
              <button className="px-4 py-2 border border-brand-orange rounded hover-brand-orange transition-colors">
                .hover-brand-orange
              </button>
              <button className="px-4 py-2 border-2 rounded transition-colors" style={{ borderColor: '#e2db2c' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2db2c'; e.currentTarget.style.color = 'black'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'inherit'; }}>
                .hover-brand-yellow
              </button>
            </div>
          </div>

          {/* Interactive Examples */}
          <div className="space-y-2">
            <h4 className="font-semibold">Interactive Elements</h4>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                🛒 Add to Cart
              </Button>
              <Button variant="secondary" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                ⭐ Add to Wishlist
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                👁️ Quick View
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
