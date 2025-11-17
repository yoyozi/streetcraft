'use client'

import styles from './theme.module.css'

export function ThemeDemoModules() {
  return (
    <div className="space-y-6 p-6">
      <div className={`${styles.cardBrandOrange}`}>
        <h2 className="text-2xl font-bold mb-4">StreetCraft CSS Modules Theme</h2>
        <p className="mb-4">Your brand colors using CSS Modules - the simplest way to manage colors!</p>
        
        {/* Direct Color Examples */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Brand Colors</h3>
            <div className="flex flex-wrap gap-2">
              <div className={styles.brandOrange}>
                Brand Orange (#ec5c2b)
              </div>
              <div className={styles.brandYellow}>
                Brand Yellow (#e2db2c)
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Text Colors</h3>
            <div className="flex flex-wrap gap-2">
              <span className={styles.textBrandOrange}>Orange Text</span>
              <span className={styles.textBrandYellow}>Yellow Text</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Button Styles</h3>
            <div className="flex flex-wrap gap-2">
              <button className={styles.buttonPrimary}>
                🛒 Add to Cart
              </button>
              <button className={styles.buttonSecondary}>
                ⭐ Add to Wishlist
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Border Styles</h3>
            <div className="flex flex-wrap gap-2">
              <div className={styles.cardBrandOrange}>
                Orange Border Card
              </div>
              <div className={styles.cardBrandYellow}>
                Yellow Border Card
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Hover Effects</h3>
            <div className="flex flex-wrap gap-2">
              <button className={`${styles.hoverBrandOrange} border-2 border-gray-300 px-4 py-2 rounded`}>
                Hover for Orange
              </button>
              <button className={`${styles.hoverBrandYellow} border-2 border-gray-300 px-4 py-2 rounded`}>
                Hover for Yellow
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">🎯 Why CSS Modules is Best:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>One file to edit:</strong> Just change theme.module.css</li>
            <li><strong>No conflicts:</strong> Scoped class names</li>
            <li><strong>Type-safe:</strong> TypeScript support</li>
            <li><strong>No build required:</strong> Changes apply immediately</li>
            <li><strong>Responsive:</strong> Media queries included</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
