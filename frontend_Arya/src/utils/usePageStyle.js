import { useLayoutEffect } from 'react';

export default function usePageStyle(href) {
  useLayoutEffect(() => {
    if (!href) {
      return undefined;
    }

    document.documentElement.removeAttribute('data-route-style-ready');

    const styleId = `page-style-${href.replace(/[^a-z0-9]/gi, '-')}`;
    let linkElement = document.getElementById(styleId);
    let created = false;

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
      created = true;
    }

    const onReady = () => {
      document.documentElement.setAttribute('data-route-style-ready', 'true');
    };

    if (linkElement.sheet) {
      onReady();
    } else {
      linkElement.addEventListener('load', onReady, { once: true });
    }

    const revealTimeout = window.setTimeout(() => {
      document.documentElement.setAttribute('data-route-style-ready', 'true');
    }, 2500);

    return () => {
      window.clearTimeout(revealTimeout);
      linkElement.removeEventListener('load', onReady);
      if (created && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
      }
    };
  }, [href]);
}
