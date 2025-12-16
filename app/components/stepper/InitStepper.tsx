"use client";

export type StepItem = { title: string; description?: string };

type InitStepperProps = {
  current: number;
  steps: StepItem[];
};

export function InitStepper({ current, steps }: InitStepperProps) {
  const stage = Math.max(0, Math.min(current, steps.length - 1));

  return (
      <ul className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        {steps.map((step, index) => {
          const isCompleted = index < stage;
          const isActive = index === stage;

          return (
              <li key={step.title + index} className="flex md:flex-1 md:flex-col items-start md:items-center gap-2">
                <div className="flex items-center w-full md:flex-col">
              <span
                  className={[
                    "size-7 flex items-center justify-center rounded-full text-sm font-medium",
                    isActive && "bg-orange text-white ring-2 ring-orange-400",
                    isCompleted && !isActive && "bg-orange text-white",
                    !isActive && !isCompleted && "bg-gray-200 text-gray-600",
                  ]
                      .filter(Boolean)
                      .join(" ")}
              >
                {index + 1}
              </span>

                  {index !== steps.length - 1 && (
                      <div
                          className={[
                            "flex-1 h-px md:w-px md:h-6 ml-2 md:ml-0 md:mt-2",
                            isCompleted ? "bg-orange" : "bg-gray-300",
                          ].join(" ")}
                      />
                  )}
                </div>

                <div className="md:text-center">
                  <div className="text-sm font-medium text-gray-800">
                    {step.title}
                  </div>
                  {step.description && (
                      <div className="text-xs text-gray-500">
                        {step.description}
                      </div>
                  )}
                </div>
              </li>
          );
        })}
      </ul>
  );
}
