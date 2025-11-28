import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 text-white placeholder-gray-500 focus:outline-none transition-colors ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-[#0A1A2F] focus:border-[#3DD9B4]"
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
