import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      try {
        console.log('🚀 Configuring Express middleware...');
        const app = createServer();

        // Add debugging middleware
        server.middlewares.use('/api', (req, res, next) => {
          console.log(`📡 API Request: ${req.method} ${req.url}`);
          next();
        });

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);

        console.log('✅ Express middleware configured successfully');
      } catch (error) {
        console.error('❌ Failed to configure Express middleware:', error);
      }
    },
  };
}
