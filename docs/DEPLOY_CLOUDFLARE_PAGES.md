# Deploy To Cloudflare Pages

1. Upload this project to a GitHub repository.
2. In Cloudflare, open **Workers & Pages**.
3. Select **Create application**, then **Pages**, then import the repository.
4. Configure:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy.

Cloudflare will provide a free `pages.dev` address. A custom domain can be connected later.
