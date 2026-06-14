export const MAX_BROWSER_FILE_SIZE = 25 * 1024 * 1024;
export const MIN_JPG_QUALITY = 0.35;
export const START_JPG_QUALITY = 0.92;
export const QUALITY_STEP = 0.05;
export const THEME_STORAGE_KEY = "submitready-theme";
export const PDF_LIB_DOWNLOAD_URL = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";

export const MAX_IMAGE_TO_PDF_FILES = 30;
export const MAX_IMAGE_TO_PDF_TOTAL_SIZE = 120 * 1024 * 1024;
export const MAX_PDF_TOOL_FILES = 20;
export const MAX_PDF_TOOL_FILE_SIZE = 80 * 1024 * 1024;
export const MAX_PDF_TOOL_TOTAL_SIZE = 160 * 1024 * 1024;
export const MAX_RENAME_FILES = 100;
export const MAX_RENAME_FILE_SIZE = 120 * 1024 * 1024;
export const MAX_RENAME_TOTAL_SIZE = 300 * 1024 * 1024;

export const cropPresets = {
  id: { width: 600, height: 600 },
  linkedin: { width: 400, height: 400 },
  instagram: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

export const pageMeta = {
  "#imageOptimizer": {
    eyebrow: "Local image optimizer",
    copy: "Prepare images for portals that require a specific format, file size, or maximum dimensions.",
  },
  "#compare": {
    eyebrow: "Optimization result",
    copy: "Compare the source file with the optimized output before downloading.",
  },
  "#pdfConverter": {
    eyebrow: "Image to PDF",
    copy: "Turn JPG and PNG images into a single submission-ready PDF.",
  },
  "#pdfTools": {
    eyebrow: "PDF tools",
    copy: "Merge PDFs, extract selected pages, or rebuild a PDF locally before uploading.",
  },
  "#photoCropper": {
    eyebrow: "Photo cropper",
    copy: "Crop profile, ID, and social photos to exact dimensions without uploading the image.",
  },
  "#privacyBlur": {
    eyebrow: "Privacy mask",
    copy: "Redact sensitive screenshot details manually before sharing or submitting the file.",
  },
  "#batchRename": {
    eyebrow: "Batch rename",
    copy: "Rename groups of files into a consistent submission set and download them as a ZIP.",
  },
  "#about": {
    eyebrow: "About SubmitReady",
    copy: "Learn what this static browser service does and how it fits upload preparation workflows.",
  },
  "#features": {
    eyebrow: "Feature guide",
    copy: "Review the image, PDF, privacy, crop, and file naming tools available in SubmitReady.",
  },
  "#privacy": {
    eyebrow: "Privacy policy",
    copy: "Understand how SubmitReady handles selected files, local preferences, and future advertising notices.",
  },
};

export const pageHashes = Object.keys(pageMeta);

export const presets = {
  profile: {
    outputFormat: "jpg",
    maxFileSize: 1,
    unit: "MB",
    maxWidth: 1000,
    maxHeight: 1000,
  },
  university: {
    outputFormat: "jpg",
    maxFileSize: 2,
    unit: "MB",
    maxWidth: 1600,
    maxHeight: 1600,
  },
  visa: {
    outputFormat: "jpg",
    maxFileSize: 500,
    unit: "KB",
    maxWidth: 1200,
    maxHeight: 1200,
  },
  email: {
    outputFormat: "jpg",
    maxFileSize: 3,
    unit: "MB",
    maxWidth: 2000,
    maxHeight: 2000,
  },
};
