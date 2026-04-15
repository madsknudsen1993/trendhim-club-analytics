const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// All dashboard tabs with their values and labels
const TABS = [
  { value: 'executive-summary', label: '01-Executive-Summary' },
  { value: 'conclusion', label: '02-Conclusion' },
  { value: 'returning-orders', label: '03-Returning-Orders' },
  { value: 'purchase-frequency', label: '04-Purchase-Frequency' },
  { value: 'loyalty-progression', label: '05-Loyalty-Progression' },
  { value: 'cashback-impact', label: '06-Cashback-Impact' },
  { value: 'before-after', label: '07-Before-After-Cashback' },
  { value: 'seasonal', label: '08-Seasonal-Patterns' },
  { value: 'aov', label: '09-Average-Order-Value' },
  { value: 'profit', label: '10-Order-Profit' },
  { value: 'roi', label: '11-Program-ROI' },
  { value: 'break-even', label: '12-Break-Even-Analysis' },
  { value: 'ghost-members', label: '13-Ghost-Members' },
  { value: 'investigations', label: '14-Further-Investigations' },
  { value: 'order-history', label: '15-Order-History' },
  { value: 'data', label: '16-Data-Source' },
  { value: 'ceo-qa', label: '17-CEO-QA' },
];

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'exports', `dashboard-export-${new Date().toISOString().split('T')[0]}`);

async function exportDashboard() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\nExporting dashboard to: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    // First, go to the base URL and wait for load
    console.log('Loading dashboard...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000); // Extra wait for hydration

    for (const tab of TABS) {
      console.log(`Exporting: ${tab.label}...`);

      try {
        // Click on the tab
        const tabSelector = `[data-value="${tab.value}"], [value="${tab.value}"], button:has-text("${tab.value}")`;

        // Try to find and click the tab trigger
        const tabTrigger = await page.$(`button[value="${tab.value}"]`);
        if (tabTrigger) {
          await tabTrigger.click();
        } else {
          // Alternative: try clicking by text content
          const allButtons = await page.$$('button[role="tab"]');
          for (const btn of allButtons) {
            const btnText = await btn.textContent();
            if (btnText && btnText.toLowerCase().includes(tab.value.replace(/-/g, ' ').toLowerCase())) {
              await btn.click();
              break;
            }
          }
        }

        // Wait for content to load
        await page.waitForTimeout(1500);

        // Scroll to top
        await page.evaluate(() => window.scrollTo(0, 0));

        // Get the full page height for the PDF
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

        // Export as PDF
        const pdfPath = path.join(OUTPUT_DIR, `${tab.label}.pdf`);
        await page.pdf({
          path: pdfPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
          scale: 0.8,
        });

        // Also export as PNG screenshot (full page)
        const pngPath = path.join(OUTPUT_DIR, `${tab.label}.png`);
        await page.screenshot({
          path: pngPath,
          fullPage: true,
        });

        console.log(`  ✓ Saved PDF and PNG`);

      } catch (tabError) {
        console.error(`  ✗ Error exporting ${tab.label}:`, tabError.message);
      }
    }

    console.log(`\n✅ Export complete! Files saved to:\n${OUTPUT_DIR}\n`);

  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the export
exportDashboard().catch(console.error);
