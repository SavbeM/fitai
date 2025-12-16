"use client";
import React, { useEffect, useState } from "react";
import { ModalShell } from "@/app/components/modals/ModalShell";
import { ButtonPrimary } from "@/app/components/buttons/ButtonPrimary";

export interface EditProjectData {
  id: number;
  title: string;
  description: string;
}

interface EditProjectModalProps {
  id?: string;
  project: EditProjectData | null;
  onSave: (id: number, data: { title: string; description: string }) => void;
}

export function EditProjectModal({ id = "edit", project, onSave }: EditProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(project?.title ?? "");
    setDescription(project?.description ?? "");
  }, [project]);

  const handleSave = () => {
    if (!project) return;
    onSave(project.id, { title, description });
  };

  return (
    <ModalShell id={id} title="Edit project">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-orange-400 focus:ring-orange-400 disabled:opacity-50 disabled:pointer-events-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={4}
            placeholder="Write description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm resize-none focus:border-orange-400 focus:ring-orange-400 disabled:opacity-50 disabled:pointer-events-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ButtonPrimary color="grey" className="" >
            <span data-hs-overlay={`#${id}`}>Cancel</span>
          </ButtonPrimary>
          <ButtonPrimary
            color="orange"
            onClick={handleSave}
            className=""
          >
            <span data-hs-overlay={`#${id}`}>Save</span>
          </ButtonPrimary>
        </div>
      </div>
    </ModalShell>
  );
}
