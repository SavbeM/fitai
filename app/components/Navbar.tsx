import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HEADER_NAV_LINKS } from '@/app/config/routes';
import { ButtonPrimary } from '@/app/components/buttons/ButtonPrimary';


export function Navbar() {
    return (
        <header className="relative w-full bg-white text-sm">
            <nav className="mx-auto px-4 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center justify-between py-3">
                    <Link
                        href={HEADER_NAV_LINKS.Home}
                        className="inline-flex items-center gap-x-2 text-xl font-semibold text-black"
                        aria-label="Brand"
                    >
                        <Image width={120} height={100} src="/assets/logo_short.png" alt="Logo" />
                    </Link>

                    <div className="sm:hidden">
                        <button
                            type="button"
                            className="hs-collapse-toggle size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-none"
                            data-hs-collapse="#hs-navbar"
                        >
                            <svg className="hs-collapse-open:hidden size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="3" x2="21" y1="6" y2="6" />
                                <line x1="3" x2="21" y1="12" y2="12" />
                                <line x1="3" x2="21" y1="18" y2="18" />
                            </svg>
                            <svg className="hs-collapse-open:block hidden size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div id="hs-navbar" className="hidden hs-collapse basis-full grow sm:block">
                    <div className="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:gap-4">
          {Object.entries(HEADER_NAV_LINKS).map(([key, value]) => (
                                <Link
                                    key={key}
                                    href={value}
                                    className="font-medium text-gray-600 hover:text-gray-900"
                                >
                                    {key}
                                </Link>
                            ))}

                        <ButtonPrimary href={HEADER_NAV_LINKS.Login} color="orange">
                            Sign in
                        </ButtonPrimary>
                        <ButtonPrimary href={HEADER_NAV_LINKS.Register} color="dark">
                            Register
                        </ButtonPrimary>
                    </div>
                </div>
            </nav>
        </header>
    );
}
