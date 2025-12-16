"use client";
import React, { useMemo, useState } from "react";
import { ModalShell } from "@/app/components/modals/ModalShell";
import { ButtonPrimary } from "@/app/components/buttons/ButtonPrimary";
import { InitStepper, StepItem } from "@/app/components/stepper/InitStepper";

type NewProjectInitProps = {
  id: string;
};

type Exercise = { id: number; title: string; selected: boolean };

export function NewProjectInit({ id }: NewProjectInitProps) {
  const [step, setStep] = useState<number>(0); // 0,1,2
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [desc, setDesc] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const steps: StepItem[] = useMemo(
    () => [
      { title: "New project", description: "Create and describe your project" },
      { title: "Exercises intro", description: "Read before you choose" },
      { title: "Confirm selection", description: "Review chosen exercises" },
    ],
    []
  );

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <ModalShell id={id}>
      <div className="space-y-4">
        <div className="flex justify-center">
          <InitStepper current={step} steps={steps} />
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">New project</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Project name</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Goal</label>
              <input
                type="text"
                placeholder="Define your goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={4}
                placeholder="Short description..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm resize-none focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <ButtonPrimary color="grey" data-hs-overlay="#new-project-modal">
                Cancel
              </ButtonPrimary>
              <ButtonPrimary color="orange" onClick={next}>
                Next
              </ButtonPrimary>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Before you choose exercises</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 py-2">
              <img src="/assets/modal_step2.png" alt="Exercises intro" className="w-full sm:w-56 rounded-lg" />
              <p className="text-sm text-gray-600 mt-3 sm:mt-0">
                In the next step, you&#39;ll select the exercises that will be added to your initial training plan. The algorithm will automatically adjust intensity and frequency based on your biometrics.
              </p>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <ButtonPrimary color="grey" onClick={prev}>
                Prev
              </ButtonPrimary>
              <ButtonPrimary
                color="orange"
                onClick={() => {
                  setExercises([
                    { id: 1, title: "Push Ups", selected: true },
                    { id: 2, title: "Squats", selected: true },
                    { id: 3, title: "Plank", selected: false },
                  ]);
                  setStep(2);
                }}
              >
                Ok, let&#39;s go
              </ButtonPrimary>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Are you sure you want choose this exercises</h3>
            <div className="space-y-2">
              {exercises.length === 0 && (
                <p className="text-sm text-gray-500">No exercises selected (mock).</p>
              )}
              {exercises.map((ex) => (
                <label key={ex.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-gray-300 accent-orange focus:ring-orangeSecondary"
                    checked={ex.selected}
                    onChange={(e) =>
                      setExercises((prev) =>
                        prev.map((p) => (p.id === ex.id ? { ...p, selected: e.target.checked } : p))
                      )
                    }
                  />
                  <span className="text-sm text-gray-800">{ex.title}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <ButtonPrimary color="grey" onClick={prev}>
                Prev
              </ButtonPrimary>
              <div className="flex gap-2">
                <ButtonPrimary color="orange"  data-hs-overlay="#new-project-modal">
                  Confirm
                </ButtonPrimary>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}