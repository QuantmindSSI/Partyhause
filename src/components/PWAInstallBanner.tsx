import { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Apple, Download, Share, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if matchMedia is available (not in test environments)
    if (!window.matchMedia) {
      setIsInstalled(true);
      return;
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else if (isDesktop) {
      setPlatform('desktop');
    }

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    
    if (!dismissed || Date.now() - dismissedTime > threeDaysInMs) {
      // Show banner after 5 seconds
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      if (!dismissed || Date.now() - dismissedTime > threeDaysInMs) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'android' && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show instructions for iOS or desktop without native prompt
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
        return <Apple className="w-6 h-6" />;
      case 'android':
        return <Smartphone className="w-6 h-6" />;
      case 'desktop':
        return <Monitor className="w-6 h-6" />;
      default:
        return <Download className="w-6 h-6" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'ios':
        return 'iPhone/iPad';
      case 'android':
        return 'Android';
      case 'desktop':
        return 'Desktop';
      default:
        return 'your device';
    }
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Main Banner */}
      <AnimatePresence>
        {showBanner && !showInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/95 via-black/90 to-transparent"
          >
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <img src="/partyhaus-icon.svg" alt="PartyHause" className="w-12 h-12" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Install PartyHause App
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    Get the full experience! Install our app for offline access, faster loading, and a native feel on your {getPlatformName()}.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 bg-white hover:bg-gray-100 text-indigo-600 font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {getPlatformIcon()}
                      <span>Install Now</span>
                    </button>
                    
                    <button
                      onClick={() => setShowInstructions(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors backdrop-blur-sm"
                    >
                      How?
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Works offline</span>
                    </div>
                    <span>•</span>
                    <span>5MB download</span>
                    <span>•</span>
                    <span>No app store needed</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      {getPlatformIcon()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Install on {getPlatformName()}
                      </h3>
                      <p className="text-white/80 text-sm">Follow these simple steps</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {platform === 'ios' && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Tap the Share button</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          Look for the share icon at the bottom of Safari (or top right on iPad)
                        </p>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                          <Share className="w-8 h-8 text-indigo-600" />
                          <span className="ml-2 text-gray-700 font-medium">Share Icon</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Scroll and find "Add to Home Screen"</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          In the share menu, scroll down until you see this option
                        </p>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xl">+</span>
                            </div>
                            <span className="text-gray-700 font-medium">Add to Home Screen</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Tap "Add" to confirm</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          You can customize the name if you'd like, then tap "Add"
                        </p>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white text-center">
                          <p className="font-semibold">PartyHause icon will appear on your home screen!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {platform === 'android' && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Tap "Install" in the banner</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          Chrome will show an install prompt automatically
                        </p>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                          <Download className="w-8 h-8 text-indigo-600" />
                          <span className="ml-2 text-gray-700 font-medium">Install App</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Or use the Chrome menu</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          Tap the three dots menu → "Install app" or "Add to Home screen"
                        </p>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                          <Menu className="w-8 h-8 text-indigo-600" />
                          <span className="ml-2 text-gray-700 font-medium">Chrome Menu</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Launch from your app drawer</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          PartyHause will appear with all your other apps
                        </p>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white text-center">
                          <p className="font-semibold">Enjoy the full app experience!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {platform === 'desktop' && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Look for the install icon</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          You'll see an install icon (⊕) in your browser's address bar
                        </p>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                          <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg px-4 py-2">
                            <span className="text-gray-500 text-sm">partyhause.vercel.app</span>
                            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                              <span className="text-white text-lg">⊕</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Click the install icon or use browser menu</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          Chrome/Edge: Menu (⋮) → "Install PartyHause"<br />
                          Brave: Menu → "Install PartyHause as app"
                        </p>
                        <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                          <Monitor className="w-8 h-8 text-indigo-600" />
                          <span className="ml-2 text-gray-700 font-medium">Install PartyHause</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">App opens in its own window</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          PartyHause will run as a standalone app, separate from your browser
                        </p>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white text-center">
                          <p className="font-semibold">Pin it to your taskbar for quick access!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 p-4 bg-indigo-50 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 mb-2">✨ Benefits of Installing</h4>
                  <ul className="space-y-2 text-sm text-indigo-700">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                      Works offline - access your events anytime
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                      Faster loading - instant startup
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                      Native feel - full screen, no browser UI
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                      Push notifications - stay updated (coming soon)
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-105"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
