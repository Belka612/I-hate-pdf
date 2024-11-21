const { PDFDocument } = PDFLib;

const pdfUpload = document.getElementById('pdfUpload');
const preview = document.getElementById('preview');
const mergeBtn = document.getElementById('mergeBtn');
const splitBtn = document.getElementById('splitBtn');
const reorderBtn = document.getElementById('reorderBtn');
const downloadLink = document.getElementById('downloadLink');

let uploadedFiles = [];
let loadedPdfs = [];
let reorderedIndices = [];

pdfUpload.addEventListener('change', async (event) => {
  const files = event.target.files;
  preview.innerHTML = '';
  loadedPdfs = [];
  reorderedIndices = [];
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
    const pageThumbnail = document.createElement('canvas');
    pageThumbnail.className = 'page-thumbnail';

    // ページ番号をデータ属性として保持
    pageThumbnail.dataset.pageIndex = i;

    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdf.save().then((bytes) => {
      pdfjsLib.getDocument({ data: bytes }).promise.then((doc) => {
        doc.getPage(i + 1).then((page) => {
          const viewport = page.getViewport({ scale: 0.5 });
          const context = pageThumbnail.getContext('2d');
          pageThumbnail.width = viewport.width;
          pageThumbnail.height = viewport.height;
          page.render({ canvasContext: context, viewport: viewport });
        });
      });
    });

    preview.appendChild(pageThumbnail);
  }

  // 並べ替え可能にする
  new Sortable(preview, {
    animation: 150,
  });
}

mergeBtn.addEventListener('click', async () => {
  try {
    if (loadedPdfs.length === 0) return alert('PDFファイルをアップロードしてください！');
    const mergedPdf = await PDFDocument.create();
    for (const pdf of loadedPdfs) {
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
    downloadPdf(mergedPdf, 'merged_output.pdf');
  } catch (error) {
    console.error(error);
    alert('PDFの結合中にエラーが発生しました。');
  }
});

splitBtn.addEventListener('click', async () => {
  try {
    if (loadedPdfs.length === 0) return alert('ファイルをアップロードしてください！');
    const pdf = loadedPdfs[0];
    const zip = new JSZip();
    for (let i = 0; i < pdf.getPageCount(); i++) {
      const singlePdf = await PDFDocument.create();
      const [page] = await singlePdf.copyPages(pdf, [i]);
      singlePdf.addPage(page);
      const pdfBytes = await singlePdf.save();
      zip.file(`split_page_${i + 1}.pdf`, pdfBytes);
    }
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const zipBlob = new Blob([content], { type: 'application/zip' });
      const zipUrl = URL.createObjectURL(zipBlob);
      downloadLink.href = zipUrl;
      downloadLink.download = 'split_pages.zip';
      downloadLink.style.display = 'inline';
      downloadLink.textContent = 'split_pages.zip をダウンロード';
    });
  } catch (error) {
    console.error(error);
    alert('PDFの分割中にエラーが発生しました。');
  }
});

reorderBtn.addEventListener('click', async () => {
  try {
    if (loadedPdfs.length === 0) {
      return alert('ファイルをアップロードしてください！');
    }

    const pdf = loadedPdfs[0];
    const reorderedPdf = await PDFDocument.create();

    // サムネイルの並び順から`reorderedIndices`を生成
    const thumbnails = Array.from(preview.children);
    reorderedIndices = thumbnails.map((thumbnail) => parseInt(thumbnail.dataset.pageIndex, 10));

    if (reorderedIndices.length === 0) {
      alert('並び替えができませんでした！');
      return;
    }

    // 並べ替えた順序でページをコピー
    for (const i of reorderedIndices) {
      const [page] = await reorderedPdf.copyPages(pdf, [i]);
      reorderedPdf.addPage(page);
    }

    downloadPdf(reorderedPdf, 'reordered_output.pdf');
  } catch (error) {
    console.error(error);
    alert('ページの並び替え中にエラーが発生しました。');
  }
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
