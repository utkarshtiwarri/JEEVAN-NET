import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend's CORS allowlist expects port 5173, so pin both dev and
// preview to it. Falling back to 5174 silently breaks the API call.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
});
