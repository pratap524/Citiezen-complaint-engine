import { useLayoutEffect } from 'react';

export default function usePageStyle(href) {
  useLayoutEffect(() => {
    if (!href) {
      return undefined;
    }

    document.documentElement.removeAttribute('data-route-style-ready');

    const styleId = `page-style-${href.replace(/[^a-z0-9]/gi, '-')}`;
    const activeStyleId = document.documentElement.getAttribute('data-active-page-style-id');
    let linkElement = document.getElementById(styleId);

    const activateStyle = () => {
      linkElement.disabled = false;
      document.documentElement.setAttribute('data-active-page-style-id', styleId);

      if (activeStyleId && activeStyleId !== styleId) {
        const previousStyle = document.getElementById(activeStyleId);
        if (previousStyle) {
          previousStyle.disabled = true;
        }
      }

      document.documentElement.setAttribute('data-route-style-ready', 'true');
    };

    if (!linkElement) {
      const preloadedStyle = document.querySelector(`link[rel="preload"][as="style"][href="${href}"]`);

      if (preloadedStyle) {
        linkElement = preloadedStyle.cloneNode();
        linkElement.rel = 'stylesheet';
      } else {
        linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = href;
      }

      linkElement.id = styleId;
      linkElement.disabled = true;
      linkElement.onload = activateStyle;
      document.head.appendChild(linkElement);
    } else if (linkElement.sheet) {
      activateStyle();
    } else {
      linkElement.onload = activateStyle;
    }

    const revealTimeout = window.setTimeout(() => {
      document.documentElement.setAttribute('data-route-style-ready', 'true');
    }, 2500);

    return () => {
      window.clearTimeout(revealTimeout);
    };
  }, [href]);
}
