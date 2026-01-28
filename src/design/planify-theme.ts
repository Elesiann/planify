// src/design/planify-theme.ts

export const planifyTheme = {
    // 1. Cores base
    colors: {
        // Backgrounds
        bg: "#050816", // fundo da app
        bgMuted: "#060b1a", // variação para seções
        surface: "#0b1020", // cards principais
        surfaceElevated: "#111827", // modais / cards em destaque

        // Bordas
        borderSubtle: "rgba(148, 163, 184, 0.25)",
        borderStrong: "rgba(148, 163, 184, 0.45)",

        // Texto
        textPrimary: "#F9FAFB",
        textSecondary: "#E5E7EB",
        textMuted: "#9CA3AF",
        textSoft: "#6B7280",

        // Ações
        primary: "#38BDF8",
        primaryHover: "#0EA5E9",
        primarySoft: "rgba(56, 189, 248, 0.16)",
        primaryBorder: "rgba(56, 189, 248, 0.6)",

        // Estados
        success: "#22C55E",
        successSoft: "rgba(34, 197, 94, 0.14)",
        warning: "#EAB308",
        warningSoft: "rgba(234, 179, 8, 0.16)",
        danger: "#F97373",
        dangerSoft: "rgba(248, 113, 113, 0.16)",
        info: "#38BDF8",
        infoSoft: "rgba(56, 189, 248, 0.12)",

        // Outros
        overlay: "rgba(15, 23, 42, 0.76)",
        focusRing: "rgba(56, 189, 248, 0.75)",
        divider: "rgba(148, 163, 184, 0.25)",
    },

    // 2. Tipografia
    typography: {
        fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`,
        fontSize: {
            xs: "0.75rem",  // 12
            sm: "0.875rem", // 14
            md: "1rem",     // 16
            lg: "1.125rem", // 18
            xl: "1.25rem",  // 20
            "2xl": "1.5rem",
            "3xl": "1.875rem",
        },
        fontWeight: {
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
        lineHeight: {
            tight: 1.1,
            snug: 1.25,
            normal: 1.5,
            relaxed: 1.625,
        },
    },

    // 3. Radius
    radii: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "999px",
    },

    // 4. Spacing (escala 4px)
    spacing: {
        0: "0px",
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        3.5: "14px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
    },

    // 5. Sombras
    shadows: {
        none: "none",
        soft: "0 8px 20px rgba(15, 23, 42, 0.45)",
        medium: "0 16px 40px rgba(15, 23, 42, 0.65)",
        focus: "0 0 0 1px rgba(15, 23, 42, 1), 0 0 0 3px rgba(56, 189, 248, 0.7)",
    },

    // 6. Layout
    layout: {
        containerWidth: "1140px",
        navbarHeight: "64px",
        cardPadding: "20px",
        modalWidth: "720px",
    },

    // 7. Transitions
    transitions: {
        fast: "150ms ease-out",
        normal: "200ms ease-out",
        slow: "250ms ease-out",
    },
} as const;

export type PlanifyTheme = typeof planifyTheme;
