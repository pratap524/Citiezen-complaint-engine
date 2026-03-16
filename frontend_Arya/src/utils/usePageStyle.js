import { useLayoutEffect } from 'react';

export default function usePageStyle(href) {
  useLayoutEffect(() => {
    if (!href) {
      return undefined;
    }

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
      document.head.appendChild(linkElement);
    }

    return () => {
      const current = document.getElementById(styleId);
      if (current) {
        current.remove();
      }
    };
  }, [href]);
}
