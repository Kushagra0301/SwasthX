// components/DisclaimerModal.tsx
"use client";

import { useEffect } from "react";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void; // New: Handle acceptance (e.g., redirect)
}

export default function DisclaimerModal({ isOpen, onClose, onAccept }: DisclaimerModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Added max-h-[90vh] and overflow-y-auto for scrolling on small screens */}
      <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up overscroll-contain">
        {/* Header */}
        <div className="p-6 border-b border-zinc-700/50 sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10"> {/* Sticky header for better UX when scrolling */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-100">
                Important Disclaimer
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                Please read carefully before proceeding
              </p>
            </div>
          </div>
        </div>
        
        {/* Content - Flexible height */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <p className="text-zinc-300 text-center">
              <span className="font-semibold text-red-400">SwastX</span> provides fitness and diet plans for informational purposes only.
            </p>
            
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-zinc-300">
                    <span className="font-medium">Not Medical Advice:</span> These plans are not substitutes for professional medical advice, diagnosis, or treatment.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-zinc-300">
                    <span className="font-medium">No Responsibility:</span> SwastX does not take any responsibility for any injuries, health issues, or damages resulting from following these plans.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-zinc-300">
                    <span className="font-medium">Consult Professionals:</span> Always consult with qualified healthcare providers, nutritionists, or fitness trainers before starting any new program.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-zinc-300">
                    <span className="font-medium">Personal Responsibility:</span> You are solely responsible for your health, safety, and well-being. Use these plans at your own risk.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-zinc-300">
                    <span className="font-medium">Individual Results May Vary:</span> Results depend on various factors including genetics, consistency, diet, and overall health.
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="flex items-start gap-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-4 border border-red-500/20">
              <span className="text-2xl mt-0.5">💡</span>
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-1">Important Note:</p>
                <p className="text-sm text-zinc-400">
                  These plans are for general guidance only. What works for one person may not work for another. Listen to your body and adjust accordingly.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - Sticky for better UX */}
        <div className="p-6 pt-4 border-t border-zinc-700/50 sticky bottom-0 bg-zinc-900/90 backdrop-blur-md z-10">
          <div className="flex flex-col gap-3">
            <button
              onClick={onAccept} // Use onAccept to proceed (e.g., redirect)
              className="px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              I Understand & Accept All Terms
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 font-medium rounded-xl border border-zinc-700/50 transition-all duration-300 hover:border-zinc-600"
            >
              Cancel
            </button>
            <p className="text-xs text-center text-zinc-500 pt-2">
              By clicking "I Understand & Accept All Terms", you acknowledge that you have read and agree to this disclaimer.
            </p>
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}