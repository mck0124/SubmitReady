export function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas export failed"));
        }
      },
      mimeType,
      quality,
    );
  });
}

export function bindDropZone(dropZone, onFiles) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      dropZone.classList.add("drag-over");
    });
  });

  dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dropZone.contains(event.relatedTarget)) {
      dropZone.classList.remove("drag-over");
    }
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove("drag-over");
    onFiles(event.dataTransfer.files);
  });
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "-";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getExtension(fileName) {
  return fileName.split(".").pop().toLowerCase();
}

export function getTotalBytes(files) {
  return files.reduce((total, file) => total + file.size, 0);
}

export function isJpgOrPng(file) {
  const extension = getExtension(file.name);
  return file.type === "image/jpeg" || file.type === "image/png" || ["jpg", "jpeg", "png"].includes(extension);
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    image.src = url;
  });
}

export function sanitizeFileBase(value) {
  return value.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "file";
}

export function throwIfCanceled(isCanceled, message = "Task canceled.") {
  if (isCanceled()) {
    throw new Error(message);
  }
}

export function validateFileBatch(files, options) {
  const totalBytes = getTotalBytes(files);
  const oversizedFile = files.find((file) => options.maxFileSize && file.size > options.maxFileSize);

  if (options.maxFiles && files.length > options.maxFiles) {
    return `${options.label} supports up to ${options.maxFiles} files at a time.`;
  }

  if (oversizedFile) {
    return `${oversizedFile.name} is too large. Maximum per file: ${formatBytes(options.maxFileSize)}.`;
  }

  if (options.maxTotalSize && totalBytes > options.maxTotalSize) {
    return `${options.label} supports up to ${formatBytes(options.maxTotalSize)} total per batch. Current total: ${formatBytes(totalBytes)}.`;
  }

  return "";
}

export function waitForPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
