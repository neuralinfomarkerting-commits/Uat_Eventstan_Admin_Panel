'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText,
  cancelText = "Cancel"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Determine button text based on title if confirmText not provided
  const getConfirmText = () => {
    if (confirmText) return confirmText;
    
    if (title === "Add to Homepage") return "Add";
    if (title === "Remove from Homepage") return "Remove";
    if (title === "Hide from Homepage") return "Hide";
    if (title === "Show on Homepage") return "Show";
    if (title === "Activate Service") return "Activate";
    if (title === "Deactivate Service") return "Deactivate";
    if (title === "Delete Service") return "Delete";
    if (title.includes("Activate")) return "Activate";
    if (title.includes("Deactivate")) return "Deactivate";
    if (title.includes("Delete")) return "Delete";
    
    return "Confirm";
  };

  // Get icon color based on action
  const getIconColor = () => {
    if (title.includes("Delete") || title.includes("Remove") || title.includes("Deactivate") || title.includes("Hide")) {
      return "text-red-500";
    }
    if (title.includes("Add") || title.includes("Show") || title.includes("Activate")) {
      return "text-green-500";
    }
    return "text-orange-500";
  };

  // Get button color based on action
  const getButtonColor = () => {
    if (title.includes("Delete") || title.includes("Remove") || title.includes("Deactivate") || title.includes("Hide")) {
      return "bg-red-500 hover:bg-red-600";
    }
    if (title.includes("Add") || title.includes("Show") || title.includes("Activate")) {
      return "bg-green-500 hover:bg-green-600";
    }
    return "bg-orange-500 hover:bg-orange-600";
  };

  const buttonText = getConfirmText();
  const iconColor = getIconColor();
  const buttonColor = getButtonColor();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center gap-4">
        <div className={`w-14 h-14 rounded-full ${iconColor === 'text-red-500' ? 'bg-red-50' : iconColor === 'text-green-500' ? 'bg-green-50' : 'bg-orange-50'} flex items-center justify-center`}>
          <AlertTriangle size={26} className={iconColor} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition ${buttonColor}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}