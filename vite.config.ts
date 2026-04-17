import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}
  return {
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react')) return 'vendor_react';
            if (id.includes('@supabase/supabase-js')) return 'vendor_supabase';
            if (id.includes('react-router-dom')) return 'vendor_router';
            if (id.includes('lucide-react')) return 'vendor_icons';
            if (id.includes('recharts')) return 'vendor_charts';
            if (id.includes('framer-motion')) return 'vendor_motion';
            return undefined;
          },
        },
      },
    },
  };
})
