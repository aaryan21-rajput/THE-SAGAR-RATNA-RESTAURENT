import { test, expect } from '@playwright/test';

test.describe('Sagar Ratna Full Restaurant Management E2E Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Set standard desktop viewport by default for all tests
    await page.setViewportSize({ width: 1280, height: 800 });

    // Listen to console errors and log them
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Console Error]: ${msg.text()}`);
      }
    });
  });

  test('01. Responsive Design Check', async ({ page }) => {
    console.log('--- Test 1: Responsive Design Check ---');
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Check that our 100% pure vegetarian text or category indicator is visible
    const vegBanner = page.locator('text=100% Pure Vegetarian Sagar Ratna');
    await expect(vegBanner).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'screenshots/09_responsive_mobile.png', fullPage: true });
    console.log('Mobile view responsive design verified.');
  });

  test('02. Admin Login', async ({ page }) => {
    console.log('--- Test 2: Admin Login ---');
    await page.goto('/#admin');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    
    // Click authorization button
    await page.click('button#admin-login-btn');
    
    // Verify dashboard dashboard visibility
    await page.waitForSelector('text=Administration Overview');
    await expect(page.locator('text=Administration Overview')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/01_admin_login_success.png' });
    console.log('Admin login verified successfully.');
  });

  test('03. Customer Ordering', async ({ page }) => {
    console.log('--- Test 3: Customer Ordering ---');
    // Open menu with table parameter loaded
    await page.goto('/?table=3');
    
    // Resiliently click the first available ADD TO CART button on the page
    const firstAddBtn = page.locator('button[id^="add-btn-"]').first();
    await firstAddBtn.waitFor({ state: 'visible' });
    const addBtnId = await firstAddBtn.getAttribute('id');
    console.log(`Dynamic selector matched button ID: ${addBtnId}`);
    await firstAddBtn.click();
    console.log('Added dynamic dish item to cart.');
    
    // Wait for and click floating checkout cart overlay button
    await page.waitForSelector('#floating-cart-btn');
    await page.click('#floating-cart-btn');
    console.log('Opened basket drawer.');
    
    // Populate guest name and fake contact
    await page.fill('input[placeholder="Aaryan Rajput"]', 'Playwright Tester');
    await page.fill('input[placeholder="+91 XXXXX XXXXX"]', '+91 9999911111');
    
    // Select Takeaway/Dine-In. Since we are on table 3, Dine-In is pre-selected and pre-filled!
    // Click submit order ("PLACE ORDER ONLINE") to trigger verification screen
    await page.click('#checkout-submit-btn');
    console.log('Dispatched checkout request to launch OTP panel.');
    
    // Read the generated OTP bypass code from the screen
    await page.waitForSelector('strong.tracking-wider');
    const otpCode = await page.locator('strong.tracking-wider').innerText();
    console.log(`Bypassing verification using simulator passcode: ${otpCode}`);
    
    // Fill the verification input
    await page.fill('input[placeholder="••••"]', otpCode);
    
    // Confirm order ("VERIFY OTP & CONFIRM ORDER")
    await page.click('#checkout-submit-btn');
    console.log('Submitted OTP code.');
    
    // Assert success screen
    await page.waitForSelector('text=Order Prepared!');
    await expect(page.locator('text=Order Prepared!')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/02_customer_order_success.png' });
    console.log('Customer ordering successfully completed.');
  });

  test('04. Table Booking & QR Management', async ({ page }) => {
    console.log('--- Test 4: Table Booking ---');
    // Log in as Admin
    await page.goto('/#admin');
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button#admin-login-btn');
    await page.waitForSelector('text=Administration Overview');
    
    // Click on Table QR Codes sidebar tab
    await page.click('button:has-text("Table QR Codes")');
    await page.waitForSelector('text=Table QR Self-Ordering Engine');
    
    // Click on Deploy New Table
    await page.click('button:has-text("Deploy New Table")');
    await page.waitForSelector('text=DEPLOY NEW RESTAURANT TABLE');
    
    // Fill Table identifier e.g. 15
    const tableNo = `15`;
    await page.fill('input[placeholder="e.g., 9"]', tableNo);
    
    // Launch/Deploy Table
    await page.click('button:has-text("AUTHORIZE AND LAUNCH TABLE")');
    console.log(`Successfully launched table #${tableNo}`);
    
    // Wait for modal to disappear or list to update
    await page.waitForSelector(`text=Table #${tableNo}`, { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/03_table_booking_deployed.png' });
    console.log('Table QR self-ordering setup verified.');
  });

  test('05. Inventory Alerts and Status Check', async ({ page }) => {
    console.log('--- Test 5: Inventory ---');
    // Log in as Admin
    await page.goto('/#admin');
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button#admin-login-btn');
    await page.waitForSelector('text=Administration Overview');
    
    // Scroll and check for Active Low Inventory Alerts box
    await page.waitForSelector('text=Active Low Inventory Alerts');
    await expect(page.locator('text=Active Low Inventory Alerts')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/04_inventory_alerts.png' });
    console.log('Inventory active alarms verified.');
  });

  test('06. Reports & Financial Insights', async ({ page }) => {
    console.log('--- Test 6: Reports ---');
    // Log in as Admin
    await page.goto('/#admin');
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button#admin-login-btn');
    await page.waitForSelector('text=Administration Overview');
    
    // Go to "Revenue Insights" tab
    await page.click('button:has-text("Revenue Insights")');
    await page.waitForSelector('text=Accounting & Revenue Analytics');
    await expect(page.locator('text=Accounting & Revenue Analytics')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/05_reports_revenue.png' });
    console.log('Accounting & financial report views verified.');
  });

  test('07. Kitchen Display (KDS)', async ({ page }) => {
    console.log('--- Test 7: Kitchen Display ---');
    // Log in as Admin
    await page.goto('/#admin');
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button#admin-login-btn');
    await page.waitForSelector('text=Administration Overview');
    
    // Go to "Kitchen Display (KDS)" tab
    await page.click('button:has-text("Kitchen Display (KDS)")');
    await page.waitForSelector('text=Kitchen Display System (KDS)');
    await expect(page.locator('text=Kitchen Display System (KDS)')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/06_kitchen_display_system.png' });
    console.log('Kitchen Display System (KDS) verified.');
  });

  test('08. Billing & Order Settle Management', async ({ page }) => {
    console.log('--- Test 8: Billing ---');
    // Log in as Admin
    await page.goto('/#admin');
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button#admin-login-btn');
    await page.waitForSelector('text=Administration Overview');
    
    // Go to "Order Management" tab
    await page.click('button:has-text("Order Management")');
    await page.waitForSelector('text=Kitchen Order Dispatcher');
    await expect(page.locator('text=Kitchen Order Dispatcher')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/07_billing_orders.png' });
    console.log('Billing & Order Dispatch Desk verified.');
  });

  test('09. Admin Logout', async ({ page }) => {
    console.log('--- Test 9: Admin Logout ---');
    // Log in as Admin
    await page.goto('/#admin');
    await page.fill('input[type="email"]', 'aaryanrajputofficial@gmail.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button#admin-login-btn');
    await page.waitForSelector('text=Administration Overview');
    
    // Click manual Logout button
    await page.click('button:has-text("Logout")');
    
    // Assert redirect back to admin login or home
    await page.waitForSelector('input[type="email"]');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/08_logout_success.png' });
    console.log('Admin logout completed successfully.');
  });

});
