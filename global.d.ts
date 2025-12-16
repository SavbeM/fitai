import type { IStaticMethods } from "preline/dist";

declare global {
    interface Window {
        // Optional third-party libraries
        _;
        $: typeof import("jquery");
        jQuery: typeof import("jquery");
        noUiSlider: typeof noUiSlider;
        VanillaCalendarPro;
        // Preline UI
        HSStaticMethods: IStaticMethods;
    }
}

export {};