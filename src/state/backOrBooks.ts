/**
 * The one way a screen leaves. A cold deep link (or a reload on web) opens a
 * screen with no history, where a plain `router.back()` does nothing: land
 * on Books instead. Every Back control and every "done, close this" path goes
 * through here; `backOrBooks.test.ts` fails if a file calls `.back()` itself.
 */
export type BackRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: '/actions') => void;
};

export const backOrBooks = (router: BackRouter): void => {
  if (router.canGoBack()) router.back();
  else router.replace('/actions');
};
