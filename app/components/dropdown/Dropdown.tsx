'use client';

import React from 'react';
import Link from 'next/link';

interface NavbarDropdownProps {
    label: string;
    links: Record<string, string>;
}

export function NavbarDropdown({ label, links }: NavbarDropdownProps) {
    return (
        <div className="hs-dropdown relative [--strategy:static] sm:[--strategy:absolute]">
            <button
                type="button"
                className="hs-dropdown-toggle inline-flex items-center gap-x-1 font-medium text-gray-600 hover:text-gray-900 focus:outline-hidden"
            >
                {label}
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            <div className="hs-dropdown-menu hidden z-10 mt-2 min-w-48 rounded-lg bg-white p-2 shadow-md">
                {Object.entries(links).map(([key, href]) => (
                    <Link
                        key={key}
                        href={href}
                        className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        {key}
                    </Link>
                ))}
            </div>
        </div>
    );
}
