import { useEffect, useLayoutEffect, useRef } from 'react';

const GUARD = 'melonScreen';

// One in-app history entry. Title keeps the browser's normal Back behavior.
export function useAppBack(active: boolean, onBack: () => boolean) {
  const current = useRef({ active, onBack });
  useLayoutEffect(() => { current.current = { active, onBack }; });

  useEffect(() => {
    // A reload starts at the title, rather than reviving an old game guard.
    if (!current.current.active && history.state?.[GUARD]) {
      history.replaceState({ ...history.state, [GUARD]: false }, '');
    }
    const handlePop = () => {
      if (!current.current.active || history.state?.[GUARD]) return;
      if (current.current.onBack()) {
        history.pushState({ ...history.state, [GUARD]: true }, '');
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    if (active && !history.state?.[GUARD]) {
      history.pushState({ ...history.state, [GUARD]: true }, '');
    } else if (!active && history.state?.[GUARD]) {
      history.back();
    }
  }, [active]);
}
