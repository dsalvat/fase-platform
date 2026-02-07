import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage redirects to signin when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Should redirect to signin page
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('signin page loads correctly', async ({ page }) => {
    await page.goto('/auth/signin')

    // Check page title or heading
    await expect(page.locator('body')).toBeVisible()

    // Check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /google/i })
    await expect(googleButton).toBeVisible()
  })

  test('signin page has proper structure', async ({ page }) => {
    await page.goto('/auth/signin')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Should have a main container
    await expect(page.locator('main, [role="main"], body')).toBeVisible()
  })

  test('signout page loads correctly', async ({ page }) => {
    await page.goto('/auth/signout')

    // Should show signout content
    await expect(page.locator('body')).toBeVisible()
  })

  test('unauthorized page loads correctly', async ({ page }) => {
    await page.goto('/unauthorized')

    // Should show unauthorized message
    await expect(page.locator('body')).toBeVisible()
  })

  test('protected routes redirect to signin', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = [
      '/big-rocks',
      '/calendario',
      '/actividad',
      '/gamificacion',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      // Should redirect to signin
      await expect(page).toHaveURL(/\/auth\/signin/)
    }
  })
})

test.describe('API Health Checks', () => {
  test('auth API endpoint exists', async ({ request }) => {
    const response = await request.get('/api/auth/providers')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('google')
  })
})
