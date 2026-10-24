# Social preview card

The public image is `dist/social-card-v1.jpg` (1200 × 630 JPEG). Both HTML entry points include static Twitter large-image and Open Graph metadata, absolute HTTPS image URLs, descriptive image alt text and creator attribution to @pratikg.

To regenerate the thumbnail, serve the repository root over HTTP and open `/scripts/social/card.html` at a 1200 × 630 viewport. Wait until the body has `data-ready="true"`, then capture that viewport as JPEG. The page renders the actual Week 24 outer-form model with the application’s lighting. Save the result in `dist/` and update the image URL in both HTML files if you change the filename.

`robots.txt` permits the Twitter crawler and other public crawlers. A successful crawler-style HTTP check verifies the markup and image access; the timing and display of X’s cached preview are controlled by X.
