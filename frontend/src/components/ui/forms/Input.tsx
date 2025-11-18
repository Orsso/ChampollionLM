import React, { useState } from 'react';
import { BRUTAL_BORDERS, BRUTAL_SHADOWS, BRUTAL_RADIUS, TRANSITIONS } from '../../../constants/styles';

/**
 * AnimatedInput Component
 *
 * Neo-brutalist input with animated label that moves up on focus or when filled.
 * Bold borders and hard orange shadow on focus.
 *
 * @example
 * ```tsx
 * <AnimatedInput
 *   label="Email"
 *   type="email"
 *   darkMode
 * />
 * <AnimatedInput
 *   label="Mot de passe"
 *   type="password"
 *   darkMode
 * />
 * ```
 */

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  darkMode?: boolean;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, type = 'text', darkMode = true, className = '', required = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(props.value || '');

    const hasValue = props.value || internalValue;
    const isLabelFloating = isFocused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      props.onChange?.(e);
    };

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const borderClass = darkMode
      ? isFocused
        ? 'border-orange-500'
        : 'border-slate-600'
      : isFocused
      ? 'border-orange-500'
      : 'border-gray-600';
    const textClass = darkMode ? 'text-slate-100' : 'text-gray-900';
    const labelClass = darkMode ? 'text-slate-300' : 'text-gray-700';
    const labelBgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const labelFocusClass = darkMode ? 'text-slate-300' : 'text-orange-500';
    const shadowClass = isFocused ? BRUTAL_SHADOWS.orange : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';

    return (
      <div className={`relative ${className}`}>
        <input
          ref={ref}
          type={type}
          {...props}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`w-full px-4 py-3 ${bgClass} ${BRUTAL_BORDERS.normal} ${borderClass} ${BRUTAL_RADIUS.normal} ${textClass} ${shadowClass} transition-all ${TRANSITIONS.fast} focus:outline-none font-medium`}
          placeholder=" "
        />
        <label
          className={`absolute left-4 transition-all ${TRANSITIONS.fast} pointer-events-none font-bold ${
            isLabelFloating
              ? `-top-2.5 text-xs ${labelBgClass} ${labelFocusClass} px-2`
              : `top-3.5 text-base ${labelClass}`
          }`}
        >
          {label}
          {required && <span className="text-orange-500 ml-1">*</span>}
        </label>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

