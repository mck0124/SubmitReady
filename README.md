# SubmitReady

SubmitReady is a browser-based image optimization tool that helps users prepare files for online submission requirements. Users can upload an image, choose an output format, set a maximum file size and dimensions, then download an optimized file ready for upload.

## MVP Features

- Upload one JPG or PNG image at a time.
- Convert between JPG and PNG.
- Resize images while preserving aspect ratio.
- Compress JPG output toward a target file size.
- Convert JPG and PNG images into a PDF.
- Merge PDF files.
- Extract selected page ranges from a PDF.
- Rebuild a PDF with object streams to reduce structural overhead when possible.
- Crop profile and ID photos to platform-ready dimensions.
- Redact, pixelate, or blur sensitive screenshot regions before sharing.
- Batch rename files and download them as a ZIP.
- Show original and optimized file information.
- Show the selected image immediately after upload.
- Preview original and optimized images.
- Download the optimized file.
- Reset the workflow with a Start over button.
- Open the JPG/PNG to PDF converter as its own page from the menu bar.
- Open PDF tools, photo cropper, privacy mask, and batch rename as separate pages from the menu bar.
- Read site introduction, feature overview, and privacy policy sections from the navigation and footer.
- Provide static `about.html`, `features.html`, `privacy.html`, and `contact.html` pages for crawler-friendly policy and trust information.
- Provide SEO metadata, social sharing metadata, structured data, and `robots.txt` for static hosting.
- Switch between light mode and dark mode.
- Process files locally in the browser without a backend.

## Not Included in Version 1.0

- OCR
- Background removal
- User accounts
- Batch image optimization
- Cloud storage
- Automatic sensitive text detection
- Deep PDF image recompression

## Notes

PDF merge, split, and rebuild actions use `pdf-lib` loaded from a CDN. Rebuild can reduce PDF structure overhead, but it does not recompress embedded images or guarantee a smaller file. Files are still processed in the browser and are not uploaded by the app.

## Browser Limits

- Image optimizer, cropper, and blur tools accept JPG/PNG files up to 25 MB each.
- Image to PDF accepts up to 30 images and 120 MB total per batch.
- PDF tools accept up to 20 PDFs, 80 MB per file, and 160 MB total per batch.
- Batch rename accepts up to 100 files, 120 MB per file, and 300 MB total per ZIP.

## Run

Serve the directory with any static server and open `index.html`.

For Cloudflare Workers Static Assets, use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The build command copies the static site into `dist/`, and `wrangler.jsonc` points Cloudflare to that output directory.

## SEO and Deployment Notes

- Update the public production domain before adding a sitemap with absolute URLs.
- Keep the Privacy Policy link visible in the header or footer before applying for advertising review.
- Review the Privacy Policy again before enabling Google AdSense, analytics, consent banners, or any other third-party scripts.

## Privacy

Your files are processed locally in your browser. They are not uploaded or stored on any server.

Contact: minchan0124@gmail.com
