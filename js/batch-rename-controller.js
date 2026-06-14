import { MAX_RENAME_FILE_SIZE, MAX_RENAME_FILES, MAX_RENAME_TOTAL_SIZE } from "./config.js";
import {
  bindDropZone,
  downloadBlob,
  escapeHtml,
  formatBytes,
  getExtension,
  sanitizeFileBase,
  throwIfCanceled,
  validateFileBatch,
  waitForPaint,
} from "./utils.js";
import { buildZip } from "./zip-builder.js";

export function setupBatchRenameController() {
  const elements = {
    dropZone: document.querySelector("#renameDropZone"),
    fileInput: document.querySelector("#renameFileInput"),
    chooseFilesButton: document.querySelector("#chooseRenameFilesButton"),
    prefix: document.querySelector("#renamePrefix"),
    start: document.querySelector("#renameStart"),
    padding: document.querySelector("#renamePadding"),
    nameCase: document.querySelector("#renameCase"),
    lowerExtension: document.querySelector("#renameLowerExt"),
    fileList: document.querySelector("#renameFileList"),
    errorMessage: document.querySelector("#renameErrorMessage"),
    statusMessage: document.querySelector("#renameStatusMessage"),
    clearFilesButton: document.querySelector("#clearRenameFilesButton"),
    downloadZipButton: document.querySelector("#downloadRenameZipButton"),
    cancelZipButton: document.querySelector("#cancelRenameZipButton"),
  };

  const state = {
    files: [],
    zipUrl: null,
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
  [elements.prefix, elements.start, elements.padding, elements.nameCase, elements.lowerExtension].forEach((input) => {
    input.addEventListener("input", renderFileList);
  });
  elements.clearFilesButton.addEventListener("click", clearFiles);
  elements.downloadZipButton.addEventListener("click", downloadZip);
  elements.cancelZipButton.addEventListener("click", () => {
    state.cancelRequested = true;
    elements.cancelZipButton.disabled = true;
    showStatus("Canceling ZIP creation...");
  });

  function addFiles(fileList) {
    clearMessages();
    const files = Array.from(fileList || []);

    if (!files.length) {
      showError("Choose one or more files.");
      return;
    }

    const nextFiles = [...state.files, ...files];
    const validationError = validateFileBatch(nextFiles, {
      label: "Batch rename",
      maxFiles: MAX_RENAME_FILES,
      maxFileSize: MAX_RENAME_FILE_SIZE,
      maxTotalSize: MAX_RENAME_TOTAL_SIZE,
    });

    if (validationError) {
      showError(validationError);
      return;
    }

    state.files = nextFiles;
    resetZipDownload();
    renderFileList();
  }

  function renderFileList() {
    const rows = buildRenameRows();
    elements.fileList.hidden = rows.length === 0;
    elements.clearFilesButton.disabled = rows.length === 0;
    elements.downloadZipButton.disabled = rows.length === 0;
    resetZipDownload();

    if (!rows.length) {
      elements.fileList.innerHTML = "";
      return;
    }

    elements.fileList.innerHTML = rows
      .map(
        (row) => `
          <div>
            <span>${row.index}</span>
            <strong>${escapeHtml(row.original)}</strong>
            <small>${escapeHtml(row.renamed)}</small>
          </div>
        `,
      )
      .join("");
  }

  function buildRenameRows() {
    const start = Number(elements.start.value) || 1;
    const padding = Math.min(6, Math.max(1, Number(elements.padding.value) || 2));
    const prefix = sanitizeFileBase(elements.prefix.value || "submission");
    const styledPrefix =
      elements.nameCase.value === "lower" ? prefix.toLowerCase() : elements.nameCase.value === "upper" ? prefix.toUpperCase() : prefix;
    const usedNames = new Map();

    return state.files.map((file, index) => {
      const originalExtension = file.name.includes(".") ? getExtension(file.name) : "";
      const extension = elements.lowerExtension.checked ? originalExtension.toLowerCase() : originalExtension;
      const number = String(start + index).padStart(padding, "0");
      const baseName = `${styledPrefix}_${number}`;
      const initialName = extension ? `${baseName}.${extension}` : baseName;
      const renamed = ensureUniqueFileName(initialName, usedNames);

      return {
        index: index + 1,
        file,
        original: file.name,
        renamed,
      };
    });
  }

  function ensureUniqueFileName(fileName, usedNames) {
    const count = usedNames.get(fileName) || 0;
    usedNames.set(fileName, count + 1);
    if (count === 0) {
      return fileName;
    }

    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) {
      return `${fileName}_${count + 1}`;
    }

    return `${fileName.slice(0, dotIndex)}_${count + 1}${fileName.slice(dotIndex)}`;
  }

  function clearFiles() {
    state.files = [];
    elements.fileInput.value = "";
    renderFileList();
    clearMessages();
  }

  async function downloadZip() {
    const rows = buildRenameRows();
    if (!rows.length) {
      return;
    }

    try {
      elements.downloadZipButton.disabled = true;
      elements.cancelZipButton.disabled = false;
      state.cancelRequested = false;
      showStatus("Building renamed ZIP locally...");
      const entries = [];
      for (const [index, row] of rows.entries()) {
        throwIfCanceled(() => state.cancelRequested);
        showStatus(`Reading file ${index + 1} of ${rows.length}: ${row.original}`);
        await waitForPaint();
        entries.push({
          name: row.renamed,
          bytes: new Uint8Array(await row.file.arrayBuffer()),
        });
      }
      throwIfCanceled(() => state.cancelRequested);
      showStatus("Writing ZIP file...");
      await waitForPaint();
      const blob = new Blob([buildZip(entries)], { type: "application/zip" });
      downloadBlob(blob, "submitready_renamed_files.zip");
      showStatus(`ZIP ready: ${rows.length} file${rows.length === 1 ? "" : "s"}, ${formatBytes(blob.size)}.`);
    } catch (error) {
      if (error.message === "Task canceled.") {
        showStatus("ZIP creation canceled.");
      } else {
        showError("Unable to build a ZIP from these files.");
      }
    } finally {
      state.cancelRequested = false;
      elements.cancelZipButton.disabled = true;
      elements.downloadZipButton.disabled = rows.length === 0;
    }
  }

  function resetZipDownload() {
    if (state.zipUrl) {
      URL.revokeObjectURL(state.zipUrl);
      state.zipUrl = null;
    }
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.hidden = false;
    elements.statusMessage.hidden = true;
  }

  function showStatus(message) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.hidden = false;
  }

  function clearMessages() {
    elements.errorMessage.hidden = true;
    elements.statusMessage.hidden = true;
  }
}
