import { type Page, Browser, BrowserContext } from 'playwright';
import { v4 as uuidv4 } from 'uuid';

export interface DeviceProfile {
  id: string;
  name: string;
  category: 'phone' | 'tablet' | 'watch' | 'tv';
  brand: string;
  model: string;
  viewport: {
    width: number;
    height: number;
  };
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  userAgent: string;
  features: {
    hasTouch: boolean;
    isMobile: boolean;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    maxTouchPoints: number;
  };
  capabilities: {
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
    ambientLight: boolean;
    proximity: boolean;
  };
  network: {
    effectiveType: '2g' | '3g' | '4g' | '5g';
    downlink: number; // Mbps
    rtt: number; // ms
  };
  battery: {
    charging: boolean;
    level: number; // 0-1
    chargingTime?: number;
    dischargingTime?: number;
  };
  orientation: {
    type: 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';
    angle: number;
  };
}

export interface TouchEvent {
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  touches: Array<{
    identifier: number;
    clientX: number;
    clientY: number;
    force?: number;
    radiusX?: number;
    radiusY?: number;
  }>;
  timestamp: number;
}

export interface GesturePattern {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate' | 'scroll';
  duration: number;
  coordinates: Array<{ x: number; y: number; timestamp: number }>;
  pressure?: number[];
  velocity?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  orientation?: 'portrait' | 'landscape';
  description: string;
}

export interface ResponsiveTestSuite {
  id: string;
  name: string;
  breakpoints: ResponsiveBreakpoint[];
  devices: string[]; // Device profile IDs
  testCases: Array<{
    name: string;
    url: string;
    actions: Array<{
      type: 'click' | 'scroll' | 'gesture' | 'wait' | 'screenshot';
      selector?: string;
      gesture?: GesturePattern;
      duration?: number;
    }>;
    assertions: Array<{
      type: 'visible' | 'hidden' | 'text' | 'attribute' | 'css';
      selector: string;
      expected: any;
      breakpoints?: string[];
    }>;
  }>;
}

export class MobileDeviceEmulator {
  private deviceProfiles: Map<string, DeviceProfile> = new Map();
  private activeSessions: Map<string, {
    page: Page;
    profile: DeviceProfile;
    emulationState: any;
  }> = new Map();

  constructor() {
    this.initializeDeviceProfiles();
  }

  // Device Profile Management
  private initializeDeviceProfiles(): void {
    const profiles: DeviceProfile[] = [
      // Popular iPhones
      {
        id: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        category: 'phone',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        viewport: { width: 393, height: 852 },
        screen: { width: 1179, height: 2556, pixelRatio: 3 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        features: {
          hasTouch: true,
          isMobile: true,
          deviceMemory: 8,
          hardwareConcurrency: 6,
          maxTouchPoints: 5
        },
        capabilities: {
          geolocation: true,
          camera: true,
          microphone: true,
          accelerometer: true,
          gyroscope: true,
          magnetometer: true,
          ambientLight: true,
          proximity: true
        },
        network: {
          effectiveType: '5g',
          downlink: 100,
          rtt: 50
        },
        battery: {
          charging: false,
          level: 0.85
        },
        orientation: {
          type: 'portrait-primary',
          angle: 0
        }
      },
      {
        id: 'iphone-se',
        name: 'iPhone SE (3rd generation)',
        category: 'phone',
        brand: 'Apple',
        model: 'iPhone SE',
        viewport: { width: 375, height: 667 },
        screen: { width: 750, height: 1334, pixelRatio: 2 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        features: {
          hasTouch: true,
          isMobile: true,
          deviceMemory: 4,
          hardwareConcurrency: 4,
          maxTouchPoints: 5
        },
        capabilities: {
          geolocation: true,
          camera: true,
          microphone: true,
          accelerometer: true,
          gyroscope: true,
          magnetometer: true,
          ambientLight: false,
          proximity: true
        },
        network: {
          effectiveType: '4g',
          downlink: 50,
          rtt: 100
        },
        battery: {
          charging: true,
          level: 0.65
        },
        orientation: {
          type: 'portrait-primary',
          angle: 0
        }
      },
      // Popular Android devices
      {
        id: 'samsung-galaxy-s24',
        name: 'Samsung Galaxy S24',
        category: 'phone',
        brand: 'Samsung',
        model: 'Galaxy S24',
        viewport: { width: 360, height: 780 },
        screen: { width: 1080, height: 2340, pixelRatio: 3 },
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        features: {
          hasTouch: true,
          isMobile: true,
          deviceMemory: 8,
          hardwareConcurrency: 8,
          maxTouchPoints: 10
        },
        capabilities: {
          geolocation: true,
          camera: true,
          microphone: true,
          accelerometer: true,
          gyroscope: true,
          magnetometer: true,
          ambientLight: true,
          proximity: true
        },
        network: {
          effectiveType: '5g',
          downlink: 120,
          rtt: 40
        },
        battery: {
          charging: false,
          level: 0.72
        },
        orientation: {
          type: 'portrait-primary',
          angle: 0
        }
      },
      {
        id: 'pixel-8',
        name: 'Google Pixel 8',
        category: 'phone',
        brand: 'Google',
        model: 'Pixel 8',
        viewport: { width: 412, height: 915 },
        screen: { width: 1344, height: 2992, pixelRatio: 2.625 },
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        features: {
          hasTouch: true,
          isMobile: true,
          deviceMemory: 8,
          hardwareConcurrency: 8,
          maxTouchPoints: 10
        },
        capabilities: {
          geolocation: true,
          camera: true,
          microphone: true,
          accelerometer: true,
          gyroscope: true,
          magnetometer: true,
          ambientLight: true,
          proximity: true
        },
        network: {
          effectiveType: '5g',
          downlink: 90,
          rtt: 60
        },
        battery: {
          charging: false,
          level: 0.58
        },
        orientation: {
          type: 'portrait-primary',
          angle: 0
        }
      },
      // Tablets
      {
        id: 'ipad-pro-12',
        name: 'iPad Pro 12.9"',
        category: 'tablet',
        brand: 'Apple',
        model: 'iPad Pro',
        viewport: { width: 1024, height: 1366 },
        screen: { width: 2048, height: 2732, pixelRatio: 2 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        features: {
          hasTouch: true,
          isMobile: false,
          deviceMemory: 16,
          hardwareConcurrency: 8,
          maxTouchPoints: 5
        },
        capabilities: {
          geolocation: true,
          camera: true,
          microphone: true,
          accelerometer: true,
          gyroscope: true,
          magnetometer: true,
          ambientLight: true,
          proximity: false
        },
        network: {
          effectiveType: '5g',
          downlink: 150,
          rtt: 30
        },
        battery: {
          charging: true,
          level: 0.91
        },
        orientation: {
          type: 'landscape-primary',
          angle: 90
        }
      }
    ];

    profiles.forEach(profile => {
      this.deviceProfiles.set(profile.id, profile);
    });
  }

  // Device Emulation
  async emulateDevice(page: Page, deviceId: string): Promise<string> {
    const profile = this.deviceProfiles.get(deviceId);
    if (!profile) {
      throw new Error(`Device profile ${deviceId} not found`);
    }

    const sessionId = uuidv4();

    // Set viewport
    await page.setViewportSize(profile.viewport);

    // Set user agent
    // Set user agent - method name varies by Playwright version
    try {
      // @ts-ignore - setUserAgent method availability varies
      await page.setUserAgent(profile.userAgent);
    } catch {
      // Fallback to context-level user agent setting
      await page.context().addInitScript(`
        Object.defineProperty(navigator, 'userAgent', {
          get: () => '${profile.userAgent}'
        });
      `);
    }

    // Emulate device features
    await this.emulateDeviceFeatures(page, profile);

    // Set up touch emulation
    if (profile.features.hasTouch) {
      await this.enableTouchEmulation(page, profile);
    }

    // Emulate device capabilities
    await this.emulateDeviceCapabilities(page, profile);

    // Set up network conditions
    await this.emulateNetworkConditions(page, profile);

    // Set up device orientation
    await this.emulateOrientation(page, profile);

    this.activeSessions.set(sessionId, {
      page,
      profile,
      emulationState: {
        touches: new Map(),
        gestures: [],
        orientation: profile.orientation
      }
    });

    return sessionId;
  }

  private async emulateDeviceFeatures(page: Page, profile: DeviceProfile): Promise<void> {
    await page.addInitScript(`
      // Override navigator properties
      Object.defineProperty(navigator, 'userAgent', {
        get: () => '${profile.userAgent}'
      });

      Object.defineProperty(navigator, 'platform', {
        get: () => '${profile.brand} ${profile.model}'
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => ${profile.features.deviceMemory || 4}
      });

      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => ${profile.features.hardwareConcurrency || 4}
      });

      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => ${profile.features.maxTouchPoints}
      });

      // Screen properties
      Object.defineProperty(screen, 'width', {
        get: () => ${profile.screen.width}
      });

      Object.defineProperty(screen, 'height', {
        get: () => ${profile.screen.height}
      });

      Object.defineProperty(screen, 'pixelDepth', {
        get: () => 24
      });

      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24
      });

      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => ${profile.screen.pixelRatio}
      });

      // Mobile-specific properties
      Object.defineProperty(window, 'ontouchstart', {
        get: () => ${profile.features.hasTouch ? 'function() {}' : 'undefined'}
      });
    `);
  }

  private async enableTouchEmulation(page: Page, profile: DeviceProfile): Promise<void> {
    await page.addInitScript(`
      // Touch event simulation
      let touchIdentifier = 0;
      const activeTouches = new Map();

      function createTouch(x, y, identifier) {
        return {
          identifier: identifier,
          target: document.elementFromPoint(x, y) || document.body,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          screenX: x,
          screenY: y,
          radiusX: 10 + Math.random() * 5,
          radiusY: 10 + Math.random() * 5,
          rotationAngle: Math.random() * 360,
          force: 0.5 + Math.random() * 0.5
        };
      }

      function createTouchEvent(type, touches, changedTouches) {
        const touchEvent = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(touchEvent, 'touches', { value: touches });
        Object.defineProperty(touchEvent, 'changedTouches', { value: changedTouches });
        Object.defineProperty(touchEvent, 'targetTouches', { value: touches });
        return touchEvent;
      }

      // Override click to simulate touch
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click' && this !== document && this !== window) {
          // Add touch events before click
          originalAddEventListener.call(this, 'touchstart', function(e) {
            // Simulate touch start
          }, options);

          originalAddEventListener.call(this, 'touchend', function(e) {
            // Simulate touch end
          }, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    `);
  }

  private async emulateDeviceCapabilities(page: Page, profile: DeviceProfile): Promise<void> {
    await page.addInitScript(`
      // Geolocation API
      if (${profile.capabilities.geolocation}) {
        navigator.geolocation = {
          getCurrentPosition: function(success, error, options) {
            setTimeout(() => {
              success({
                coords: {
                  latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
                  longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
                  accuracy: 10 + Math.random() * 20,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
            }, 100 + Math.random() * 500);
          },
          watchPosition: function(success, error, options) {
            return setInterval(() => {
              this.getCurrentPosition(success, error, options);
            }, 1000);
          },
          clearWatch: function(id) {
            clearInterval(id);
          }
        };
      }

      // Device Orientation API
      if (${profile.capabilities.accelerometer}) {
        window.DeviceOrientationEvent = function(type, eventInitDict) {
          const event = new Event(type);
          Object.assign(event, eventInitDict);
          return event;
        };

        // Simulate device orientation changes
        setInterval(() => {
          const event = new DeviceOrientationEvent('deviceorientation', {
            alpha: ${profile.orientation.angle} + Math.random() * 2 - 1,
            beta: Math.random() * 4 - 2,
            gamma: Math.random() * 4 - 2,
            absolute: true
          });
          window.dispatchEvent(event);
        }, 100);
      }

      // Battery API
      if ('getBattery' in navigator) {
        navigator.getBattery = function() {
          return Promise.resolve({
            charging: ${profile.battery.charging},
            chargingTime: ${profile.battery.chargingTime || 'Infinity'},
            dischargingTime: ${profile.battery.dischargingTime || 'Infinity'},
            level: ${profile.battery.level},
            addEventListener: function() {},
            removeEventListener: function() {}
          });
        };
      }

      // Network Information API
      if ('connection' in navigator) {
        Object.defineProperty(navigator, 'connection', {
          value: {
            effectiveType: '${profile.network.effectiveType}',
            downlink: ${profile.network.downlink},
            rtt: ${profile.network.rtt},
            saveData: false,
            addEventListener: function() {},
            removeEventListener: function() {}
          }
        });
      }
    `);
  }

  private async emulateNetworkConditions(page: Page, profile: DeviceProfile): Promise<void> {
    // Simulate network throttling based on device profile
    const networkProfiles = {
      '2g': { downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024, latency: 300 },
      '3g': { downloadThroughput: 500 * 1024, uploadThroughput: 250 * 1024, latency: 150 },
      '4g': { downloadThroughput: 5 * 1024 * 1024, uploadThroughput: 2 * 1024 * 1024, latency: 50 },
      '5g': { downloadThroughput: 20 * 1024 * 1024, uploadThroughput: 10 * 1024 * 1024, latency: 20 }
    };

    const networkProfile = networkProfiles[profile.network.effectiveType];

    // Note: This would require CDP (Chrome DevTools Protocol) in a real implementation
    // For now, we'll simulate through request delays
    await page.route('**/*', async (route) => {
      const delay = networkProfile.latency + Math.random() * 50;
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
  }

  private async emulateOrientation(page: Page, profile: DeviceProfile): Promise<void> {
    await page.addInitScript(`
      // Screen orientation API
      Object.defineProperty(screen, 'orientation', {
        value: {
          type: '${profile.orientation.type}',
          angle: ${profile.orientation.angle},
          lock: function() { return Promise.resolve(); },
          unlock: function() {},
          addEventListener: function() {},
          removeEventListener: function() {}
        }
      });

      // Window orientation (legacy)
      Object.defineProperty(window, 'orientation', {
        get: () => ${profile.orientation.angle}
      });
    `);
  }

  // Touch Gesture Simulation
  async simulateGesture(sessionId: string, gesture: GesturePattern): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { page } = session;

    switch (gesture.type) {
      case 'tap':
        await this.simulateTap(page, gesture);
        break;
      case 'double-tap':
        await this.simulateDoubleTap(page, gesture);
        break;
      case 'long-press':
        await this.simulateLongPress(page, gesture);
        break;
      case 'swipe':
        await this.simulateSwipe(page, gesture);
        break;
      case 'pinch':
        await this.simulatePinch(page, gesture);
        break;
      case 'scroll':
        await this.simulateScroll(page, gesture);
        break;
    }
  }

  private async simulateTap(page: Page, gesture: GesturePattern): Promise<void> {
    const { x, y } = gesture.coordinates[0];

    // Simulate touch with slight randomization
    const actualX = x + (Math.random() - 0.5) * 4;
    const actualY = y + (Math.random() - 0.5) * 4;

    await page.mouse.click(actualX, actualY, { delay: 50 + Math.random() * 50 });
  }

  private async simulateDoubleTap(page: Page, gesture: GesturePattern): Promise<void> {
    const { x, y } = gesture.coordinates[0];

    await page.mouse.click(x, y, { clickCount: 1 });
    await page.waitForTimeout(100 + Math.random() * 100);
    await page.mouse.click(x + Math.random() * 2 - 1, y + Math.random() * 2 - 1, { clickCount: 1 });
  }

  private async simulateLongPress(page: Page, gesture: GesturePattern): Promise<void> {
    const { x, y } = gesture.coordinates[0];

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(gesture.duration || 1000);
    await page.mouse.up();
  }

  private async simulateSwipe(page: Page, gesture: GesturePattern): Promise<void> {
    const coords = gesture.coordinates;
    if (coords.length < 2) return;

    const start = coords[0];
    const end = coords[coords.length - 1];

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();

    // Simulate curved movement
    for (let i = 1; i < coords.length; i++) {
      const coord = coords[i];
      const prevCoord = coords[i - 1];
      const timeDiff = coord.timestamp - prevCoord.timestamp;

      await page.mouse.move(coord.x, coord.y);
      await page.waitForTimeout(Math.max(1, timeDiff));
    }

    await page.mouse.up();
  }

  private async simulatePinch(page: Page, gesture: GesturePattern): Promise<void> {
    // Complex multi-touch gesture - simplified implementation
    const center = gesture.coordinates[Math.floor(gesture.coordinates.length / 2)];

    // Simulate zoom gesture using wheel events
    await page.mouse.move(center.x, center.y);
    await page.mouse.wheel(0, gesture.distance || 100);
  }

  private async simulateScroll(page: Page, gesture: GesturePattern): Promise<void> {
    const start = gesture.coordinates[0];
    const end = gesture.coordinates[gesture.coordinates.length - 1];

    const deltaY = end.y - start.y;
    const deltaX = end.x - start.x;

    await page.mouse.move(start.x, start.y);
    await page.mouse.wheel(deltaX, deltaY);
  }

  // Responsive Testing
  async runResponsiveTest(testSuite: ResponsiveTestSuite): Promise<{
    results: Array<{
      deviceId: string;
      breakpoint: string;
      testCase: string;
      success: boolean;
      screenshot?: string;
      errors: string[];
    }>;
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      devices: number;
      breakpoints: number;
    };
  }> {
    const results = [];
    let totalTests = 0;
    let passed = 0;
    let failed = 0;

    for (const deviceId of testSuite.devices) {
      const device = this.deviceProfiles.get(deviceId);
      if (!device) continue;

      for (const breakpoint of testSuite.breakpoints) {
        for (const testCase of testSuite.testCases) {
          totalTests++;

          try {
            const testResult = await this.runSingleTest(device, breakpoint, testCase);
            results.push({
              deviceId,
              breakpoint: breakpoint.name,
              testCase: testCase.name,
              success: testResult.success,
              screenshot: testResult.screenshot,
              errors: testResult.errors
            });

            if (testResult.success) passed++;
            else failed++;
          } catch (error) {
            results.push({
              deviceId,
              breakpoint: breakpoint.name,
              testCase: testCase.name,
              success: false,
              errors: [error instanceof Error ? error.message : String(error)]
            });
            failed++;
          }
        }
      }
    }

    return {
      results,
      summary: {
        totalTests,
        passed,
        failed,
        devices: testSuite.devices.length,
        breakpoints: testSuite.breakpoints.length
      }
    };
  }

  private async runSingleTest(device: DeviceProfile, breakpoint: ResponsiveBreakpoint, testCase: any): Promise<{
    success: boolean;
    screenshot?: string;
    errors: string[];
  }> {
    // This would be implemented with actual browser automation
    // For now, return a simulated result
    return {
      success: Math.random() > 0.2, // 80% success rate
      screenshot: `screenshot_${device.id}_${breakpoint.name}_${testCase.name}.png`,
      errors: Math.random() > 0.8 ? ['Simulated test error'] : []
    };
  }

  // Utility Methods
  getDeviceProfile(deviceId: string): DeviceProfile | undefined {
    return this.deviceProfiles.get(deviceId);
  }

  getAllDeviceProfiles(): DeviceProfile[] {
    return Array.from(this.deviceProfiles.values());
  }

  getDevicesByCategory(category: DeviceProfile['category']): DeviceProfile[] {
    return Array.from(this.deviceProfiles.values()).filter(device => device.category === category);
  }

  async rotateDevice(sessionId: string, orientation: DeviceProfile['orientation']): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const { page, profile } = session;

    // Update profile orientation
    profile.orientation = orientation;

    // Swap viewport dimensions for landscape/portrait
    if (orientation.type.includes('landscape')) {
      const temp = profile.viewport.width;
      profile.viewport.width = profile.viewport.height;
      profile.viewport.height = temp;
    }

    await page.setViewportSize(profile.viewport);

    // Trigger orientation change event
    await page.evaluate((newOrientation) => {
      window.dispatchEvent(new Event('orientationchange'));
      Object.defineProperty(screen, 'orientation', {
        value: { ...screen.orientation, ...newOrientation }
      });
    }, orientation);
  }

  async changeNetworkConditions(sessionId: string, effectiveType: DeviceProfile['network']['effectiveType']): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.profile.network.effectiveType = effectiveType;
    await this.emulateNetworkConditions(session.page, session.profile);
  }

  async destroySession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
  }

  // Default responsive breakpoints
  getDefaultBreakpoints(): ResponsiveBreakpoint[] {
    return [
      { name: 'mobile-small', minWidth: 0, maxWidth: 320, description: 'Small mobile devices' },
      { name: 'mobile', minWidth: 321, maxWidth: 480, description: 'Mobile devices' },
      { name: 'mobile-large', minWidth: 481, maxWidth: 768, description: 'Large mobile devices' },
      { name: 'tablet', minWidth: 769, maxWidth: 1024, description: 'Tablet devices' },
      { name: 'tablet-large', minWidth: 1025, maxWidth: 1280, description: 'Large tablets' },
      { name: 'desktop', minWidth: 1281, maxWidth: 1440, description: 'Desktop devices' },
      { name: 'desktop-large', minWidth: 1441, description: 'Large desktop screens' }
    ];
  }
}
