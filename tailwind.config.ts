import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-patterns": "url('/background/bubbles.svg')",
        "room": "url('/background/bgroom.svg')",
        "gacha1": "url('/banner/limited/gacha1.svg')",
        "gacha2": "url('/banner/standard/gacha2.svg')",
        "shop": "url('/background/shop/3d-fantasy-scene.svg')",
      },
      animation: {
        bounce2: 'bounceCustom 4s infinite',
      },
      keyframes: {
        bounceCustom: {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      screens: {
        'tall': {
          'raw': '(min-height: 700px)'
        },
        'talles': {
          'raw': '(min-height: 900px)'
        },
        'tallesmax': {
          'raw': '(min-height: 1000px)'
        },
        's': '350px',
        'xs': '540px',
      },
      objectPosition: {
        'center-top': 'center top',
      },
    },
  },
  plugins: [],
};
export default config;
