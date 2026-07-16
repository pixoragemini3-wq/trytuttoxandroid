/** Facebook, Instagram e altri browser in-app che gestiscono male history.pushState SPA. */
export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|FB_IAB|Line\/|Twitter|MicroMessenger|LinkedInApp/i.test(ua);
};