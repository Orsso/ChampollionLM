import React, { useState } from 'react';
import { BORDERS, SHADOWS, RADIUS, TRANSITIONS } from '../../../constants/styles';

/**
 * AnimatedInput Component
 *
 * Input with animated label that moves up on focus or when filled.
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
    const uniqueId = React.useId();
    const inputId = props.id || uniqueId;

    const hasValue = props.value || internalValue;
    const isLabelFloating = isFocused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      props.onChange?.(e);
    };

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const borderClass = darkMode ? 'border-slate-600' : 'border-gray-600';
    const textClass = darkMode ? 'text-slate-100' : 'text-gray-900';
    const labelClass = darkMode ? 'text-slate-300' : 'text-gray-700';
    const labelBgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const labelFocusClass = darkMode ? 'text-slate-300' : 'text-gray-700';
    const shadowClass = isFocused ? SHADOWS.medium : SHADOWS.small;

    return (
      <div className={`relative ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          {...props}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`w-full px-4 py-3 ${bgClass} ${BORDERS.normal} ${borderClass} ${RADIUS.normal} ${textClass} ${shadowClass} transition-all ${TRANSITIONS.fast} focus:outline-none font-medium`}
          placeholder=" "
        />
        <label
          htmlFor={inputId}
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
 * StyledInput Component
 *
 * Input with bold borders and orange shadow on focus.
 * Simpler than AnimatedInput - no floating label, just placeholder.
 * Perfect for search bars, inline inputs, and forms that don't need labels.
 *
 * @example
 * ```tsx
 * <StyledInput
 *   placeholder="Rechercher..."
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 * />
 * ```
 */

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  darkMode?: boolean;
}

export const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
  ({ darkMode = false, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const borderClass = 'border-black';
    const textClass = darkMode ? 'text-slate-100' : 'text-black';
    const placeholderClass = darkMode ? 'placeholder:text-slate-400' : 'placeholder:text-gray-400';
    const shadowClass = isFocused ? SHADOWS.medium : SHADOWS.small;

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
          ${BORDERS.normal}
          ${borderClass}
          ${RADIUS.normal}
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

StyledInput.displayName = 'StyledInput';

// Legacy alias for backward compatibility
/** @deprecated Use StyledInput instead */
export const BrutalInput = StyledInput;

/**
 * Textarea Component
 *
 * Textarea with bold borders and orange shadow on focus.
 * Same styling as StyledInput but for multi-line text entry.
 *
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Posez une question..."
 *   value={message}
 *   onChange={(e) => setMessage(e.target.value)}
 *   rows={3}
 * />
 * ```
 */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  darkMode?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ darkMode = false, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const bgClass = darkMode ? 'bg-slate-900' : 'bg-white';
    const borderClass = 'border-black';
    const textClass = darkMode ? 'text-slate-100' : 'text-black';
    const placeholderClass = darkMode ? 'placeholder:text-slate-400' : 'placeholder:text-gray-400';
    const shadowClass = isFocused ? SHADOWS.medium : SHADOWS.small;

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
          ${BORDERS.normal}
          ${borderClass}
          ${RADIUS.normal}
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

Textarea.displayName = 'Textarea';

// Legacy alias for backward compatibility
/** @deprecated Use Textarea instead */
export const BrutalTextarea = Textarea;
