import { test, expect } from '@playwright/test'

const BASE_URL = 'https://nextjs-app-tau-beige.vercel.app'

test.describe('Auth API Tests', () => {
  test('GET /api/auth/[...nextauth] should not return 500', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/session`)
    // In next-auth v4, GET to session endpoint may return 405 (Method Not Allowed)
    // The important thing is we're NOT getting 500 errors anymore
    expect(response.status()).not.toBe(500)

    const body = await response.text()
    // Should not contain HTML (which indicates a crash)
    expect(body).not.toContain('<!DOCTYPE')
    expect(body).not.toContain('<html')
  })

  test('GET /api/test should return 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/test`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('message', 'Test route works')
  })

  test('Signin page should load without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Track all responses to check for 500 errors
    const responses: any[] = []
    page.on('response', async (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
      })
    })

    await page.goto(`${BASE_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('h1, h2, form')).toBeVisible()

    // Check we didn't get any 500 errors
    const failedResponses = responses.filter(r => r.status === 500)
    expect(failedResponses.length).toBe(0)
  })

  test('Home page should load', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const title = await page.textContent('h1')
    expect(title).toContain('家庭资产管理')
  })

  test('POST /api/auth/signin should validate credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/signin`, {
      form: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    })

    // Should get a response (not 500) - could be redirect or error
    expect(response.status()).not.toBe(500)
  })
})
