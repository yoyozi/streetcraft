# Homepage Banner Carousel

Drop banner images in **this folder** (`public/banners/`) and they will automatically
appear in the homepage carousel — no upload UI, no database. They are committed to the
repo and updated manually.

## Rules

- **Aspect ratio:** `3:1` — recommended size **1920 x 640 px**.
- **Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`.
- **Order:** images are shown sorted by filename (natural/numeric order), e.g.
  `banner-1.jpg`, `banner-2.jpg`, `banner-10.jpg`.
- This `README.md` is ignored (only image files are picked up).

## How to add/remove

1. Add or delete image files in this folder.
2. Commit and push.
3. Deploy — the carousel reflects whatever images are present.

Images not matching `3:1` will be center-cropped to fit the banner area.
