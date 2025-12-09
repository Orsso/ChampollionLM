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
          className={`absolute left-4 transition-all ${TRANSITIONS.fast} pointer-events-none font-bold ${isLabelFloating
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

/**
 * BrutalInput Component
 *
 * Neo-brutalist input with bold borders and orange shadow on focus.
 * Simpler than AnimatedInput - no floating label, just placeholder.
 * Perfect for search bars, inline inputs, and forms that don't need labels.
 *
 * @example
 * ```tsx
 * <BrutalInput
 *   placeholder="Rechercher..."
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 * />
 * ```
 */

interface BrutalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  darkMode?: boolean;
}

export const BrutalInput = React.forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ darkMode = false, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const borderClass = isFocused ? 'border-orange-500' : 'border-black';
    const textClass = darkMode ? 'text-slate-100' : 'text-black';
    const placeholderClass = darkMode ? 'placeholder:text-slate-400' : 'placeholder:text-gray-400';
    const shadowClass = isFocused ? BRUTAL_SHADOWS.orange : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';

    return (
      <input
        ref={ref}
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={`
          w-full px-4 py-3
          ${bgClass}
          ${BRUTAL_BORDERS.normal}
          ${borderClass}
          ${BRUTAL_RADIUS.normal}
          ${textClass}
          ${placeholderClass}
          ${shadowClass}
          font-medium
          focus:outline-none
          transition-all ${TRANSITIONS.fast}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
    );
  }
);

BrutalInput.displayName = 'BrutalInput';

/**
 * BrutalTextarea Component
 *
 * Neo-brutalist textarea with bold borders and orange shadow on focus.
 * Same styling as BrutalInput but for multi-line text entry.
 *
 * @example
 * ```tsx
 * <BrutalTextarea
 *   placeholder="Posez une question..."
 *   value={message}
 *   onChange={(e) => setMessage(e.target.value)}
 *   rows={3}
 * />
 * ```
 */

interface BrutalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  darkMode?: boolean;
}

export const BrutalTextarea = React.forwardRef<HTMLTextAreaElement, BrutalTextareaProps>(
  ({ darkMode = false, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const borderClass = isFocused ? 'border-orange-500' : 'border-black';
    const textClass = darkMode ? 'text-slate-100' : 'text-black';
    const placeholderClass = darkMode ? 'placeholder:text-slate-400' : 'placeholder:text-gray-400';
    const shadowClass = isFocused ? BRUTAL_SHADOWS.orange : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';

    return (
      <textarea
        ref={ref}
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={`
          w-full px-4 py-3
          ${bgClass}
          ${BRUTAL_BORDERS.normal}
          ${borderClass}
          ${BRUTAL_RADIUS.normal}
          ${textClass}
          ${placeholderClass}
          ${shadowClass}
          font-medium
          resize-none
          focus:outline-none
          transition-all ${TRANSITIONS.fast}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
    );
  }
);

BrutalTextarea.displayName = 'BrutalTextarea';
