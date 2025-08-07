'use client';

/**
 * Mobile OAuth utilities for handling OAuth flows on mobile devices
 */

export interface MobileOAuthConfig {
  provider: string;
  callbackUrl: string;
  redirectMethod?: 'replace' | 'push';
  closeOnSuccess?: boolean;
}

/**
 * Detects if the current environment is a mobile browser
 */
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
}

/**
 * Detects if the current environment is iOS Safari
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  
  return isIOS && isSafari;
}

/**
 * Detects if the current environment is Android Chrome
 */
export function isAndroidChrome(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
  
  return isAndroid && isChrome;
}

/**
 * Handles mobile-specific OAuth redirects
 */
export function handleMobileOAuthRedirect(config: MobileOAuthConfig): void {
  const { callbackUrl, redirectMethod = 'replace', closeOnSuccess = true } = config;
  
  // Check if we're in a popup or iframe (common in OAuth flows)
  const isPopup = window.opener !== null;
  const isIframe = window.parent !== window;
  
  if (isPopup && closeOnSuccess) {
    // If we're in a popup, close it and notify the parent
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'oauth_success', 
        provider: config.provider,
        url: callbackUrl 
      }, '*');
      window.close();
    }
    return;
  }
  
  if (isIframe && closeOnSuccess) {
    // If we're in an iframe, notify the parent
    window.parent.postMessage({ 
      type: 'oauth_success', 
      provider: config.provider,
      url: callbackUrl 
    }, '*');
    return;
  }
  
  // Standard redirect
  if (redirectMethod === 'replace') {
    window.location.replace(callbackUrl);
  } else {
    window.location.href = callbackUrl;
  }
}

/**
 * Creates mobile-optimized OAuth parameters
 */
export function getMobileOAuthParams(): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Add mobile-specific parameters
  if (isMobileBrowser()) {
    params.display = 'touch';
    params.mobile = '1';
  }
  
  // iOS Safari specific optimizations
  if (isIOSSafari()) {
    params.ios_safari = '1';
    // Prevent iOS Safari from showing the address bar
    params.minimal_ui = '1';
  }
  
  // Android Chrome specific optimizations
  if (isAndroidChrome()) {
    params.android_chrome = '1';
  }
  
  return params;
}

/**
 * Handles mobile OAuth popup/redirect strategy
 */
export function initiateMobileOAuth(
  provider: string, 
  authUrl: string, 
  options: {
    usePopup?: boolean;
    popupWidth?: number;
    popupHeight?: number;
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
  } = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const {
      usePopup = false,
      popupWidth = 500,
      popupHeight = 600,
      onSuccess,
      onError
    } = options;
    
    // On mobile, prefer full redirect over popup for better UX
    if (isMobileBrowser() && !usePopup) {
      // Store callback handlers in sessionStorage for after redirect
      if (onSuccess || onError) {
        sessionStorage.setItem('oauth_callbacks', JSON.stringify({
          provider,
          hasCallbacks: true
        }));
      }
      
      // Add mobile-specific parameters
      const mobileParams = getMobileOAuthParams();
      const url = new URL(authUrl);
      Object.entries(mobileParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      
      window.location.href = url.toString();
      return;
    }
    
    // Desktop or forced popup mode
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;
    
    const popup = window.open(
      authUrl,
      `oauth_${provider}`,
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    
    if (!popup) {
      const error = new Error('Popup blocked');
      onError?.(error);
      reject(error);
      return;
    }
    
    // Listen for messages from the popup
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_success' && event.data?.provider === provider) {
        window.removeEventListener('message', messageHandler);
        popup.close();
        onSuccess?.(event.data);
        resolve(event.data);
      }
      
      if (event.data?.type === 'oauth_error' && event.data?.provider === provider) {
        window.removeEventListener('message', messageHandler);
        popup.close();
        onError?.(event.data.error);
        reject(event.data.error);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        const error = new Error('OAuth cancelled by user');
        onError?.(error);
        reject(error);
      }
    }, 1000);
  });
}

/**
 * Handles OAuth callback on mobile devices
 */
export function handleMobileOAuthCallback(): void {
  if (typeof window === 'undefined') return;
  
  // Check if we have stored callback information
  const callbackInfo = sessionStorage.getItem('oauth_callbacks');
  if (!callbackInfo) return;
  
  try {
    const { provider, hasCallbacks } = JSON.parse(callbackInfo);
    
    if (hasCallbacks) {
      // Clear the stored callback info
      sessionStorage.removeItem('oauth_callbacks');
      
      // Dispatch a custom event that the app can listen to
      window.dispatchEvent(new CustomEvent('mobile_oauth_success', {
        detail: { provider, url: window.location.href }
      }));
    }
  } catch (error) {
    console.error('Error handling mobile OAuth callback:', error);
  }
}

/**
 * Sets up mobile OAuth callback listener
 */
export function setupMobileOAuthListener(
  onSuccess?: (provider: string, url: string) => void,
  onError?: (error: any) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const successHandler = (event: CustomEvent) => {
    onSuccess?.(event.detail.provider, event.detail.url);
  };
  
  const errorHandler = (event: CustomEvent) => {
    onError?.(event.detail.error);
  };
  
  window.addEventListener('mobile_oauth_success', successHandler as EventListener);
  window.addEventListener('mobile_oauth_error', errorHandler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('mobile_oauth_success', successHandler as EventListener);
    window.removeEventListener('mobile_oauth_error', errorHandler as EventListener);
  };
}

/**
 * Mobile-specific viewport meta tag management
 */
export function optimizeViewportForAuth(): () => void {
  if (typeof document === 'undefined') return () => {};
  
  const viewport = document.querySelector('meta[name="viewport"]');
  const originalContent = viewport?.getAttribute('content') || '';
  
  // Optimize viewport for mobile auth
  if (viewport && isMobileBrowser()) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
  
  // Return cleanup function
  return () => {
    if (viewport && originalContent) {
      viewport.setAttribute('content', originalContent);
    }
  };
}