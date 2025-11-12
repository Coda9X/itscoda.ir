import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";

export default defineConfig({
    plugins: [
        laravel({
            input: [
                "resources/ts/main.ts",
            ],
            refresh: true,
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: '192.168.1.2',
            port: 5173,
            protocol: 'ws',
        },
        headers: {
        	'Access-Control-Allow-Origin': '*',
        },
    }
});
