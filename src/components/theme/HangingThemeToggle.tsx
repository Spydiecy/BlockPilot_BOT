'use client';

import { memo } from 'react';
import { LightbulbFilament, MoonStars, Sun } from 'phosphor-react';
import { useTheme } from '@/contexts/ThemeContext';

export const HangingThemeToggle = memo(function HangingThemeToggle() {
  const { theme, toggleTheme, isHydrated } = useTheme();
  const isLightTheme = theme === 'light';
  const nextThemeLabel = isLightTheme ? 'dark' : 'light';

  return (
    <div className="hanging-theme-toggle" aria-hidden={false}>
      <div className="hanging-theme-toggle__rope" aria-hidden />
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
