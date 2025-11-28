import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost";
  children: ReactNode;
}

export function Button({ variant = "solid", children, className = "", ...props }: ButtonProps) {
  const baseClasses = "px-6 py-3 rounded-2xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variantClasses = {
    solid: "bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] shadow-lg",
    outline: "bg-transparent text-[#3DD9B4] border-2 border-[#3DD9B4] hover:bg-[#3DD9B4]/10",
    ghost: "bg-[#0A1A2F] text-gray-300 hover:bg-[#3DD9B4]/10 hover:text-[#3DD9B4] border border-[#0A1A2F] hover:border-[#3DD9B4]/30",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
