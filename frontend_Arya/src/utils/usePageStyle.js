import { useEffect } from 'react';

export default function usePageStyle(href) {
  useEffect(() => {
    if (!href) {
      return undefined;
    }

    const styleId = `page-style-${href.replace(/[^a-z0-9]/gi, '-')}`;
    let linkElement = document.getElementById(styleId);

    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = styleId;
      linkElement.rel = 'stylesheet';
      linkElement.href = href;
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
