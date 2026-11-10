import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    locale: 'zh-CN',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command:
      'tools\\node-lts\\node.exe node_modules\\vite\\bin\\vite.js --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
