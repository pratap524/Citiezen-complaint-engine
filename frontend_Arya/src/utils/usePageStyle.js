import { useLayoutEffect } from 'react';

export default function usePageStyle(href) {
  useLayoutEffect(() => {
    if (!href) {
      return undefined;
    }

    document.documentElement.removeAttribute('data-route-style-ready');

    const styleId = `page-style-${href.replace(/[^a-z0-9]/gi, '-')}`;
    let linkElement = document.getElementById(styleId);

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
      linkElement.onload = () => {
        document.documentElement.setAttribute('data-route-style-ready', 'true');
      };
      document.head.appendChild(linkElement);
    } else {
      document.documentElement.setAttribute('data-route-style-ready', 'true');
    }

    const revealTimeout = window.setTimeout(() => {
      document.documentElement.setAttribute('data-route-style-ready', 'true');
    }, 2500);

    return () => {
      window.clearTimeout(revealTimeout);
      const current = document.getElementById(styleId);
      if (current) {
        current.remove();
      }
    };
  }, [href]);
}
