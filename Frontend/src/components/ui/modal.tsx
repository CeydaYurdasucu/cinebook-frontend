import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#0A1A2F]/90 to-[#0A1A2F]/70 backdrop-blur-lg rounded-3xl max-w-md w-full border border-[#3DD9B4]/30 shadow-2xl">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-[#0A1A2F]">
            <h3 className="text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#0A1A2F] transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
