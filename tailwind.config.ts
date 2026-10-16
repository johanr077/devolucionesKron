import type { Config } from "tailwindcss";

// Paleta Kron: morado del fondo de marca, índigo del logo, cacao y crema de chocolate blanco.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kron: {
          purple: "#4A1D7A",
          deep: "#2E1050",
          indigo: "#4338A0",
          cocoa: "#5A2E17",
          caramel: "#C98A4B",
          cream: "#F7EEDF",
          milk: "#FFFAF2",
          ink: "#24113D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
