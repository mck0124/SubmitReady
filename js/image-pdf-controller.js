import { MAX_BROWSER_FILE_SIZE, MAX_IMAGE_TO_PDF_FILES, MAX_IMAGE_TO_PDF_TOTAL_SIZE } from "./config.js";
import { buildPdf, imageToPdfPage } from "./pdf-builder.js";
import { bindDropZone, escapeHtml, formatBytes, isJpgOrPng, loadImageFromFile, throwIfCanceled, validateFileBatch, waitForPaint } from "./utils.js";

export function setupImagePdfController() {
  const elements = {
    dropZone: document.querySelector("#pdfDropZone"),
    fileInput: document.querySelector("#pdfFileInput"),
    chooseFilesButton: document.querySelector("#choosePdfFilesButton"),
    fileList: document.querySelector("#pdfFileList"),
    errorMessage: document.querySelector("#pdfErrorMessage"),
    statusMessage: document.querySelector("#pdfStatusMessage"),
    clearFilesButton: document.querySelector("#clearPdfFilesButton"),
    createPdfButton: document.querySelector("#createPdfButton"),
    cancelPdfButton: document.querySelector("#cancelPdfButton"),
    downloadPdfButton: document.querySelector("#downloadPdfButton"),
  };

  const state = {
    files: [],
    pdfUrl: null,
    cancelRequested: false,
  };

  elements.chooseFilesButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.fileInput.click();
  });
  elements.dropZone.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", (event) => {
    addFiles(event.target.files);
    elements.fileInput.value = "";
  });
  bindDropZone(elements.dropZone, addFiles);
  elements.clearFilesButton.addEventListener("click", clearFiles);
  elements.createPdfButton.addEventListener("click", createPdf);
  elements.cancelPdfButton.addEventListener("click", () => {
    state.cancelRequested = true;
    elements.cancelPdfButton.disabled = true;
    setStatus("Canceling PDF creation...");
  });

  function addFiles(fileList) {
    clearMessages();
    const files = Array.from(fileList || []);
    const imageFiles = files.filter((file) => isJpgOrPng(file));

    if (!imageFiles.length) {
      showError("Unsupported file format. Please add JPG or PNG images.");
      return;
    }

    const nextFiles = [...state.files, ...imageFiles];
    const validationError = validateFileBatch(nextFiles, {
      label: "Image to PDF",
      maxFiles: MAX_IMAGE_TO_PDF_FILES,
      maxFileSize: MAX_BROWSER_FILE_SIZE,
      maxTotalSize: MAX_IMAGE_TO_PDF_TOTAL_SIZE,
    });

    if (validationError) {
      showError(validationError);
      return;
    }

    state.files = nextFiles;
    resetDownload();
    renderFileList();
  }

  function renderFileList() {
    elements.fileList.hidden = state.files.length === 0;
    elements.clearFilesButton.disabled = state.files.length === 0;
    elements.createPdfButton.disabled = state.files.length === 0;

    if (!state.files.length) {
      elements.fileList.innerHTML = "";
      return;
    }

    elements.fileList.innerHTML = state.files
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

  function clearFiles() {
    state.files = [];
    elements.fileInput.value = "";
    renderFileList();
    resetDownload();
    clearMessages();
  }

  async function createPdf() {
    clearMessages();
    resetDownload();

    if (!state.files.length) {
      showError("Please add at least one image before creating a PDF.");
      return;
    }

    elements.createPdfButton.disabled = true;
    elements.cancelPdfButton.disabled = false;
    state.cancelRequested = false;
    setStatus("Creating PDF locally...");

    try {
      const pages = [];
      for (const [index, file] of state.files.entries()) {
        throwIfCanceled(() => state.cancelRequested);
        setStatus(`Preparing image ${index + 1} of ${state.files.length}: ${file.name}`);
        await waitForPaint();
        const image = await loadImageFromFile(file);
        pages.push(await imageToPdfPage(image));
      }

      throwIfCanceled(() => state.cancelRequested);
      setStatus("Writing PDF file...");
      await waitForPaint();
      const pdfBytes = buildPdf(pages);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      state.pdfUrl = url;
      elements.downloadPdfButton.href = url;
      elements.downloadPdfButton.download = "submitready_images.pdf";
      elements.downloadPdfButton.classList.remove("disabled");
      elements.downloadPdfButton.setAttribute("aria-disabled", "false");
      setStatus(`PDF ready: ${state.files.length} image${state.files.length === 1 ? "" : "s"}, ${formatBytes(blob.size)}.`);
    } catch (error) {
      if (error.message === "Task canceled.") {
        setStatus("PDF creation canceled.");
      } else {
        showError("Unable to create a PDF from one or more images. Please check that every file is a valid JPG or PNG.");
      }
    } finally {
      state.cancelRequested = false;
      elements.cancelPdfButton.disabled = true;
      elements.createPdfButton.disabled = state.files.length === 0;
    }
  }

  function resetDownload() {
    if (state.pdfUrl) {
      URL.revokeObjectURL(state.pdfUrl);
      state.pdfUrl = null;
    }

    elements.downloadPdfButton.removeAttribute("href");
    elements.downloadPdfButton.removeAttribute("download");
    elements.downloadPdfButton.classList.add("disabled");
    elements.downloadPdfButton.setAttribute("aria-disabled", "true");
  }

  function setStatus(message) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.hidden = false;
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.hidden = false;
    elements.statusMessage.hidden = true;
  }

  function clearMessages() {
    elements.errorMessage.hidden = true;
    elements.statusMessage.hidden = true;
  }
}
