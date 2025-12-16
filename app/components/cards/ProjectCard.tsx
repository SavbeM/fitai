import React from "react";
import Link from "next/link";
import {ModalTrigger} from "@/app/components/modals/ModalTrigger";

interface ProjectCardProps {
    link: string;
    title: string;
    description: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ProjectCard({
                                link,
                                title,
                                description,
                                onEdit,
                                onDelete,
                            }: ProjectCardProps) {
    return (
        <div className="relative flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition
">
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-800">
                        {title}
                    </h3>

                    <div className="flex gap-1">
                        <ModalTrigger targetId='edit'>
                            <button
                                type="button"
                                onClick={onEdit}
                                className="inline-flex items-center justify-center size-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-hidden "
                            >
                                <svg
                                    className="size-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 20h9"/>
                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                </svg>
                            </button>
                        </ModalTrigger>

                        <button
                            type="button"
                            onClick={onDelete}
                            className="inline-flex items-center justify-center size-8 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-hidden"
                        >
                            <svg
                                className="size-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 6h18"/>
                                <path d="M8 6v14"/>
                                <path d="M16 6v14"/>
                                <path d="M5 6l1-3h12l1 3"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                    {description}
                </p>

                <Link
                    href={link}
                    className="mt-3 inline-flex items-center gap-x-1 text-sm font-medium text-gray-800 hover:underline focus:outline-hidden"
                >
                    Open project
                    <svg
                        className="size-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </Link>
            </div>
        </div>
    );
}
