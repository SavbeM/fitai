'use client'
import React, { useState, useCallback } from "react";
import {ProjectCard} from "@/app/components/cards/ProjectCard";
import {ModalTrigger} from "@/app/components/modals/ModalTrigger";
import { EditProjectModal } from "@/app/components/modals/EditProjectModal";
import { NewProjectInit } from "@/app/components/modals/NewProjectInit";


type Project = {
    id: number;
    title: string;
    description: string;
    link: string;
};

const mockProjects: Project[] = [
    {
        id: 1,
        title: "Project title",
        description: "Project description",
        link: "/projects/1",
    },
    {
        id: 2,
        title: "Project title",
        description: "Project description",
        link: "/projects/2",
    },
    {
        id: 3,
        title: "Project title",
        description: "Project description",
        link: "/projects/3",
    },
    {
        id: 4,
        title: "Project title",
        description: "Project description",
        link: "/projects/4",
    },
    {
        id: 5,
        title: "Project title",
        description: "Project description",
        link: "/projects/5",
    },
    {
        id: 6,
        title: "Project title",
        description: "Project description",
        link: "/projects/6",
    },
];

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>(mockProjects);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const handleEditOpen = useCallback((project: Project) => {
        setEditingProject(project);
    }, []);

    const handleSave = useCallback((id: number, data: { title: string; description: string }) => {
        setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
        // Keep editingProject in sync if it's the one being edited
        setEditingProject(prev => (prev && prev.id === id ? { ...prev, ...data } as Project : prev));
    }, []);

    return (
        <section className="max-w-7xl px-4 py-10 mx-auto">
            <h2 className="mb-6 text-xl font-semibold text-gray-800">
                Your projects
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        title={project.title}
                        description={project.description}
                        link={project.link}
                        onEdit={() => handleEditOpen(project)}
                        onDelete={() => console.log("delete", project.id)}
                    />
                ))}
            </div>

            <div className="flex justify-center mt-8">
                <ModalTrigger targetId="new-project">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center size-10 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 focus:outline-hidden"
                    >
                        <svg
                            className="size-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 5v14"/>
                            <path d="M5 12h14"/>
                        </svg>
                    </button>
                </ModalTrigger>
            </div>
            <NewProjectInit id="new-project" />
            <EditProjectModal id="edit" project={editingProject} onSave={handleSave} />
        </section>
    );
}
