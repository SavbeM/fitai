'use client';

import { ReactElement, cloneElement } from 'react';

type ModalTriggerProps = {
    targetId: string;
    children: ReactElement<Record<string, unknown>>;
};

export function ModalTrigger({ targetId, children }: ModalTriggerProps) {
    return cloneElement(children, {
        'data-hs-overlay': `#${targetId}`,
        'aria-controls': targetId,
    });
}
