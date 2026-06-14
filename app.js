import {
  MAX_BROWSER_FILE_SIZE,
  MAX_PDF_TOOL_FILES,
  MAX_PDF_TOOL_FILE_SIZE,
  MAX_PDF_TOOL_TOTAL_SIZE,
  MIN_JPG_QUALITY,
  PDF_LIB_DOWNLOAD_URL,
  QUALITY_STEP,
  START_JPG_QUALITY,
  THEME_STORAGE_KEY,
  cropPresets,
  pageHashes,
  pageMeta,
  presets,
} from "./js/config.js";
import { setupBatchRenameController } from "./js/batch-rename-controller.js";
import { setupImagePdfController } from "./js/image-pdf-controller.js";
import {
  bindDropZone,
  canvasToBlob,
  downloadBlob,
  escapeHtml,
  formatBytes,
  getExtension,
  isJpgOrPng,
  loadImageFromFile,
  throwIfCanceled,
  validateFileBatch,
  waitForPaint,
} from "./js/utils.js";

const elements = {
  dropZone: document.querySelector("#dropZone"),
  navBrand: document.querySelector(".nav-brand"),
  pageEyebrow: document.querySelector("#pageEyebrow"),
  pageHeaderCopy: document.querySelector("#pageHeaderCopy"),
  themeToggle: document.querySelector("#themeToggle"),
  themeLabel: document.querySelector("#themeLabel"),
  fileInput: document.querySelector("#fileInput"),
  chooseFileButton: document.querySelector("#chooseFileButton"),
  changeFileButton: document.querySelector("#changeFileButton"),
  clearFileButton: document.querySelector("#clearFileButton"),
  fileState: document.querySelector("#fileState"),
  selectedFileName: document.querySelector("#selectedFileName"),
  selectedFileSize: document.querySelector("#selectedFileSize"),
  uploadPreviewState: document.querySelector("#uploadPreviewState"),
  uploadPreview: document.querySelector("#uploadPreview"),
  errorMessage: document.querySelector("#errorMessage"),
  statusMessage: document.querySelector("#statusMessage"),
  warningMessage: document.querySelector("#warningMessage"),
  requirementsForm: document.querySelector("#requirementsForm"),
  outputFormat: document.querySelector("#outputFormat"),
  maxFileSize: document.querySelector("#maxFileSize"),
  fileSizeUnit: document.querySelector("#fileSizeUnit"),
  maxWidth: document.querySelector("#maxWidth"),
  maxHeight: document.querySelector("#maxHeight"),
  autoQuality: document.querySelector("#autoQuality"),
  qualitySlider: document.querySelector("#qualitySlider"),
  qualityValue: document.querySelector("#qualityValue"),
  optimizeButton: document.querySelector("#optimizeButton"),
  originalInfo: document.querySelector("#originalInfo"),
  optimizedInfo: document.querySelector("#optimizedInfo"),
  originalPreview: document.querySelector("#originalPreview"),
  optimizedPreview: document.querySelector("#optimizedPreview"),
  originalPlaceholder: document.querySelector("#originalPlaceholder"),
  optimizedPlaceholder: document.querySelector("#optimizedPlaceholder"),
  resultsSection: document.querySelector("#compare"),
  startOverButton: document.querySelector("#startOverButton"),
  downloadButton: document.querySelector("#downloadButton"),
  imageOptimizer: document.querySelector("#imageOptimizer"),
  privacyNotice: document.querySelector("#privacyNotice"),
  homeContent: document.querySelector("#homeContent"),
  pdfConverter: document.querySelector("#pdfConverter"),
  closePdfConverterButton: document.querySelector("#closePdfConverterButton"),
  pdfTools: document.querySelector("#pdfTools"),
  pdfToolsDropZone: document.querySelector("#pdfToolsDropZone"),
  pdfToolsFileInput: document.querySelector("#pdfToolsFileInput"),
  choosePdfToolFilesButton: document.querySelector("#choosePdfToolFilesButton"),
  closePdfToolsButton: document.querySelector("#closePdfToolsButton"),
  pdfToolModeInputs: document.querySelectorAll('input[name="pdfToolMode"]'),
  pdfSplitField: document.querySelector("#pdfSplitField"),
  pdfSplitRanges: document.querySelector("#pdfSplitRanges"),
  pdfToolsFileList: document.querySelector("#pdfToolsFileList"),
  pdfToolsErrorMessage: document.querySelector("#pdfToolsErrorMessage"),
  pdfToolsStatusMessage: document.querySelector("#pdfToolsStatusMessage"),
  clearPdfToolFilesButton: document.querySelector("#clearPdfToolFilesButton"),
  runPdfToolButton: document.querySelector("#runPdfToolButton"),
  cancelPdfToolButton: document.querySelector("#cancelPdfToolButton"),
  downloadPdfToolButton: document.querySelector("#downloadPdfToolButton"),
  photoCropper: document.querySelector("#photoCropper"),
  cropperCanvas: document.querySelector("#cropperCanvas"),
  cropperFileInput: document.querySelector("#cropperFileInput"),
  chooseCropperFileButton: document.querySelector("#chooseCropperFileButton"),
  closeCropperButton: document.querySelector("#closeCropperButton"),
  cropPreset: document.querySelector("#cropPreset"),
  cropWidth: document.querySelector("#cropWidth"),
  cropHeight: document.querySelector("#cropHeight"),
  cropZoom: document.querySelector("#cropZoom"),
  cropZoomValue: document.querySelector("#cropZoomValue"),
  cropFormat: document.querySelector("#cropFormat"),
  cropperStatusMessage: document.querySelector("#cropperStatusMessage"),
  cropperErrorMessage: document.querySelector("#cropperErrorMessage"),
  resetCropButton: document.querySelector("#resetCropButton"),
  downloadCropButton: document.querySelector("#downloadCropButton"),
  privacyBlur: document.querySelector("#privacyBlur"),
  blurCanvas: document.querySelector("#blurCanvas"),
  blurFileInput: document.querySelector("#blurFileInput"),
  chooseBlurFileButton: document.querySelector("#chooseBlurFileButton"),
  closeBlurButton: document.querySelector("#closeBlurButton"),
  blurStrength: document.querySelector("#blurStrength"),
  blurStrengthValue: document.querySelector("#blurStrengthValue"),
  privacyModeInputs: document.querySelectorAll('input[name="privacyMode"]'),
  redactColor: document.querySelector("#redactColor"),
  redactColorField: document.querySelector("#redactColorField"),
  blurFormat: document.querySelector("#blurFormat"),
  blurStatusMessage: document.querySelector("#blurStatusMessage"),
  blurErrorMessage: document.querySelector("#blurErrorMessage"),
  undoBlurButton: document.querySelector("#undoBlurButton"),
  clearBlurButton: document.querySelector("#clearBlurButton"),
  downloadBlurButton: document.querySelector("#downloadBlurButton"),
  batchRename: document.querySelector("#batchRename"),
  closeRenameButton: document.querySelector("#closeRenameButton"),
  routePages: document.querySelectorAll(".route-page"),
};

const state = {
  selectedFile: null,
  originalUrl: null,
  optimizedUrl: null,
  hasOptimizedResult: false,
  originalInfo: null,
  pdfToolFiles: [],
  pdfToolUrl: null,
  pdfToolCancelRequested: false,
  cropImage: null,
  cropFileName: "",
  cropOffsetX: 0,
  cropOffsetY: 0,
  cropDragging: false,
  cropLastPoint: null,
  blurImage: null,
  blurFileName: "",
  blurRects: [],
  blurDraftRect: null,
  blurDrawing: false,
  blurScale: 1,
};

initialize();

function initialize() {
  initializeTheme();
  applyPreset("university");
  bindEvents();
  setupImagePdfController();
  setupBatchRenameController();
  navigateToPage(getInitialPageHash(), { replace: true, focus: false });
}

function bindEvents() {
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.addEventListener(eventName, preventBrowserFileOpen);
  });

  elements.chooseFileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.fileInput.click();
  });
  elements.changeFileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.fileInput.click();
  });
  elements.dropZone.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      elements.dropZone.classList.add("drag-over");
    });
  });

  elements.dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!elements.dropZone.contains(event.relatedTarget)) {
      elements.dropZone.classList.remove("drag-over");
    }
  });

  elements.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    elements.dropZone.classList.remove("drag-over");

    const file = getDroppedFile(event.dataTransfer);
    if (file) {
      handleFile(file);
    } else {
      showError("Unsupported file format. Please upload a JPG or PNG image.");
    }
  });

  document.addEventListener("drop", (event) => {
    const isInsideTool =
      elements.dropZone.contains(event.target) ||
      elements.pdfConverter.contains(event.target) ||
      elements.pdfTools.contains(event.target) ||
      elements.photoCropper.contains(event.target) ||
      elements.privacyBlur.contains(event.target) ||
      elements.batchRename.contains(event.target);

    if (isInsideTool) {
      return;
    }

    const file = getDroppedFile(event.dataTransfer);
    if (file) {
      handleFile(file);
    }
  });

  elements.clearFileButton.addEventListener("click", clearFile);
  elements.startOverButton.addEventListener("click", resetToStart);
  elements.themeToggle.addEventListener("click", toggleTheme);
  document.querySelectorAll(".top-nav a[href^='#']").forEach((link) => {
    link.addEventListener("click", handleMenuLink);
  });

  document.querySelectorAll('input[name="preset"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      applyPreset(event.target.value);
    });
  });

  [elements.outputFormat, elements.maxFileSize, elements.fileSizeUnit, elements.maxWidth, elements.maxHeight].forEach(
    (input) => {
      input.addEventListener("input", () => {
        selectCustomPreset();
        resetOptimizedResult();
      });
    },
  );

  elements.autoQuality.addEventListener("change", () => {
    elements.qualitySlider.disabled = elements.autoQuality.checked;
    resetOptimizedResult();
  });

  elements.qualitySlider.addEventListener("input", () => {
    elements.qualityValue.textContent = `${elements.qualitySlider.value}%`;
    selectCustomPreset();
    resetOptimizedResult();
  });

  elements.requirementsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await optimizeSelectedFile();
  });

  elements.closePdfConverterButton.addEventListener("click", closePdfConverter);

  elements.choosePdfToolFilesButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.pdfToolsFileInput.click();
  });
  elements.pdfToolsDropZone.addEventListener("click", () => elements.pdfToolsFileInput.click());
  elements.pdfToolsFileInput.addEventListener("change", (event) => {
    addPdfToolFiles(event.target.files);
    elements.pdfToolsFileInput.value = "";
  });
  bindDropZone(elements.pdfToolsDropZone, (files) => addPdfToolFiles(files));
  elements.pdfToolModeInputs.forEach((input) => input.addEventListener("change", updatePdfToolMode));
  elements.pdfSplitRanges.addEventListener("input", resetPdfToolDownload);
  elements.clearPdfToolFilesButton.addEventListener("click", clearPdfToolFiles);
  elements.runPdfToolButton.addEventListener("click", runPdfTool);
  elements.cancelPdfToolButton.addEventListener("click", () => {
    state.pdfToolCancelRequested = true;
    elements.cancelPdfToolButton.disabled = true;
    showToolStatus(elements.pdfToolsStatusMessage, "Canceling PDF task...");
  });
  elements.closePdfToolsButton.addEventListener("click", () => navigateToPage("#imageOptimizer"));

  elements.chooseCropperFileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.cropperFileInput.click();
  });
  elements.cropperFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      loadCropperFile(file);
    }
    elements.cropperFileInput.value = "";
  });
  elements.cropPreset.addEventListener("change", applyCropPreset);
  [elements.cropWidth, elements.cropHeight].forEach((input) => {
    input.addEventListener("input", () => {
      elements.cropPreset.value = "custom";
      drawCropper();
    });
  });
  elements.cropFormat.addEventListener("input", drawCropper);
  elements.cropZoom.addEventListener("input", () => {
    elements.cropZoomValue.textContent = `${elements.cropZoom.value}%`;
    drawCropper();
  });
  elements.cropperCanvas.addEventListener("pointerdown", startCropDrag);
  elements.cropperCanvas.addEventListener("pointermove", moveCropDrag);
  elements.cropperCanvas.addEventListener("pointerup", endCropDrag);
  elements.cropperCanvas.addEventListener("pointerleave", endCropDrag);
  elements.resetCropButton.addEventListener("click", resetCropPosition);
  elements.downloadCropButton.addEventListener("click", downloadCrop);
  elements.closeCropperButton.addEventListener("click", () => navigateToPage("#imageOptimizer"));

  elements.chooseBlurFileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.blurFileInput.click();
  });
  elements.blurFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      loadBlurFile(file);
    }
    elements.blurFileInput.value = "";
  });
  elements.blurStrength.addEventListener("input", () => {
    updatePrivacyMode();
  });
  elements.privacyModeInputs.forEach((input) => input.addEventListener("change", updatePrivacyMode));
  elements.redactColor.addEventListener("input", drawBlurCanvas);
  elements.blurFormat.addEventListener("input", drawBlurCanvas);
  elements.blurCanvas.addEventListener("pointerdown", startBlurRect);
  elements.blurCanvas.addEventListener("pointermove", moveBlurRect);
  elements.blurCanvas.addEventListener("pointerup", finishBlurRect);
  elements.blurCanvas.addEventListener("pointerleave", finishBlurRect);
  elements.undoBlurButton.addEventListener("click", undoBlurRect);
  elements.clearBlurButton.addEventListener("click", clearBlurRects);
  elements.downloadBlurButton.addEventListener("click", downloadBlurImage);
  elements.closeBlurButton.addEventListener("click", () => navigateToPage("#imageOptimizer"));

  elements.closeRenameButton.addEventListener("click", () => navigateToPage("#imageOptimizer"));
  window.addEventListener("hashchange", () => navigateToPage(getInitialPageHash(), { replace: true, focus: false }));
  window.addEventListener("popstate", () => navigateToPage(getInitialPageHash(), { replace: true, focus: false }));

  updatePdfToolMode();
  updatePrivacyMode();
  drawCropper();
  drawBlurCanvas();
}

function handleMenuLink(event) {
  const hash = event.currentTarget.getAttribute("href");
  event.preventDefault();
  navigateToPage(hash || "#imageOptimizer");
}

function openPdfConverter() {
  navigateToPage("#pdfConverter");
}

function closePdfConverter() {
  navigateToPage("#imageOptimizer");
}

function getInitialPageHash() {
  return normalizePageHash(window.location.hash || "#imageOptimizer");
}

function normalizePageHash(hash) {
  if (hash === "#compare" && !state.hasOptimizedResult) {
    return "#imageOptimizer";
  }
  return pageHashes.includes(hash) ? hash : "#imageOptimizer";
}

function navigateToPage(hash, options = { replace: false, focus: true }) {
  const normalizedHash = normalizePageHash(hash);
  const isImagePage = normalizedHash === "#imageOptimizer" || normalizedHash === "#compare";
  const toolPages = [elements.pdfConverter, elements.pdfTools, elements.photoCropper, elements.privacyBlur, elements.batchRename];

  elements.imageOptimizer.hidden = !isImagePage;
  elements.resultsSection.hidden = !isImagePage || !state.hasOptimizedResult;
  elements.privacyNotice.hidden = !isImagePage;
  elements.homeContent.hidden = !isImagePage;
  toolPages.forEach((page) => {
    page.hidden = `#${page.id}` !== normalizedHash;
  });
  elements.routePages.forEach((page) => {
    page.hidden = `#${page.id}` !== normalizedHash;
  });

  setActiveMenu(isImagePage ? "#imageOptimizer" : normalizedHash);
  updatePageHeader(normalizedHash);

  if (options.replace) {
    history.replaceState(null, "", normalizedHash);
  } else {
    history.pushState(null, "", normalizedHash);
  }

  const target = normalizedHash === "#compare" ? elements.resultsSection : document.querySelector(normalizedHash);
  target?.scrollIntoView({ behavior: "auto", block: "start" });

  if (options.focus && !isImagePage) {
    const focusTarget = target.querySelector("button, input, select, canvas, a[href]");
    focusTarget?.focus();
  }
}

function updatePageHeader(hash) {
  const meta = pageMeta[hash] || pageMeta["#imageOptimizer"];
  elements.pageEyebrow.textContent = meta.eyebrow;
  elements.pageHeaderCopy.textContent = meta.copy;
}

function setActiveMenu(hash) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === hash) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function getSelectedPdfToolMode() {
  return document.querySelector('input[name="pdfToolMode"]:checked')?.value || "merge";
}

function updatePdfToolMode() {
  const mode = getSelectedPdfToolMode();
  const labels = {
    merge: "Merge PDFs",
    split: "Split PDF",
    rebuild: "Rebuild PDF",
  };

  elements.pdfSplitField.hidden = mode !== "split";
  elements.runPdfToolButton.textContent = labels[mode];
  resetPdfToolDownload();
  renderPdfToolFileList();
}

function addPdfToolFiles(fileList) {
  clearToolMessage(elements.pdfToolsErrorMessage, elements.pdfToolsStatusMessage);
  const files = Array.from(fileList || []).filter((file) => file.type === "application/pdf" || getExtension(file.name) === "pdf");

  if (!files.length) {
    showToolError(elements.pdfToolsErrorMessage, elements.pdfToolsStatusMessage, "Please add PDF files.");
    return;
  }

  const nextFiles = [...state.pdfToolFiles, ...files];
  const validationError = validateFileBatch(nextFiles, {
    label: "PDF tools",
    maxFiles: MAX_PDF_TOOL_FILES,
    maxFileSize: MAX_PDF_TOOL_FILE_SIZE,
    maxTotalSize: MAX_PDF_TOOL_TOTAL_SIZE,
  });

  if (validationError) {
    showToolError(elements.pdfToolsErrorMessage, elements.pdfToolsStatusMessage, validationError);
    return;
  }

  state.pdfToolFiles = nextFiles;
  resetPdfToolDownload();
  renderPdfToolFileList();
}

function renderPdfToolFileList() {
  const mode = getSelectedPdfToolMode();
  elements.pdfToolsFileList.hidden = state.pdfToolFiles.length === 0;
  elements.clearPdfToolFilesButton.disabled = state.pdfToolFiles.length === 0;
  elements.runPdfToolButton.disabled =
    state.pdfToolFiles.length === 0 || (mode === "merge" && state.pdfToolFiles.length < 2) || (mode !== "merge" && state.pdfToolFiles.length !== 1);

  if (!state.pdfToolFiles.length) {
    elements.pdfToolsFileList.innerHTML = "";
    return;
  }

  elements.pdfToolsFileList.innerHTML = state.pdfToolFiles
    .map(
      (file, index) => `
        <div>
          <span>${index + 1}</span>
          <strong>${escapeHtml(file.name)}</strong>
          <small>${formatBytes(file.size)}</small>
        </div>
      `,
    )
    .join("");
}

function clearPdfToolFiles() {
  state.pdfToolFiles = [];
  elements.pdfToolsFileInput.value = "";
  renderPdfToolFileList();
  resetPdfToolDownload();
  clearToolMessage(elements.pdfToolsErrorMessage, elements.pdfToolsStatusMessage);
}

async function runPdfTool() {
  const mode = getSelectedPdfToolMode();
  clearToolMessage(elements.pdfToolsErrorMessage, elements.pdfToolsStatusMessage);
  resetPdfToolDownload();

  if (!window.PDFLib) {
    showToolError(
      elements.pdfToolsErrorMessage,
      elements.pdfToolsStatusMessage,
      `PDF tools need the browser library from ${PDF_LIB_DOWNLOAD_URL}. Check your connection and reload this page.`,
    );
    return;
  }

  try {
    elements.runPdfToolButton.disabled = true;
    elements.cancelPdfToolButton.disabled = false;
    state.pdfToolCancelRequested = false;
    showToolStatus(elements.pdfToolsStatusMessage, mode === "merge" ? "Merging PDFs locally..." : "Processing PDF locally...");

    if (mode === "merge") {
      await mergePdfFiles();
    } else if (mode === "split") {
      await splitPdfFile();
    } else {
      await rebuildPdfFile();
    }
  } catch (error) {
    if (error.message === "Task canceled.") {
      showToolStatus(elements.pdfToolsStatusMessage, "PDF task canceled.");
    } else {
      showToolError(
        elements.pdfToolsErrorMessage,
        elements.pdfToolsStatusMessage,
        error.message || "Unable to process this PDF. Encrypted or damaged PDFs may not be supported.",
      );
    }
  } finally {
    state.pdfToolCancelRequested = false;
    elements.cancelPdfToolButton.disabled = true;
    renderPdfToolFileList();
  }
}

async function mergePdfFiles() {
  if (state.pdfToolFiles.length < 2) {
    throw new Error("Add at least two PDFs to merge.");
  }

  const { PDFDocument } = window.PDFLib;
  const mergedPdf = await PDFDocument.create();
  let pageCount = 0;

  for (const [fileIndex, file] of state.pdfToolFiles.entries()) {
    throwIfCanceled(() => state.pdfToolCancelRequested);
    showToolStatus(elements.pdfToolsStatusMessage, `Reading PDF ${fileIndex + 1} of ${state.pdfToolFiles.length}: ${file.name}`);
    await waitForPaint();
    const sourcePdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => {
      mergedPdf.addPage(page);
      pageCount += 1;
    });
  }

  throwIfCanceled(() => state.pdfToolCancelRequested);
  showToolStatus(elements.pdfToolsStatusMessage, "Writing merged PDF...");
  await waitForPaint();
  const bytes = await mergedPdf.save({ useObjectStreams: true, addDefaultPage: false });
  setPdfToolDownload(bytes, "submitready_merged.pdf", `Merged ${state.pdfToolFiles.length} PDFs into ${pageCount} pages.`);
}

async function splitPdfFile() {
  if (state.pdfToolFiles.length !== 1) {
    throw new Error("Add exactly one PDF to split pages.");
  }

  const { PDFDocument } = window.PDFLib;
  throwIfCanceled(() => state.pdfToolCancelRequested);
  showToolStatus(elements.pdfToolsStatusMessage, "Reading source PDF...");
  await waitForPaint();
  const sourcePdf = await PDFDocument.load(await state.pdfToolFiles[0].arrayBuffer(), { ignoreEncryption: true });
  const indices = parsePageRanges(elements.pdfSplitRanges.value, sourcePdf.getPageCount());
  const splitPdf = await PDFDocument.create();
  const pages = await splitPdf.copyPages(sourcePdf, indices);
  pages.forEach((page) => splitPdf.addPage(page));

  throwIfCanceled(() => state.pdfToolCancelRequested);
  showToolStatus(elements.pdfToolsStatusMessage, `Writing ${indices.length} extracted page${indices.length === 1 ? "" : "s"}...`);
  await waitForPaint();
  const bytes = await splitPdf.save({ useObjectStreams: true, addDefaultPage: false });
  setPdfToolDownload(bytes, "submitready_pages.pdf", `Extracted ${indices.length} page${indices.length === 1 ? "" : "s"}.`);
}

async function rebuildPdfFile() {
  if (state.pdfToolFiles.length !== 1) {
    throw new Error("Add exactly one PDF to rebuild.");
  }

  const { PDFDocument } = window.PDFLib;
  const sourceFile = state.pdfToolFiles[0];
  throwIfCanceled(() => state.pdfToolCancelRequested);
  showToolStatus(elements.pdfToolsStatusMessage, "Reading source PDF...");
  await waitForPaint();
  const sourcePdf = await PDFDocument.load(await sourceFile.arrayBuffer(), { ignoreEncryption: true });
  const optimizedPdf = await PDFDocument.create();
  const pages = await optimizedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach((page) => optimizedPdf.addPage(page));

  throwIfCanceled(() => state.pdfToolCancelRequested);
  showToolStatus(elements.pdfToolsStatusMessage, "Writing rebuilt PDF...");
  await waitForPaint();
  const bytes = await optimizedPdf.save({ useObjectStreams: true, addDefaultPage: false });
  const savedBytes = sourceFile.size - bytes.length;
  const result = savedBytes > 0 ? `Rebuilt PDF and saved ${formatBytes(savedBytes)}.` : "Rebuilt the PDF, but this file was already compact.";
  setPdfToolDownload(bytes, "submitready_rebuilt.pdf", result);
}

function parsePageRanges(value, pageCount) {
  const ranges = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const pages = new Set();

  ranges.forEach((range) => {
    const match = range.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error("Use page ranges like 1-3, 5, 8-10.");
    }

    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Pages must be between 1 and ${pageCount}.`);
    }

    for (let page = start; page <= end; page += 1) {
      pages.add(page - 1);
    }
  });

  if (!pages.size) {
    throw new Error("Enter at least one page to extract.");
  }

  return [...pages].sort((a, b) => a - b);
}

function setPdfToolDownload(bytes, fileName, message) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  state.pdfToolUrl = url;
  elements.downloadPdfToolButton.href = url;
  elements.downloadPdfToolButton.download = fileName;
  elements.downloadPdfToolButton.classList.remove("disabled");
  elements.downloadPdfToolButton.setAttribute("aria-disabled", "false");
  showToolStatus(elements.pdfToolsStatusMessage, `${message} Output: ${formatBytes(blob.size)}.`);
}

function resetPdfToolDownload() {
  if (state.pdfToolUrl) {
    URL.revokeObjectURL(state.pdfToolUrl);
    state.pdfToolUrl = null;
  }

  elements.downloadPdfToolButton.removeAttribute("href");
  elements.downloadPdfToolButton.removeAttribute("download");
  elements.downloadPdfToolButton.classList.add("disabled");
  elements.downloadPdfToolButton.setAttribute("aria-disabled", "true");
}

async function loadCropperFile(file) {
  clearToolMessage(elements.cropperErrorMessage, elements.cropperStatusMessage);
  if (!isJpgOrPng(file)) {
    showToolError(elements.cropperErrorMessage, elements.cropperStatusMessage, "Please choose a JPG or PNG image.");
    return;
  }

  if (file.size > MAX_BROWSER_FILE_SIZE) {
    showToolError(elements.cropperErrorMessage, elements.cropperStatusMessage, `This image is too large. Maximum: ${formatBytes(MAX_BROWSER_FILE_SIZE)}.`);
    return;
  }

  try {
    state.cropImage = await loadImageFromFile(file);
    state.cropFileName = file.name;
    resetCropPosition();
    elements.resetCropButton.disabled = false;
    elements.downloadCropButton.disabled = false;
    showToolStatus(elements.cropperStatusMessage, "Drag the image to position it inside the crop.");
  } catch {
    showToolError(elements.cropperErrorMessage, elements.cropperStatusMessage, "This browser could not read that image.");
  }
}

function applyCropPreset() {
  const preset = cropPresets[elements.cropPreset.value];
  if (preset) {
    elements.cropWidth.value = preset.width;
    elements.cropHeight.value = preset.height;
  }
  drawCropper();
}

function resetCropPosition() {
  state.cropOffsetX = 0;
  state.cropOffsetY = 0;
  elements.cropZoom.value = 100;
  elements.cropZoomValue.textContent = "100%";
  drawCropper();
}

function drawCropper() {
  const canvas = elements.cropperCanvas;
  const context = canvas.getContext("2d");
  const frame = getCropFrame();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--preview-bg").trim() || "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawCheckerboard(context, canvas.width, canvas.height);

  if (!state.cropImage) {
    drawCanvasPlaceholder(context, canvas, "Choose a photo to crop");
    drawCropFrame(context, frame);
    return;
  }

  const draw = getCropDraw(frame);
  context.save();
  context.beginPath();
  context.rect(frame.x, frame.y, frame.width, frame.height);
  context.clip();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(state.cropImage, draw.x, draw.y, draw.width, draw.height);
  context.restore();

  context.save();
  context.fillStyle = "rgba(8, 12, 18, 0.48)";
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.rect(frame.x, frame.y, frame.width, frame.height);
  context.fill("evenodd");
  context.restore();
  drawCropFrame(context, frame);
}

function getCropFrame() {
  const canvas = elements.cropperCanvas;
  const targetWidth = Math.max(1, Number(elements.cropWidth.value) || 600);
  const targetHeight = Math.max(1, Number(elements.cropHeight.value) || 600);
  const margin = 46;
  const scale = Math.min((canvas.width - margin * 2) / targetWidth, (canvas.height - margin * 2) / targetHeight);
  const width = Math.round(targetWidth * scale);
  const height = Math.round(targetHeight * scale);

  return {
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width,
    height,
  };
}

function getCropDraw(frame) {
  const image = state.cropImage;
  const zoom = Number(elements.cropZoom.value) / 100;
  const baseScale = Math.max(frame.width / image.naturalWidth, frame.height / image.naturalHeight);
  const scale = baseScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  let x = frame.x + (frame.width - width) / 2 + state.cropOffsetX;
  let y = frame.y + (frame.height - height) / 2 + state.cropOffsetY;

  if (width > frame.width) {
    x = Math.min(frame.x, Math.max(frame.x + frame.width - width, x));
  } else {
    x = frame.x + (frame.width - width) / 2;
  }

  if (height > frame.height) {
    y = Math.min(frame.y, Math.max(frame.y + frame.height - height, y));
  } else {
    y = frame.y + (frame.height - height) / 2;
  }

  state.cropOffsetX = x - (frame.x + (frame.width - width) / 2);
  state.cropOffsetY = y - (frame.y + (frame.height - height) / 2);

  return { x, y, width, height, scale };
}

function startCropDrag(event) {
  if (!state.cropImage) {
    return;
  }
  elements.cropperCanvas.setPointerCapture(event.pointerId);
  state.cropDragging = true;
  state.cropLastPoint = getCanvasPoint(elements.cropperCanvas, event);
}

function moveCropDrag(event) {
  if (!state.cropDragging || !state.cropLastPoint) {
    return;
  }

  const point = getCanvasPoint(elements.cropperCanvas, event);
  state.cropOffsetX += point.x - state.cropLastPoint.x;
  state.cropOffsetY += point.y - state.cropLastPoint.y;
  state.cropLastPoint = point;
  drawCropper();
}

function endCropDrag(event) {
  if (state.cropDragging && elements.cropperCanvas.hasPointerCapture(event.pointerId)) {
    elements.cropperCanvas.releasePointerCapture(event.pointerId);
  }
  state.cropDragging = false;
  state.cropLastPoint = null;
}

async function downloadCrop() {
  if (!state.cropImage) {
    return;
  }

  const targetWidth = Math.max(1, Number(elements.cropWidth.value) || 600);
  const targetHeight = Math.max(1, Number(elements.cropHeight.value) || 600);
  const frame = getCropFrame();
  const draw = getCropDraw(frame);
  const outputCanvas = document.createElement("canvas");
  const context = outputCanvas.getContext("2d", { alpha: elements.cropFormat.value === "png" });
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  if (elements.cropFormat.value === "jpg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetWidth, targetHeight);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    state.cropImage,
    (frame.x - draw.x) / draw.scale,
    (frame.y - draw.y) / draw.scale,
    frame.width / draw.scale,
    frame.height / draw.scale,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  const format = elements.cropFormat.value;
  const blob = await canvasToBlob(outputCanvas, format === "jpg" ? "image/jpeg" : "image/png", 0.92);
  downloadBlob(blob, buildOutputFileName(state.cropFileName || "photo", format).replace("submitready_", "submitready_crop_"));
  showToolStatus(elements.cropperStatusMessage, `Crop downloaded: ${targetWidth} x ${targetHeight} px, ${formatBytes(blob.size)}.`);
}

async function loadBlurFile(file) {
  clearToolMessage(elements.blurErrorMessage, elements.blurStatusMessage);
  if (!file.type.startsWith("image/") && !["jpg", "jpeg", "png"].includes(getExtension(file.name))) {
    showToolError(elements.blurErrorMessage, elements.blurStatusMessage, "Please choose a JPG or PNG screenshot.");
    return;
  }

  if (file.size > MAX_BROWSER_FILE_SIZE) {
    showToolError(elements.blurErrorMessage, elements.blurStatusMessage, `This screenshot is too large. Maximum: ${formatBytes(MAX_BROWSER_FILE_SIZE)}.`);
    return;
  }

  try {
    state.blurImage = await loadImageFromFile(file);
    state.blurFileName = file.name;
    state.blurRects = [];
    state.blurDraftRect = null;
    prepareBlurCanvas();
    drawBlurCanvas();
    updateBlurButtons();
    showToolStatus(elements.blurStatusMessage, "Drag rectangles over details you want to hide.");
  } catch {
    showToolError(elements.blurErrorMessage, elements.blurStatusMessage, "This browser could not read that screenshot.");
  }
}

function prepareBlurCanvas() {
  const canvas = elements.blurCanvas;
  const maxWidth = 920;
  const maxHeight = 620;
  const image = state.blurImage;
  state.blurScale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  canvas.width = Math.round(image.naturalWidth * state.blurScale);
  canvas.height = Math.round(image.naturalHeight * state.blurScale);
}

function drawBlurCanvas() {
  const canvas = elements.blurCanvas;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--preview-bg").trim() || "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!state.blurImage) {
    drawCanvasPlaceholder(context, canvas, "Choose a screenshot to edit");
    return;
  }

  context.drawImage(state.blurImage, 0, 0, canvas.width, canvas.height);
  [...state.blurRects, state.blurDraftRect].filter(Boolean).forEach((rect) => {
    drawPrivacyMask(context, {
      rect,
      sourceImage: state.blurImage,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      strength: Number(elements.blurStrength.value),
      mode: getPrivacyMode(),
      redactColor: elements.redactColor.value,
      showOutline: true,
    });
  });
}

function getPrivacyMode() {
  return document.querySelector('input[name="privacyMode"]:checked')?.value || "redact";
}

function updatePrivacyMode() {
  const mode = getPrivacyMode();
  elements.redactColorField.hidden = mode !== "redact";
  elements.blurStrength.disabled = mode === "redact";

  if (mode === "redact") {
    elements.blurStrengthValue.textContent = "solid";
  } else if (mode === "pixelate") {
    elements.blurStrengthValue.textContent = `${elements.blurStrength.value} px blocks`;
  } else {
    elements.blurStrengthValue.textContent = `${elements.blurStrength.value} px`;
  }

  drawBlurCanvas();
}

function drawPrivacyMask(context, options) {
  const { rect, sourceImage, canvasWidth, canvasHeight, strength, mode, redactColor, showOutline } = options;
  const normalized = normalizeRect(rect);
  if (normalized.width < 2 || normalized.height < 2) {
    return;
  }

  if (mode === "redact") {
    context.save();
    context.fillStyle = redactColor;
    context.fillRect(normalized.x, normalized.y, normalized.width, normalized.height);
    context.restore();
  } else if (mode === "pixelate") {
    drawPixelatedRect(context, sourceImage, normalized, canvasWidth, canvasHeight, strength);
  } else {
    context.save();
    context.beginPath();
    context.rect(normalized.x, normalized.y, normalized.width, normalized.height);
    context.clip();
    context.filter = `blur(${strength}px)`;
    context.drawImage(sourceImage, 0, 0, canvasWidth, canvasHeight);
    context.restore();
  }

  if (!showOutline) {
    return;
  }

  context.save();
  context.strokeStyle = "rgba(23, 105, 224, 0.95)";
  context.lineWidth = 2;
  context.setLineDash([8, 5]);
  context.strokeRect(normalized.x + 1, normalized.y + 1, normalized.width - 2, normalized.height - 2);
  context.restore();
}

function drawPixelatedRect(context, sourceImage, rect, canvasWidth, canvasHeight, strength) {
  const blockSize = Math.max(4, Math.round(strength));
  const sampleWidth = Math.max(1, Math.ceil(rect.width / blockSize));
  const sampleHeight = Math.max(1, Math.ceil(rect.height / blockSize));
  const sampleCanvas = document.createElement("canvas");
  const sampleContext = sampleCanvas.getContext("2d", { alpha: false });
  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;

  sampleContext.imageSmoothingEnabled = true;
  sampleContext.drawImage(
    sourceImage,
    (rect.x / canvasWidth) * sourceImage.naturalWidth,
    (rect.y / canvasHeight) * sourceImage.naturalHeight,
    (rect.width / canvasWidth) * sourceImage.naturalWidth,
    (rect.height / canvasHeight) * sourceImage.naturalHeight,
    0,
    0,
    sampleWidth,
    sampleHeight,
  );

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(sampleCanvas, 0, 0, sampleWidth, sampleHeight, rect.x, rect.y, rect.width, rect.height);
  context.restore();
}

function startBlurRect(event) {
  if (!state.blurImage) {
    return;
  }
  elements.blurCanvas.setPointerCapture(event.pointerId);
  const point = getCanvasPoint(elements.blurCanvas, event);
  state.blurDrawing = true;
  state.blurDraftRect = { x: point.x, y: point.y, width: 0, height: 0 };
}

function moveBlurRect(event) {
  if (!state.blurDrawing || !state.blurDraftRect) {
    return;
  }

  const point = getCanvasPoint(elements.blurCanvas, event);
  state.blurDraftRect.width = point.x - state.blurDraftRect.x;
  state.blurDraftRect.height = point.y - state.blurDraftRect.y;
  drawBlurCanvas();
}

function finishBlurRect(event) {
  if (!state.blurDrawing) {
    return;
  }

  if (elements.blurCanvas.hasPointerCapture(event.pointerId)) {
    elements.blurCanvas.releasePointerCapture(event.pointerId);
  }

  const rect = normalizeRect(state.blurDraftRect);
  if (rect.width > 8 && rect.height > 8) {
    state.blurRects.push(rect);
  }
  state.blurDraftRect = null;
  state.blurDrawing = false;
  drawBlurCanvas();
  updateBlurButtons();
}

function undoBlurRect() {
  state.blurRects.pop();
  drawBlurCanvas();
  updateBlurButtons();
}

function clearBlurRects() {
  state.blurRects = [];
  drawBlurCanvas();
  updateBlurButtons();
}

function updateBlurButtons() {
  const hasImage = Boolean(state.blurImage);
  const hasRects = state.blurRects.length > 0;
  elements.undoBlurButton.disabled = !hasRects;
  elements.clearBlurButton.disabled = !hasRects;
  elements.downloadBlurButton.disabled = !hasImage;
}

async function downloadBlurImage() {
  if (!state.blurImage) {
    return;
  }

  const outputCanvas = document.createElement("canvas");
  const context = outputCanvas.getContext("2d", { alpha: elements.blurFormat.value === "png" });
  outputCanvas.width = state.blurImage.naturalWidth;
  outputCanvas.height = state.blurImage.naturalHeight;

  if (elements.blurFormat.value === "jpg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  }

  context.drawImage(state.blurImage, 0, 0, outputCanvas.width, outputCanvas.height);
  state.blurRects.forEach((rect) => {
    const fullRect = {
      x: rect.x / state.blurScale,
      y: rect.y / state.blurScale,
      width: rect.width / state.blurScale,
      height: rect.height / state.blurScale,
    };
    drawPrivacyMask(context, {
      rect: fullRect,
      sourceImage: state.blurImage,
      canvasWidth: outputCanvas.width,
      canvasHeight: outputCanvas.height,
      strength: Math.max(8, Number(elements.blurStrength.value) / state.blurScale),
      mode: getPrivacyMode(),
      redactColor: elements.redactColor.value,
      showOutline: false,
    });
  });

  const format = elements.blurFormat.value;
  const blob = await canvasToBlob(outputCanvas, format === "jpg" ? "image/jpeg" : "image/png", 0.92);
  downloadBlob(blob, buildOutputFileName(state.blurFileName || "screenshot", format).replace("submitready_", "submitready_safe_"));
  showToolStatus(elements.blurStatusMessage, `Safe image downloaded with ${state.blurRects.length} hidden area${state.blurRects.length === 1 ? "" : "s"}.`);
}

function drawCheckerboard(context, width, height) {
  const size = 20;
  context.save();
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      context.fillStyle = (x / size + y / size) % 2 === 0 ? "rgba(148, 163, 184, 0.14)" : "rgba(148, 163, 184, 0.04)";
      context.fillRect(x, y, size, size);
    }
  }
  context.restore();
}

function drawCropFrame(context, frame) {
  context.save();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.strokeRect(frame.x, frame.y, frame.width, frame.height);
  context.strokeStyle = "#1769e0";
  context.lineWidth = 2;
  context.strokeRect(frame.x + 2, frame.y + 2, frame.width - 4, frame.height - 4);
  context.restore();
}

function drawCanvasPlaceholder(context, canvas, message) {
  context.save();
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#5e6b7a";
  context.font = "700 24px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
  context.restore();
}

function getCanvasPoint(canvas, event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

function normalizeRect(rect) {
  return {
    x: Math.min(rect.x, rect.x + rect.width),
    y: Math.min(rect.y, rect.y + rect.height),
    width: Math.abs(rect.width),
    height: Math.abs(rect.height),
  };
}

function showToolError(errorElement, statusElement, message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
  statusElement.hidden = true;
}

function showToolStatus(statusElement, message) {
  statusElement.textContent = message;
  statusElement.hidden = false;
}

function clearToolMessage(errorElement, statusElement) {
  errorElement.hidden = true;
  statusElement.hidden = true;
}

function initializeTheme() {
  const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(theme, { persist: false });
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(currentTheme === "dark" ? "light" : "dark", { persist: true });
}

function setTheme(theme, options = { persist: true }) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  elements.themeLabel.textContent = theme === "dark" ? "Light mode" : "Dark mode";

  if (options.persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      return;
    }
  }
}

function preventBrowserFileOpen(event) {
  const hasFiles = Array.from(event.dataTransfer?.types || []).includes("Files");
  if (!hasFiles) {
    return;
  }

  event.preventDefault();
  if (event.type === "dragover" && event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
}

function getDroppedFile(dataTransfer) {
  if (!dataTransfer?.files?.length) {
    return null;
  }

  return Array.from(dataTransfer.files).find((file) => file.type.startsWith("image/")) || dataTransfer.files[0];
}

async function handleFile(file) {
  resetMessages();
  resetOptimizedResult();

  if (!isJpgOrPng(file)) {
    showError("Unsupported file format. Please upload a JPG or PNG image.");
    elements.fileInput.value = "";
    return;
  }

  if (file.size > MAX_BROWSER_FILE_SIZE) {
    showError("The selected file is too large to process in the browser. Please try a smaller file.");
    elements.fileInput.value = "";
    return;
  }

  try {
    setStatus("Reading image details...");
    const info = await inspectImage(file);
    state.selectedFile = file;
    state.originalInfo = info;

    if (state.originalUrl) {
      URL.revokeObjectURL(state.originalUrl);
    }
    state.originalUrl = URL.createObjectURL(file);

    elements.selectedFileName.textContent = file.name;
    elements.selectedFileSize.textContent = formatBytes(file.size);
    elements.fileState.hidden = false;
    elements.optimizeButton.disabled = false;
    elements.dropZone.classList.add("has-file");
    elements.uploadPreview.src = state.originalUrl;
    elements.uploadPreviewState.hidden = false;
    elements.originalPreview.src = state.originalUrl;
    elements.originalPreview.hidden = false;
    elements.originalPlaceholder.hidden = true;
    updateInfoList(elements.originalInfo, [
      ["File name", info.name],
      ["File type", info.type],
      ["File size", formatBytes(info.sizeBytes)],
      ["Dimensions", `${info.width} x ${info.height} px`],
      ["Aspect ratio", info.aspectRatio],
    ]);
    clearStatus();
  } catch {
    showError("Unable to read this image. Please try a different JPG or PNG file.");
    clearFile();
  }
}

async function inspectImage(file) {
  const image = await loadImageFromFile(file);
  return {
    name: file.name,
    type: normalizeFileType(file),
    sizeBytes: file.size,
    width: image.naturalWidth,
    height: image.naturalHeight,
    aspectRatio: getAspectRatio(image.naturalWidth, image.naturalHeight),
  };
}

async function optimizeSelectedFile() {
  resetMessages();
  resetOptimizedResult();

  if (!state.selectedFile || !state.originalInfo) {
    showError("Please upload an image before optimizing.");
    return;
  }

  const requirements = getRequirements();
  const validationError = validateRequirements(requirements);
  if (validationError) {
    showError(validationError);
    return;
  }

  elements.optimizeButton.disabled = true;
  setStatus("Optimizing image locally...");

  try {
    await waitForPaint();
    const image = await loadImageFromFile(state.selectedFile);
    const resized = drawResizedImage(image, requirements.maxWidth, requirements.maxHeight);
    const result = await exportCanvas(resized.canvas, requirements);
    const fileName = buildOutputFileName(state.selectedFile.name, requirements.outputFormat);
    const outputUrl = URL.createObjectURL(result.blob);
    const reductionPercent = Math.max(0, Math.round((1 - result.blob.size / state.selectedFile.size) * 100));

    state.optimizedUrl = outputUrl;
    state.hasOptimizedResult = true;
    elements.optimizedPreview.src = outputUrl;
    elements.optimizedPreview.hidden = false;
    elements.optimizedPlaceholder.hidden = true;
    elements.downloadButton.href = outputUrl;
    elements.downloadButton.download = fileName;
    elements.downloadButton.classList.remove("disabled");
    elements.downloadButton.setAttribute("aria-disabled", "false");

    updateInfoList(elements.optimizedInfo, [
      ["File name", fileName],
      ["Output type", requirements.outputFormat.toUpperCase()],
      ["File size", formatBytes(result.blob.size)],
      ["Dimensions", `${resized.width} x ${resized.height} px`],
      ["Reduction", `${reductionPercent}%`],
    ]);

    if (!result.metTarget) {
      showWarning(
        "The target file size may be too small for this image. The output was compressed as much as possible, but image quality may be reduced.",
      );
    }

    navigateToPage("#compare", { replace: true, focus: false });
    clearStatus();
  } catch {
    showError("Unable to optimize this image. Please try a different file or use less strict requirements.");
  } finally {
    elements.optimizeButton.disabled = false;
  }
}

function drawResizedImage(image, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    throw new Error("Canvas is not supported");
  }

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(image, 0, 0, width, height);

  return { canvas, width, height };
}

async function exportCanvas(canvas, requirements) {
  const mimeType = requirements.outputFormat === "jpg" ? "image/jpeg" : "image/png";
  const targetBytes = requirements.maxFileSizeKB * 1024;

  if (requirements.outputFormat === "png") {
    const blob = await canvasToBlob(canvas, mimeType);
    return {
      blob,
      metTarget: blob.size <= targetBytes,
    };
  }

  if (!requirements.autoQuality) {
    const blob = await canvasToBlob(canvas, mimeType, requirements.manualQuality);
    return {
      blob,
      metTarget: blob.size <= targetBytes,
    };
  }

  let quality = START_JPG_QUALITY;
  let bestBlob = await canvasToBlob(canvas, mimeType, quality);

  while (bestBlob.size > targetBytes && quality > MIN_JPG_QUALITY) {
    quality = Math.max(MIN_JPG_QUALITY, quality - QUALITY_STEP);
    bestBlob = await canvasToBlob(canvas, mimeType, quality);
  }

  return {
    blob: bestBlob,
    metTarget: bestBlob.size <= targetBytes,
  };
}

function getRequirements() {
  const maxFileSize = Number(elements.maxFileSize.value);
  const maxFileSizeKB = elements.fileSizeUnit.value === "MB" ? maxFileSize * 1024 : maxFileSize;

  return {
    outputFormat: elements.outputFormat.value,
    maxFileSizeKB,
    maxWidth: Number(elements.maxWidth.value),
    maxHeight: Number(elements.maxHeight.value),
    autoQuality: elements.autoQuality.checked,
    manualQuality: Number(elements.qualitySlider.value) / 100,
  };
}

function validateRequirements(requirements) {
  if (!Number.isFinite(requirements.maxFileSizeKB) || requirements.maxFileSizeKB <= 0) {
    return "Please enter a valid maximum file size.";
  }

  if (!Number.isFinite(requirements.maxWidth) || requirements.maxWidth <= 0) {
    return "Please enter a valid maximum width.";
  }

  if (!Number.isFinite(requirements.maxHeight) || requirements.maxHeight <= 0) {
    return "Please enter a valid maximum height.";
  }

  if (!["jpg", "png"].includes(requirements.outputFormat)) {
    return "Please select JPG or PNG as the output format.";
  }

  if (!requirements.autoQuality && (requirements.manualQuality < 0.1 || requirements.manualQuality > 1)) {
    return "JPG quality must be between 10% and 100%.";
  }

  return "";
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) {
    return;
  }

  elements.outputFormat.value = preset.outputFormat;
  elements.maxFileSize.value = preset.maxFileSize;
  elements.fileSizeUnit.value = preset.unit;
  elements.maxWidth.value = preset.maxWidth;
  elements.maxHeight.value = preset.maxHeight;
  elements.autoQuality.checked = true;
  elements.qualitySlider.disabled = true;
  elements.qualitySlider.value = 90;
  elements.qualityValue.textContent = "90%";
  resetOptimizedResult();
}

function selectCustomPreset() {
  const customInput = document.querySelector('input[name="preset"][value="custom"]');
  customInput.checked = true;
}

function clearFile() {
  state.selectedFile = null;
  state.originalInfo = null;
  elements.fileInput.value = "";
  elements.fileState.hidden = true;
  elements.optimizeButton.disabled = true;
  elements.dropZone.classList.remove("has-file");
  elements.uploadPreview.removeAttribute("src");
  elements.uploadPreviewState.hidden = true;
  resetMessages();
  resetOptimizedResult();
  resetOriginalInfo();

  if (state.originalUrl) {
    URL.revokeObjectURL(state.originalUrl);
    state.originalUrl = null;
  }

  elements.originalPreview.removeAttribute("src");
  elements.originalPreview.hidden = true;
  elements.originalPlaceholder.hidden = false;
}

function resetToStart() {
  clearFile();
  applyPreset("university");
  document.querySelector('input[name="preset"][value="university"]').checked = true;
  navigateToPage("#imageOptimizer", { replace: true, focus: false });
}

function resetOptimizedResult() {
  if (state.optimizedUrl) {
    URL.revokeObjectURL(state.optimizedUrl);
    state.optimizedUrl = null;
  }

  state.hasOptimizedResult = false;
  elements.resultsSection.hidden = true;
  updateInfoList(elements.optimizedInfo, [
    ["File name", "-"],
    ["Output type", "-"],
    ["File size", "-"],
    ["Dimensions", "-"],
    ["Reduction", "-"],
  ]);
  elements.optimizedPreview.removeAttribute("src");
  elements.optimizedPreview.hidden = true;
  elements.optimizedPlaceholder.hidden = false;
  elements.downloadButton.removeAttribute("href");
  elements.downloadButton.removeAttribute("download");
  elements.downloadButton.classList.add("disabled");
  elements.downloadButton.setAttribute("aria-disabled", "true");
  elements.warningMessage.hidden = true;
}

function resetOriginalInfo() {
  updateInfoList(elements.originalInfo, [
    ["File name", "-"],
    ["File type", "-"],
    ["File size", "-"],
    ["Dimensions", "-"],
    ["Aspect ratio", "-"],
  ]);
}

function updateInfoList(list, rows) {
  list.innerHTML = rows
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
}

function buildOutputFileName(originalName, outputFormat) {
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "");
  const safeBaseName = baseName || "image";
  return `submitready_${safeBaseName}.${outputFormat === "jpg" ? "jpg" : "png"}`;
}

function normalizeFileType(file) {
  if (file.type === "image/jpeg") {
    return "JPG";
  }

  if (file.type === "image/png") {
    return "PNG";
  }

  return getExtension(file.name).toUpperCase();
}

function getAspectRatio(width, height) {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.hidden = false;
  clearStatus();
}

function showWarning(message) {
  elements.warningMessage.textContent = message;
  elements.warningMessage.hidden = false;
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.hidden = false;
}

function clearStatus() {
  elements.statusMessage.hidden = true;
}

function resetMessages() {
  elements.errorMessage.hidden = true;
  elements.warningMessage.hidden = true;
  clearStatus();
}
