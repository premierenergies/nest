import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",  // Allow access from all IP addresses
      port: 8080,  // Choose an appropriate port for the development server
      https: mode === "development" ? {
        key: fs.readFileSync(path.resolve(__dirname, "certs", "mydomain.key"), "utf8"),
        cert: fs.readFileSync(path.resolve(__dirname, "certs", "d466aacf3db3f299.crt"), "utf8"),
        ca: fs.readFileSync(path.resolve(__dirname, "certs", "gd_bundle-g2-g1.crt"), "utf8"),
      } : false,
    },
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env.REACT_APP_API_BASE_URL": JSON.stringify(process.env.REACT_APP_API_BASE_URL || "/api"),
    },    
  };
});
