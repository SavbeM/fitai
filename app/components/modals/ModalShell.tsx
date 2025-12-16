import { ReactNode } from 'react';

interface ModalShellProps {
  id: string;
  title?: string;
  children: ReactNode;
}

export function ModalShell({ id, title, children }: ModalShellProps) {
  return (
    <div
      id={id}
      className="hs-overlay hs-overlay-backdrop-open:bg-orange-400/20 hidden size-full fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      tabIndex={-1}
      aria-labelledby={`${id}-label`}
    >
      <div className="mt-8 opacity-100 duration-300 transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
        <div className="flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto">
          <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200">
            {title ? (
              <h3 id={`${id}-label`} className="font-semibold text-gray-800">
                {title}
              </h3>
            ) : (
              <span aria-hidden className="sr-only" id={`${id}-label`}>
                Modal
              </span>
            )}
            <button
              type="button"
              className="size-8 inline-flex justify-center items-center rounded-full bg-gray-100 hover:bg-gray-200"
              data-hs-overlay={`#${id}`}
              aria-label="Close"
            >
              x
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[70vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
