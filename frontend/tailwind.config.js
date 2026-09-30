/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  darkMode: "class",
        theme: {
          extend: {
            colors: {
              "background": "#050712",
              "surface": "#050712",
              "surface-dim": "#050712",
              "surface-bright": "#111936",
              "surface-container-lowest": "#050712",
              "surface-container-low": "#080D24",
              "surface-container": "#0D1535",
              "surface-container-high": "#111936",
              "surface-container-highest": "#1c2548",
              "surface-variant": "#1c2548",
              
              "primary": "#3B82F6",
              "primary-container": "#2563EB",
              "primary-fixed": "#d8e2ff",
              "primary-fixed-dim": "#adc6ff",
              "on-primary": "#ffffff",
              "on-primary-container": "#ffffff",

              "secondary": "#8B5CF6",
              "secondary-container": "#7C3AED",
              "secondary-fixed": "#e9ddff",
              "secondary-fixed-dim": "#d0bcff",
              "on-secondary": "#ffffff",
              "on-secondary-container": "#ffffff",

              "tertiary": "#F472B6",
              "tertiary-container": "#EC4899",
              "tertiary-fixed": "#ffd9e4",
              "tertiary-fixed-dim": "#ffb0cd",
              "on-tertiary": "#ffffff",
              "on-tertiary-container": "#ffffff",

              "magenta": "#D946EF",
              "pink": "#EC4899",
              "soft-pink": "#F472B6",
              "electric-blue": "#2563EB",
              "bright-blue": "#3B82F6",
              "violet": "#7C3AED",
              "deep-navy": "#080D24",
              "midnight-blue": "#0D1535",
              
              "on-surface": "#FFFFFF",
              "on-surface-variant": "#C7CAD9",
              "on-background": "#FFFFFF",
              "outline": "rgba(255, 255, 255, 0.15)",
              "outline-variant": "rgba(255, 255, 255, 0.08)",
              "muted-text": "#858AA3",

              "error": "#ffb4ab",
              "error-container": "#93000a",
              "on-error": "#690005"
            },
            borderRadius: {
              "DEFAULT": "0.5rem",
              "lg": "1rem",
              "xl": "1.5rem",
              "2xl": "2rem",
              "full": "9999px"
            },
            spacing: {
              "space-xs": "0.25rem",
              "space-sm": "0.5rem",
              "space-md": "1rem",
              "space-lg": "1.5rem",
              "space-xl": "2.5rem",
              "space-2xl": "5rem",
              "margin": "3rem",
              "margin-mobile": "1.25rem",
              "gutter": "1.5rem",
              "gutter-mobile": "1rem"
            },
            fontFamily: {
              sans: ["Geist", "sans-serif"],
              display: ["Geist", "sans-serif"],
              mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
              "label-md": ["Geist", "sans-serif"],
              "body-md": ["Geist", "sans-serif"],
              "label-sm": ["Geist", "sans-serif"],
              "body-lg": ["Geist", "sans-serif"],
              "title-md": ["Geist", "sans-serif"],
              "headline-lg": ["Geist", "sans-serif"],
              "headline-sm": ["Geist", "sans-serif"],
              "display-xl": ["Geist", "sans-serif"],
              "display-lg": ["Geist", "sans-serif"]
            },
            fontSize: {
              "label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.12em", fontWeight: "600" }],
              "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.12em", fontWeight: "600" }],
              "label-md": ["13px", { lineHeight: "18px", letterSpacing: "0.06em", fontWeight: "500" }],
              "body-sm": ["13px", { lineHeight: "20px", letterSpacing: "0.005em", fontWeight: "400" }],
              "body-md": ["15px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" }],
              "body-lg": ["17px", { lineHeight: "28px", letterSpacing: "-0.005em", fontWeight: "400" }],
              "title-sm": ["16px", { lineHeight: "24px", letterSpacing: "-0.005em", fontWeight: "500" }],
              "title-md": ["18px", { lineHeight: "26px", letterSpacing: "0em", fontWeight: "500" }],
              "headline-sm": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "500" }],
              "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "500" }],
              "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
              "display-hero": ["56px", { lineHeight: "64px", letterSpacing: "-0.03em", fontWeight: "600" }],
              "display-hero-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.025em", fontWeight: "600" }]
            }
          }
        }
}