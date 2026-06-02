import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        xl: "18px",
        "2xl": "18px",
        pill: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "17px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "80px",
        "4xl": "96px",
        "5xl": "120px",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px", letterSpacing: "-0.224px" }],
        base: ["17px", { lineHeight: "25px", letterSpacing: "-0.374px" }],
        lg: ["21px", { lineHeight: "25px", letterSpacing: "0.231px" }],
        xl: ["24px", { lineHeight: "36px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["34px", { lineHeight: "50px", letterSpacing: "-0.374px" }],
        "4xl": ["40px", { lineHeight: "44px" }],
        "5xl": ["56px", { lineHeight: "60px", letterSpacing: "-0.28px" }],
      },
      fontFamily: {
        sans: ["system-ui", "SF Pro Display", "SF Pro Text", "sans-serif"],
        display: ["SF Pro Display", "system-ui", "sans-serif"],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      boxShadow: {
        product: "3px 5px 30px rgba(0, 0, 0, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
