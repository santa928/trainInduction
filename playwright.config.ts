import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 80000,
  expect: { timeout: 12000 },
  workers: 1,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173/trainInduction/",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:4173/trainInduction/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    deviceScaleFactor: 1,
  },
  projects: [
    {
      name: "chromium-touch",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        deviceScaleFactor: 1,
      },
    },
    {
      name: "webkit-touch",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
        deviceScaleFactor: 1,
      },
    },
  ],
});
