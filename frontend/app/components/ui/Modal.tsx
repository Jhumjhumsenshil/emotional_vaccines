import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${maxWidth} mx-auto overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]`}>
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors shrink-0"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3.5 sm:p-6 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
