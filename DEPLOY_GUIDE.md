# How to Deploy to Netlify (Manual Drag & Drop)

Since you are not using GitHub for now, you can deploy your site manually by dragging the build folder to Netlify.

## Step 1: Create the Production Build
Run the following command in your terminal to generate the static files:

```bash
npm run build
```

This will create a hidden folder called `.next` (or `out` if we export static).
*Note: Next.js by default builds for a server. For Netlify Drag & Drop, strictly static export (`output: 'export'`) is often easier, but standard Next.js build works if you use the Netlify CLI or if we configure it right. For simple Drag & Drop, let's ensure we have the static files.*

## Step 2: Deploy to Netlify
1.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2.  You will see a box that says "Drag and drop your site folder here".
3.  Locate the folder **`/Users/bishop/Desktop/output/workspace-99190f76-187d-40a3-8ab6-30b756622125/.next`** on your computer.
    *   *Tip: You might need to press `Cmd + Shift + .` in Finder to see hidden folders like `.next`.*
4.  Drag the `.next` folder into the Netlify drop zone.
5.  Wait for it to upload.

## Alternative: Netlify CLI (Easier)
If dragging the folder fails (because `.next` is complex), use the command line:

1.  Current directory: `/Users/bishop/Desktop/output/workspace-99190f76-187d-40a3-8ab6-30b756622125`
2.  Run:
    ```bash
    npx netlify-cli deploy --prod
    ```
3.  It will ask you to log in (browser opens).
4.  It will ask to "Link this directory to an existing site". Choose "Create & configure a new site".
5.  **Team**: Select your team.
6.  **Site Name**: Choose one of the names below or leave blank for random.
7.  **Publish directory**: Type `.next` (or just hit Enter if it detects it).

## Project Name Ideas
Short, punchy names for your app:

1.  **AuraFlow**
2.  **Flux**
3.  **Pulse**
4.  **Apex**
5.  **Nexus**
6.  **Vortex**
7.  **Signal**
8.  **Echo**
9.  **Core**
10. **Zoid** (Brand aligned!)
