export async function imageToPdfPage(image) {
  const maxCanvasSide = 2200;
  const scale = Math.min(maxCanvasSide / image.naturalWidth, maxCanvasSide / image.naturalHeight, 1);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("Canvas is not supported");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const imageBytes = base64ToBytes(dataUrl.split(",")[1]);
  const isLandscape = width > height;
  const pageWidth = isLandscape ? 842 : 595;
  const pageHeight = isLandscape ? 595 : 842;
  const margin = 36;
  const fitScale = Math.min((pageWidth - margin * 2) / width, (pageHeight - margin * 2) / height);
  const drawWidth = width * fitScale;
  const drawHeight = height * fitScale;

  return {
    imageBytes,
    imageWidth: width,
    imageHeight: height,
    pageWidth,
    pageHeight,
    drawWidth,
    drawHeight,
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
  };
}

export function buildPdf(pages) {
  const objects = [];
  const pageObjectIds = [];

  objects.push([asciiBytes("<< /Type /Catalog /Pages 2 0 R >>")]);
  objects.push(null);

  pages.forEach((page, index) => {
    const imageName = `Im${index + 1}`;
    const imageObjectId = objects.length + 1;
    objects.push([
      asciiBytes(
        `<< /Type /XObject /Subtype /Image /Width ${page.imageWidth} /Height ${page.imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.imageBytes.length} >>\nstream\n`,
      ),
      page.imageBytes,
      asciiBytes("\nendstream"),
    ]);

    const content = `q\n${formatPdfNumber(page.drawWidth)} 0 0 ${formatPdfNumber(page.drawHeight)} ${formatPdfNumber(page.x)} ${formatPdfNumber(page.y)} cm\n/${imageName} Do\nQ`;
    const contentObjectId = objects.length + 1;
    objects.push([asciiBytes(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)]);

    const pageObjectId = objects.length + 1;
    pageObjectIds.push(pageObjectId);
    objects.push([
      asciiBytes(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.pageWidth} ${page.pageHeight}] /Resources << /XObject << /${imageName} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      ),
    ]);
  });

  objects[1] = [
    asciiBytes(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`),
  ];

  return assemblePdf(objects);
}

function assemblePdf(objects) {
  const chunks = [];
  const offsets = [0];
  let length = 0;

  const push = (chunk) => {
    chunks.push(chunk);
    length += chunk.length;
  };

  push(asciiBytes("%PDF-1.4\n"));

  objects.forEach((objectChunks, index) => {
    offsets[index + 1] = length;
    push(asciiBytes(`${index + 1} 0 obj\n`));
    objectChunks.forEach(push);
    push(asciiBytes("\nendobj\n"));
  });

  const xrefOffset = length;
  push(asciiBytes(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`));
  offsets.slice(1).forEach((offset) => {
    push(asciiBytes(`${String(offset).padStart(10, "0")} 00000 n \n`));
  });
  push(asciiBytes(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));

  const pdfBytes = new Uint8Array(length);
  let position = 0;
  chunks.forEach((chunk) => {
    pdfBytes.set(chunk, position);
    position += chunk.length;
  });
  return pdfBytes;
}

function asciiBytes(value) {
  return new TextEncoder().encode(value);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function formatPdfNumber(value) {
  return Number(value.toFixed(2));
}
