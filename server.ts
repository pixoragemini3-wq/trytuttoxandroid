import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blogger Config
const BLOGGER_DOMAIN = 'https://www.tuttoxandroid.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. REDIRECT CLEANUP: Strip ?m=1 or ?m=0 and 301 redirect
  app.use((req, res, next) => {
    // Explicitly set X-Robots-Tag to ensure indexing is allowed at the header level
    res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large');

    if (req.query.m === '1' || req.query.m === '0') {
      const cleanUrl = req.path;
      console.log(`[SEO Redirect] Stripping ?m=${req.query.m} from ${req.originalUrl} -> ${cleanUrl}`);
      return res.redirect(301, cleanUrl);
    }
    next();
  });

  // 2. DYNAMIC SITEMAP: Fetch all posts from Blogger
  app.get("/sitemap.xml", async (req, res) => {
    try {
      console.log("[SEO Sitemap] Generating dynamic sitemap...");
      let allPosts: any[] = [];
      let startIndex = 1;
      let hasMore = true;

      // Fetch up to 1000 posts for the sitemap (Blogger limit per request is 500, so we might need multiple requests if needed, but for now let's try to get more)
      const response = await fetch(`${BLOGGER_DOMAIN}/feeds/posts/default?alt=json&max-results=1000`);
      if (response.ok) {
        const data = await response.json();
        allPosts = data.feed.entry || [];
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home
      xml += `  <url><loc>${BLOGGER_DOMAIN}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>\n`;
      
      // Posts
      allPosts.forEach(post => {
        const url = post.link.find((l: any) => l.rel === 'alternate')?.href || '';
        const published = post.published?.$t ? post.published.$t.split('T')[0] : '';
        if (url) {
          xml += `  <url><loc>${url}</loc><lastmod>${published}</lastmod><priority>0.8</priority></url>\n`;
        }
      });

      // Static pages
      xml += `  <url><loc>${BLOGGER_DOMAIN}/about</loc><priority>0.5</priority></url>\n`;
      xml += `  <url><loc>${BLOGGER_DOMAIN}/calcolatore-gps</loc><priority>0.7</priority></url>\n`;
      
      xml += `</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (e) {
      console.error("[SEO Sitemap] Error generating sitemap", e);
      res.status(500).send("Error generating sitemap");
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    app.use(express.static(distPath, { index: false }));

    // 3. SEO META INJECTION: Inject metadata for articles before sending HTML
    app.get('*', async (req, res) => {
      try {
        // Explicitly set status 200 for all SPA routes to prevent 404s in Search Console
        res.status(200);
        
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // If it's an article URL (ends in .html)
        if (req.path.endsWith('.html')) {
          console.log(`[SEO Meta] Injecting metadata for: ${req.path}`);
          const slug = req.path.split('/').pop()?.replace('.html', '') || '';
          const keywords = slug.replace(/-/g, ' ');
          
          // Search Blogger for this post to get metadata
          const searchUrl = `${BLOGGER_DOMAIN}/feeds/posts/default?alt=json&q=${encodeURIComponent(keywords)}&max-results=1`;
          const response = await fetch(searchUrl);
          
          if (response.ok) {
            const data = await response.json();
            const entry = data.feed.entry?.[0];
            if (entry) {
              const title = entry.title.$t + " | TuttoXAndroid";
              const content = entry.content?.$t || entry.summary?.$t || "";
              const excerpt = content.replace(/<[^>]+>/g, '').substring(0, 160).trim() + "...";
              const imageUrl = entry.media$thumbnail?.url?.replace(/\/s\d+(-c)?\//, '/s1600/') || "";
              const postUrl = `${BLOGGER_DOMAIN}${req.path}`;

              // Replace placeholders in index.html
              html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
              html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${excerpt}" />`);
              
              // Ensure robots tag is present and correct
              if (html.includes('<meta name="robots"')) {
                html = html.replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="index, follow, max-image-preview:large" />`);
              } else {
                html = html.replace('</head>', '    <meta name="robots" content="index, follow, max-image-preview:large" />\n  </head>');
              }

              // Open Graph
              html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
              html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${excerpt}" />`);
              html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${postUrl}" />`);
              if (imageUrl) {
                html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${imageUrl}" />`);
              }
            }
          }
        }
        
        res.send(html);
      } catch (e) {
        console.error("[SEO Meta] Error injecting meta", e);
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
