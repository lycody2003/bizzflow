import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  modules: ["@nuxt/icon/module"],
  compatibilityDate: "2025-07-15",

  devtools: {
    enabled: true,
  },

  devServer: {
    port: 3003,
  },

  ssr: true,

  alias: {
    "@views": fileURLToPath(new URL("./app/views", import.meta.url)),
    "@utils": fileURLToPath(new URL("./app/utils", import.meta.url)),
    "@app-types": fileURLToPath(new URL("./app/types", import.meta.url)),
    "@stores": fileURLToPath(new URL("./app/stores", import.meta.url)),
    "@services": fileURLToPath(new URL("./app/services", import.meta.url)),
    "@plugins": fileURLToPath(new URL("./app/plugins", import.meta.url)),
    "@middlewares": fileURLToPath(new URL("./app/middleware", import.meta.url)),
    "@layouts": fileURLToPath(new URL("./app/layouts", import.meta.url)),

    "@repositories": fileURLToPath(
      new URL("./app/repositories", import.meta.url),
    ),

    "@composables": fileURLToPath(
      new URL("./app/composables", import.meta.url),
    ),

    "@assets": fileURLToPath(new URL("./app/assets", import.meta.url)),
    "@components": fileURLToPath(new URL("./app/components", import.meta.url)),
  },

  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE || "http://localhost:5050/api/v1",
    },
  },

  app: {
    head: {
      title: "BizzFlow - Business Management",
      meta: [
        {
          name: "description",
          content: "BizzFlow Business Management Platform",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          href: "/bizzflow-icon.png",
        },
        {
          rel: "stylesheet",
          href: "/style/main.css",
        },
      ],
    },
  },
});
