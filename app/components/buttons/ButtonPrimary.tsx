import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

interface ButtonPrimaryProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    color?: 'orange' | 'dark' | 'gray' | 'grey';
    type?: 'button' | 'submit' | 'reset';
    [key: string]: any;
}

const COLOR_MAP: Record<string, string> = {
    orange: 'bg-orange hover:bg-orangeSecondary focus:bg-orangeSecondary',
    dark: 'bg-black hover:bg-neutral-800 focus:bg-neutral-800',
    gray: 'bg-gray-600 hover:bg-neutral-800 focus:bg-neutral-800',
    grey: 'bg-gray-600 hover:bg-neutral-800 focus:bg-neutral-800',
};

export const ButtonPrimary = ({
                                  children,
                                  onClick,
                                  href,
                                  className,
                                  color = 'orange',
                                  type = 'button',
                                  ...rest
                              }: ButtonPrimaryProps) => {
    const baseClasses = clsx(
        'py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-white focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none',
        COLOR_MAP[color],
        className
    );

    if (href) {
        return (
            <Link href={href} className={baseClasses} {...rest}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={baseClasses} {...rest}>
            {children}
        </button>
    );
};
