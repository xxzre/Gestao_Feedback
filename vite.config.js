import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANTE se for publicar no GitHub Pages:
// troque "/NOME-DO-REPOSITORIO/" pelo nome exato do seu repositório no GitHub.
// Ex: se o repo é "github.com/seu-usuario/feedback-app", use "/feedback-app/".
export default defineConfig({
  plugins: [react()],
  base: "/Gestao_Feedback/",
});
