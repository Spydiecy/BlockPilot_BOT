'use client';

import {
  memo,
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { LightbulbFilament, MoonStars, Sun } from 'phosphor-react';
import { useTheme } from '@/contexts/ThemeContext';

export const HangingThemeToggle = memo(function HangingThemeToggle() {
  const { theme, toggleTheme, isHydrated } = useTheme();
  const isLightTheme = theme === 'light';
  const nextThemeLabel = isLightTheme ? 'dark' : 'light';
  const [pullDistance, setPullDistance] = useState(0);
  const pointerStartY = useRef<number | null>(null);
  const isPulling = useRef(false);

  const resetPull = useCallback(() => {
    pointerStartY.current = null;
    isPulling.current = false;
    setPullDistance(0);
  }, []);

  const handlePullStart = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    pointerStartY.current = event.clientY;
    isPulling.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePullMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!isPulling.current || pointerStartY.current === null) return;
    const delta = Math.max(0, Math.min(24, event.clientY - pointerStartY.current));
    setPullDistance(delta);
  }, []);

  const handlePullEnd = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!isPulling.current || pointerStartY.current === null) {
      resetPull();
      return;
    }

    const delta = Math.max(0, event.clientY - pointerStartY.current);
    if (delta >= 10) {
      toggleTheme();
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // no-op
    }

    resetPull();
  }, [resetPull, toggleTheme]);

  const handlePullKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTheme();
    }
  }, [toggleTheme]);

  return (
    <div
      className="hanging-theme-toggle"
      aria-hidden={false}
      style={{ '--toggle-pull': `${pullDistance}px` } as CSSProperties}
    >
      <button
        type="button"
        className="hanging-theme-toggle__rope-hitbox"
        onPointerDown={handlePullStart}
        onPointerMove={handlePullMove}
        onPointerUp={handlePullEnd}
        onPointerCancel={resetPull}
        onKeyDown={handlePullKeyDown}
        aria-label={`Pull to switch to ${nextThemeLabel} theme`}
      >
        <span className="hanging-theme-toggle__rope" aria-hidden />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className={`hanging-theme-toggle__bulb ${isLightTheme ? 'is-on' : ''}`}
        aria-label={`Switch to ${nextThemeLabel} theme`}
        aria-pressed={isLightTheme}
      >
        <LightbulbFilament size={26} weight={isLightTheme ? 'fill' : 'regular'} />
        <span className="sr-only">
          {isHydrated ? `Current theme: ${theme}` : 'Loading theme'}
        </span>
        <span className="hanging-theme-toggle__indicator" aria-hidden>
          {isLightTheme ? <Sun size={11} weight="fill" /> : <MoonStars size={11} weight="fill" />}
        </span>
      </button>
    </div>
  );
});
