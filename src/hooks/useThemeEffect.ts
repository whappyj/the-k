import { useEffect } from 'react';
import { useAppData } from '@/hooks/useAppData';

/** settings.theme / settings.animation을 &lt;html&gt;의 data-theme / class에 반영한다. */
export function useThemeEffect() {
  const { data } = useAppData();
  const { theme, animation } = data.settings;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('no-animation', animation === false);
  }, [animation]);
}
