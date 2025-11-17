'use client'

import gridStyles from './grid.module.css'
import themeStyles from './theme.module.css'

export function GridDemo() {
  return (
    <div className={`${gridStyles.container} ${themeStyles.cardBrandOrange} ${gridStyles.py6} ${gridStyles.my4}`}>
      <h2 className={`${gridStyles.text2xl} ${gridStyles.fontBold} ${gridStyles.mb4}`}>
        CSS Modules Grid System Demo
      </h2>
      
      {/* Basic Grid Examples */}
      <div className={`${gridStyles.mb6}`}>
        <h3 className={`${gridStyles.textLg} ${gridStyles.fontSemibold} ${gridStyles.mb3}`}>
          12 Column Grid System
        </h3>
        
        {/* 12 columns */}
        <div className={`${gridStyles.grid} ${gridStyles.gridCols12} ${gridStyles.mb4}`}>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`${gridStyles.p2} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter} ${gridStyles.textSm}`}
              style={{ 
                backgroundColor: 'hsl(var(--muted))',
                minHeight: '2rem'
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Grid Examples */}
      <div className={`${gridStyles.mb6}`}>
        <h3 className={`${gridStyles.textLg} ${gridStyles.fontSemibold} ${gridStyles.mb3}`}>
          Responsive Grid (Mobile → Tablet → Desktop)
        </h3>
        
        {/* Responsive: 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className={`${gridStyles.grid} ${gridStyles.gridCols1} ${gridStyles.smGridCols2} ${gridStyles.lgGridCols3} ${gridStyles.gap4}`}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div 
              key={item}
              className={`${gridStyles.p4} ${gridStyles.border2} ${gridStyles.roundedLg} ${gridStyles.textCenter}`}
              style={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--primary))'
              }}
            >
              <div className={`${gridStyles.fontBold} ${gridStyles.textLg} ${gridStyles.mb2}`}>
                Card {item}
              </div>
              <div className={`${gridStyles.textSm} ${gridStyles.textCenter}`}>
                Responsive item
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column Span Examples */}
      <div className={`${gridStyles.mb6}`}>
        <h3 className={`${gridStyles.textLg} ${gridStyles.fontSemibold} ${gridStyles.mb3}`}>
          Column Spans
        </h3>
        
        <div className={`${gridStyles.grid} ${gridStyles.gridCols12} ${gridStyles.gap4}`}>
          <div className={`${gridStyles.colSpan6} ${gridStyles.p4} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            Span 6 columns
          </div>
          <div className={`${gridStyles.colSpan4} ${gridStyles.p4} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
            Span 4 columns
          </div>
          <div className={`${gridStyles.colSpan2} ${gridStyles.p4} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--muted))' }}>
            Span 2
          </div>
        </div>
      </div>

      {/* Gap Examples */}
      <div className={`${gridStyles.mb6}`}>
        <h3 className={`${gridStyles.textLg} ${gridStyles.fontSemibold} ${gridStyles.mb3}`}>
          Gap Utilities
        </h3>
        
        <div className={`${gridStyles.grid} ${gridStyles.gridCols3} ${gridStyles.gap2}`}>
          <div className={`${gridStyles.p3} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--card))' }}>
            Small Gap
          </div>
          <div className={`${gridStyles.p3} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--card))' }}>
            Small Gap
          </div>
          <div className={`${gridStyles.p3} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--card))' }}>
            Small Gap
          </div>
        </div>
        
        <div className={`${gridStyles.grid} ${gridStyles.gridCols3} ${gridStyles.gap6} ${gridStyles.mt4}`}>
          <div className={`${gridStyles.p3} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--card))' }}>
            Large Gap
          </div>
          <div className={`${gridStyles.p3} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--card))' }}>
            Large Gap
          </div>
          <div className={`${gridStyles.p3} ${gridStyles.border} ${gridStyles.rounded} ${gridStyles.textCenter}`} style={{ backgroundColor: 'hsl(var(--card))' }}>
            Large Gap
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className={`${gridStyles.p4} ${gridStyles.roundedLg}`} style={{ backgroundColor: 'hsl(var(--muted))' }}>
        <h3 className={`${gridStyles.fontBold} ${gridStyles.mb3}`}>Usage Examples:</h3>
        <pre className={`${gridStyles.textSm} ${gridStyles.p3} ${gridStyles.rounded} ${gridStyles.border}`} style={{ backgroundColor: 'hsl(var(--background))' }}>
{`// Container
<div className={gridStyles.container}>

// Responsive Grid
<div className={\`\${gridStyles.grid} \${gridStyles.gridCols1} \${gridStyles.mdGridCols2} \${gridStyles.lgGridCols3}\`}>

// Column Spans
<div className={\`\${gridStyles.colSpan6} \${gridStyles.mdColSpan8}\`}>

// Gaps
<div className={\`\${gridStyles.grid} \${gridStyles.gap4}\`}>`}
        </pre>
      </div>
    </div>
  )
}
