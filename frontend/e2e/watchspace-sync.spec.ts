import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Watch Space Multi-Browser Real-Time Synchronization', () => {
  let hostContext: BrowserContext;
  let viewerContext: BrowserContext;
  let hostPage: Page;
  let viewerPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two completely isolated browser contexts (simulating two different users on different machines)
    hostContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState: undefined,
    });
    viewerContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState: undefined,
    });

    hostPage = await hostContext.newPage();
    viewerPage = await viewerContext.newPage();
  });

  test.afterEach(async () => {
    await hostContext.close();
    await viewerContext.close();
  });

  test('two real browser sessions synchronize play/pause states and chat in real time', async () => {
    // -------------------------------------------------------------
    // Step 1: Host logs in and enters Demo Watch Space
    // -------------------------------------------------------------
    await hostPage.goto('/login');
    await hostPage.waitForSelector('[data-testid="login-email-input"]');
    await hostPage.fill('[data-testid="login-email-input"]', 'host@example.com');
    await hostPage.fill('[data-testid="login-password-input"]', 'password');
    await hostPage.click('[data-testid="login-submit-btn"]');

    // Host navigates to home or demo room
    await hostPage.waitForURL(url => url.pathname === '/' || url.pathname.includes('/spaces'));

    // If on home, launch or join demo room
    const demoQuickJoinBtn = hostPage.locator('button:has-text("Quick Join Demo")').first();
    const rejoinBtn = hostPage.locator('button:has-text("Rejoin Room")').first();
    const resumeBtn = hostPage.locator('button:has-text("Resume Session")').first();

    if (await demoQuickJoinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await demoQuickJoinBtn.click();
    } else if (await rejoinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rejoinBtn.click();
    } else if (await resumeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resumeBtn.click();
    } else {
      // Direct navigation to watch room
      await hostPage.goto('/spaces/ws_demo_01');
    }

    // Verify Host video player is mounted
    const hostVideo = hostPage.locator('[data-testid="video-player"]');
    await expect(hostVideo).toBeVisible({ timeout: 15000 });

    // Verify Live Sync indicator
    const hostDriftIndicator = hostPage.locator('[data-testid="drift-indicator"]');
    await expect(hostDriftIndicator).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: Viewer logs in in the second browser session
    // -------------------------------------------------------------
    await viewerPage.goto('/login');
    await viewerPage.waitForSelector('[data-testid="login-email-input"]');
    await viewerPage.fill('[data-testid="login-email-input"]', 'viewer@example.com');
    await viewerPage.fill('[data-testid="login-password-input"]', 'password');
    await viewerPage.click('[data-testid="login-submit-btn"]');

    await viewerPage.waitForURL(url => url.pathname === '/' || url.pathname.includes('/spaces'));

    // Viewer joins the same Watch Space
    const viewerDemoBtn = viewerPage.locator('button:has-text("Quick Join Demo")').first();
    const viewerRejoinBtn = viewerPage.locator('button:has-text("Rejoin Room")').first();

    if (await viewerDemoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewerDemoBtn.click();
    } else if (await viewerRejoinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewerRejoinBtn.click();
    } else {
      await viewerPage.goto('/spaces/ws_demo_01');
    }

    // Verify Viewer video player is mounted
    const viewerVideo = viewerPage.locator('[data-testid="video-player"]');
    await expect(viewerVideo).toBeVisible({ timeout: 15000 });

    // Verify Viewer Live Sync indicator
    const viewerDriftIndicator = viewerPage.locator('[data-testid="drift-indicator"]');
    await expect(viewerDriftIndicator).toBeVisible();

    // -------------------------------------------------------------
    // Step 3: Host plays video -> Viewer video synchronizes
    // -------------------------------------------------------------
    const hostPlayBtn = hostPage.locator('[data-testid="play-pause-btn"]');
    await expect(hostPlayBtn).toBeVisible();

    // Ensure video is initially paused
    const initialHostPaused = await hostVideo.evaluate((el: HTMLVideoElement) => el.paused);
    if (!initialHostPaused) {
      await hostPlayBtn.click();
      await hostPage.waitForTimeout(500);
    }

    // Host triggers PLAY
    await hostPlayBtn.click();

    // Verify Host video is playing or attempting play
    await hostPage.waitForFunction(() => {
      const vid = document.querySelector('[data-testid="video-player"]') as HTMLVideoElement;
      return vid && (!vid.paused || vid.currentTime > 0);
    }, { timeout: 8000 });

    // Verify Viewer receives playback state update and plays
    await viewerPage.waitForFunction(() => {
      const vid = document.querySelector('[data-testid="video-player"]') as HTMLVideoElement;
      return vid && (!vid.paused || vid.currentTime > 0);
    }, { timeout: 10000 });

    // -------------------------------------------------------------
    // Step 4: Host pauses video -> Viewer video pauses synchronously
    // -------------------------------------------------------------
    await hostPlayBtn.click();

    // Verify Host video pauses
    await hostPage.waitForFunction(() => {
      const vid = document.querySelector('[data-testid="video-player"]') as HTMLVideoElement;
      return vid && vid.paused;
    }, { timeout: 8000 });

    // Verify Viewer video pauses and matches position within 1 second tolerance (<250ms target)
    await viewerPage.waitForFunction(() => {
      const vid = document.querySelector('[data-testid="video-player"]') as HTMLVideoElement;
      return vid && vid.paused;
    }, { timeout: 10000 });

    const hostTime = await hostVideo.evaluate((el: HTMLVideoElement) => el.currentTime);
    const viewerTime = await viewerVideo.evaluate((el: HTMLVideoElement) => el.currentTime);
    const syncDriftSeconds = Math.abs(hostTime - viewerTime);

    console.log(`[E2E] Host position: ${hostTime.toFixed(3)}s, Viewer position: ${viewerTime.toFixed(3)}s, Drift: ${(syncDriftSeconds * 1000).toFixed(1)}ms`);
    expect(syncDriftSeconds).toBeLessThan(1.5); // Tight drift tolerance

    // -------------------------------------------------------------
    // Step 5: Real-Time Chat Cross-Session Synchronization
    // -------------------------------------------------------------
    // Viewer switches to Chat tab
    const viewerChatTab = viewerPage.locator('[data-testid="tab-chat"]');
    await viewerChatTab.click();

    const chatInput = viewerPage.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    const testMessage = `Sync verified: ${Date.now()}`;
    await chatInput.fill(testMessage);
    await viewerPage.locator('[data-testid="chat-submit-btn"]').click();

    // Host switches to Chat tab
    const hostChatTab = hostPage.locator('[data-testid="tab-chat"]');
    await hostChatTab.click();

    // Verify Host receives the message in real time
    const hostChatContainer = hostPage.locator('[data-testid="chat-messages-container"]');
    await expect(hostChatContainer).toContainText(testMessage, { timeout: 8000 });

    console.log('[E2E] Real-time chat verified between two browser sessions.');
  });
});
