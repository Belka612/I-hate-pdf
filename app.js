const { PDFDocument } = PDFLib;

const pdfUpload = document.getElementById('pdfUpload');
const preview = document.getElementById('preview');
const mergeBtn = document.getElementById('mergeBtn');
const splitBtn = document.getElementById('splitBtn');
const reorderBtn = document.getElementById('reorderBtn');
const downloadLink = document.getElementById('downloadLink');

let uploadedFiles = [];
let loadedPdfs = [];

pdfUpload.addEventListener('change', async (event) => {
  const files = event.target.files;
  preview.innerHTML = '';
  loadedPdfs = [];
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    loadedPdfs.push(pdf);
    createPreview(pdf, file.name);
  }
});

function createPreview(pdf, name) {
  const pageCount = pdf.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const pageThumbnail = document.createElement('div');
    pageThumbnail.className = 'page-thumbnail';
    pageThumbnail.textContent = `${name} - Page ${i + 1}`;
    preview.appendChild(pageThumbnail);
  }
}

mergeBtn.addEventListener('click', async () => {
  const mergedPdf = await PDFDocument.create();
  for (const pdf of loadedPdfs) {
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  downloadPdf(mergedPdf, 'merged_output.pdf');
});

splitBtn.addEventListener('click', async () => {
  if (loadedPdfs.length === 0) return alert('ファイルをアップロードしてください！');
  const pdf = loadedPdfs[0];
  for (let i = 0; i < pdf.getPageCount(); i++) {
    const singlePdf = await PDFDocument.create();
    const [page] = await singlePdf.copyPages(pdf, [i]);
    singlePdf.addPage(page);
    downloadPdf(singlePdf, `split_page_${i + 1}.pdf`);
  }
});

reorderBtn.addEventListener('click', async () => {
  const pdf = loadedPdfs[0];
  const reorderedPdf = await PDFDocument.create();
  const indices = [2, 0, 1]; // ページの順序を指定（例：3→1→2）
  for (const i of indices) {
    const [page] = await reorderedPdf.copyPages(pdf, [i]);
    reorderedPdf.addPage(page);
  }
  downloadPdf(reorderedPdf, 'reordered_output.pdf');
});

function downloadPdf(pdfDoc, filename) {
  pdfDoc.save().then((bytes) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'inline';
    downloadLink.textContent = `${filename} をダウンロード`;
  });
}
