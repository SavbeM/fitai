import React from 'react'

interface PageContainerProps {
    children: React.ReactNode;
}

export function PageContainer({children}: PageContainerProps ) {
    return (
        <div className="md:container-2xl mx-auto p-8 min-h-screen">
            {children}
        </div>
    );
}

