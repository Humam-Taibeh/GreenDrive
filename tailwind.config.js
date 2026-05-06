/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          toxic: "#36FF97",
          onyx: "#000000",
          dim: "#BABABA",
        },
      },
    },
    plugins: [],
  }