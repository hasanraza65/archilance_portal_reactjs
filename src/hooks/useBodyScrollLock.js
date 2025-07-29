import { useEffect } from 'react';

const useBodyScrollLock = () => {
  useEffect(() => {
    // Ye function body ke style changes ko dekhega
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          const body = document.body;
          const isLocked = body.style.overflow === 'hidden';

          if (isLocked) {
            // Scrollbar ki width calculate karein
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            // Body par utna hi padding-right add karein
            body.style.paddingRight = `${scrollbarWidth}px`;
          } else {
            // Jab overflow wapas aa jaaye, to padding hata dein
            body.style.paddingRight = '0px';
          }
        }
      });
    });

    // Body ke 'style' attribute par observer ko start karein
    observer.observe(document.body, {
      attributes: true, 
      attributeFilter: ['style'],
    });

    // Cleanup: Component unmount hone par observer ko band kar dein
    return () => {
      document.body.style.paddingRight = '0px'; // Make sure padding is removed on cleanup
      observer.disconnect();
    };
  }, []); // Yeh effect sirf ek baar component mount hone par chalega
};

export default useBodyScrollLock;