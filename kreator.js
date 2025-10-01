let products = [];
let jsonProducts = [];
let selectedBanner = null;
let uploadedImages = {}; // indeks -> base64

// --- Mapowanie flag (możesz podmienić na swoje z repo)
const flags = {
  LT: "https://flagcdn.com/w80/lt.png",
  UA: "https://flagcdn.com/w80/ua.png",
  RO: "https://flagcdn.com/w80/ro.png",
  PL: "https://flagcdn.com/w80/pl.png",
  BG: "https://flagcdn.com/w80/bg.png"
};

// --- Zamiana obrazków na base64 ---
async function toBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// --- Ładowanie JSON ---
async function loadProducts() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/UKRAINA.json");
    if (!response.ok) throw new Error(`Nie udało się załadować JSON: ${response.status}`);
    const jsonData = await response.json();
    jsonProducts = await Promise.all(jsonData.map(async (p) => {
      const urls = [
        `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/zdjecia-ukraina/${p.INDEKS}.jpg`,
        `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/zdjecia-ukraina/${p.INDEKS}.png`,
        `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/rumunia/${p.INDEKS}.jpg`,
        `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/rumunia/${p.INDEKS}.png`
      ];
      let base64Img = null;
      for (const url of urls) {
        base64Img = await toBase64(url);
        if (base64Img) break;
      }
      return {
        nazwa: p.NAZWA,
        opakowanie: p.OPAKOWANIE,
        ean: p["unit barcode"],
        ranking: p.RANKING || '',
        cena: p.CENA || '',
        indeks: p.INDEKS.toString(),
        img: base64Img
      };
    }));
  } catch (error) {
    document.getElementById('debug').innerText = "Błąd ładowania JSON: " + error.message;
  }
}

/* Drag & Drop zdjęcia produktów */
function handleFiles(files) {
  [...files].forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileName = file.name.split('.')[0];
      uploadedImages[fileName] = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Drag & Drop własny baner */
function loadCustomBanner(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedBanner = { id: "custom", data: e.target.result };
    document.getElementById("debug").innerText = "Załadowano własny baner.";
  };
  reader.readAsDataURL(file);
}

/* Inicjalizacja */
document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("imageInput");
  const uploadArea = document.getElementById("uploadArea");
  if (imageInput && uploadArea) {
    imageInput.addEventListener("change", (e) => handleFiles(e.target.files));
    uploadArea.addEventListener("dragover", (e) => { e.preventDefault(); uploadArea.classList.add("dragover"); });
    uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      handleFiles(e.dataTransfer.files);
    });
    uploadArea.addEventListener("click", () => imageInput.click());
  }

  const bannerFileInput = document.getElementById("bannerFileInput");
  const bannerUpload = document.getElementById("bannerUpload");
  if (bannerFileInput && bannerUpload) {
    bannerFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) loadCustomBanner(e.target.files[0]);
    });
    bannerUpload.addEventListener("dragover", (e) => { e.preventDefault(); bannerUpload.classList.add("dragover"); });
    bannerUpload.addEventListener("dragleave", () => bannerUpload.classList.remove("dragover"));
    bannerUpload.addEventListener("drop", (e) => {
      e.preventDefault();
      bannerUpload.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) loadCustomBanner(e.dataTransfer.files[0]);
    });
    bannerUpload.addEventListener("click", () => bannerFileInput.click());
  }
});

function showBannerModal() {
  document.getElementById('bannerModal').style.display = 'block';
  loadBanners();
}

function hideBannerModal() {
  document.getElementById('bannerModal').style.display = 'none';
}

async function loadBanners() {
  const bannerOptions = document.getElementById('bannerOptions');
  bannerOptions.innerHTML = '';
  const bannerList = ['1','2','3','4','5','6','7','8','9'];
  for (const id of bannerList) {
    const urls = [
      `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/BANER/${id}.JPG`,
      `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/BANER/${id}.jpg`,
      `https://raw.githubusercontent.com/Marcin870119/masterzamowienia/main/BANER/${id}.png`
    ];
    let base64Banner = null;
    for (const url of urls) {
      base64Banner = await toBase64(url);
      if (base64Banner) break;
    }
    if (base64Banner) {
      const preview = document.createElement('img');
      preview.src = base64Banner;
      preview.className = 'banner-preview';
      preview.onclick = () => selectBanner(id, base64Banner);
      bannerOptions.appendChild(preview);
    }
  }
}

function selectBanner(id, data) {
  selectedBanner = { id, data };
  document.querySelectorAll('.banner-preview').forEach(p => p.classList.remove('selected'));
  this.classList.add('selected');
  hideBannerModal();
}

/* --- Import Excel --- */
function importExcel() {
  const file = document.getElementById('excelFile').files[0];
  if (!file) {
    alert('Wybierz plik Excel lub CSV do importu');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    let rows;
    if (file.name.endsWith('.csv')) {
      rows = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }).data;
    } else {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
      const headers = rows[0].map(h => h.toString().toLowerCase().trim());
      rows = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          if (header.includes('index')) obj['indeks'] = row[i] || '';
          if (header.includes('ean')) obj['ean'] = row[i] || '';
          if (header.includes('rank')) obj['ranking'] = row[i] || '';
          if (header.includes('cen')) obj['cena'] = row[i] || '';
          if (header.includes('nazwa')) obj['nazwa'] = row[i] || '';
        });
        return obj;
      });
    }
    const newProducts = [];
    rows.forEach(row => {
      const indeks = row['indeks'] || row[0];
      if (indeks) {
        const matched = jsonProducts.find(p => p.indeks === indeks.toString());
        if (matched) {
          newProducts.push({
            nazwa: row['nazwa'] || matched.nazwa,
            ean: row['ean'] || matched.ean,
            ranking: row['ranking'] || matched.ranking,
            cena: row['cena'] || matched.cena,
            indeks: indeks.toString(),
            img: matched.img
          });
        }
      }
    });
    if (newProducts.length) {
      products = newProducts;
      renderCatalog();
      document.getElementById('pdfButton').disabled = false;
      document.getElementById('previewButton').disabled = false;
    }
  };
  if (file.name.endsWith('.csv')) reader.readAsText(file);
  else reader.readAsBinaryString(file);
}

/* --- Podgląd katalogu na stronie --- */
function renderCatalog() {
  const container = document.getElementById("catalog");
  container.innerHTML = "";
  if (products.length === 0) {
    container.innerHTML = "<p>Brak produktów do wyświetlenia. Zaimportuj plik Excel.</p>";
    return;
  }
  let pageDiv = document.createElement("div");
  pageDiv.className = "page";
  products.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "item";
    const img = document.createElement('img');
    img.src = uploadedImages[p.indeks] || p.img || "https://dummyimage.com/120x84/eee/000&text=brak";
    const details = document.createElement('div');
    details.className = "details";
    details.innerHTML = `<b>${p.nazwa || 'Brak nazwy'}</b><br>Indeks: ${p.indeks || 'Brak indeksu'}`;
    item.appendChild(img);
    item.appendChild(details);
    pageDiv.appendChild(item);
    if ((i + 1) % 4 === 0) {
      container.appendChild(pageDiv);
      pageDiv = document.createElement("div");
      pageDiv.className = "page";
    }
  });
  if (products.length % 4 !== 0) container.appendChild(pageDiv);
}

/* --- Rysowanie boxów --- */
function drawBox(doc, x, y, w, h, style) {
  if (style === "3d") {
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(x + 2, y + 2, w, h, 5, 5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 5, 5, 'F');
    doc.setDrawColor(80, 80, 80);
    doc.roundedRect(x, y, w, h, 5, 5, 'S');
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, w, h, 'F');
  }
}

/* --- Generowanie PDF --- */
async function buildPDF(jsPDF, save = true) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bannerHeight = 85;
  const bannerImg = selectedBanner ? selectedBanner.data : null;
  if (bannerImg) {
    doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
  }

  const layout = document.querySelector('input[name="layout"]:checked').value;
  const frameStyle = document.querySelector('input[name="frameStyle"]:checked').value;
  const selectedCountry = document.getElementById("countrySelect").value;

  let cols, rows;
  if (layout === "4") { cols = 2; rows = 2; }
  else if (layout === "8") { cols = 2; rows = 4; }
  else { cols = 2; rows = 8; }

  const marginTop = 20 + bannerHeight;
  const marginBottom = 40;
  const marginLeftRight = 14;
  const boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
  const boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;

  const showEan = document.getElementById('showEan').checked;
  const showRanking = document.getElementById('showRanking').checked;
  const showCena = document.getElementById('showCena').checked;

  let x = marginLeftRight;
  let y = marginTop;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    drawBox(doc, x, y, boxWidth, boxHeight, frameStyle);

    // obrazek
    let imgSrc = uploadedImages[p.indeks] || p.img;
    if (imgSrc) {
      try {
        const img = new Image();
        img.src = imgSrc;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        const maxW = boxWidth * 0.6;
        const maxH = boxHeight * 0.35;
        let scale = Math.min(maxW / img.width, maxH / img.height);
        let w = img.width * scale;
        let h = img.height * scale;
        let imgX = x + (boxWidth - w) / 2;
        let imgY = y + 15;
        doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h);
      } catch {}
    }

    // tekst
    let textY = y + boxHeight * 0.55;
    doc.setFont("Arial", "bold"); doc.setFontSize(9);
    const lines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - 20);
    lines.forEach(line => {
      doc.text(line, x + boxWidth / 2, textY, { align: "center" });
      textY += 12;
    });
    textY += 5;

    doc.setFont("Arial", "normal"); doc.setFontSize(8);
    doc.text(`Indeks: ${p.indeks || '-'}`, x + boxWidth / 2, textY, { align: "center" });

    if (showRanking && p.ranking) {
      textY += 14;
      doc.text(`RANKING: ${p.ranking}`, x + boxWidth / 2, textY, { align: "center" });
    }

    if (showCena && p.cena) {
      textY += 18;
      doc.setFont("Arial", "bold"); doc.setFontSize(12);
      doc.text(`CENA: ${p.cena}`, x + boxWidth / 2, textY, { align: "center" });
    }

    if (showEan && p.ean && /^\d{12,13}$/.test(p.ean)) {
      try {
        const barcodeCanvas = document.createElement('canvas');
        JsBarcode(barcodeCanvas, p.ean, { format: "EAN13", width: 1.6, height: 32, displayValue: true, fontSize: 9, margin: 0 });
        const barcodeImg = barcodeCanvas.toDataURL("image/png");
        const bw = 120, bh = 32;
        const bx = x + (boxWidth - bw) / 2;
        const by = y + boxHeight - bh - 10;
        doc.addImage(barcodeImg, "PNG", bx, by, bw, bh);
      } catch {}
    }

    // układ
    x += boxWidth + 6;
    if ((i + 1) % cols === 0) {
      x = marginLeftRight;
      y += boxHeight + 6;
    }

    if ((i + 1) % (rows * cols) === 0 && i + 1 < products.length) {
      // flaga na każdej stronie
      if (selectedCountry && flags[selectedCountry]) {
        const flagImg = await toBase64(flags[selectedCountry]);
        if (flagImg) {
          const fw = 60, fh = 40;
          const fx = (pageWidth - fw) / 2;
          const fy = pageHeight - fh - 5;
          doc.addImage(flagImg, "PNG", fx, fy, fw, fh);
        }
      }
      doc.addPage();
      if (bannerImg) {
        doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
      }
      x = marginLeftRight; y = marginTop;
    }
  }

  // flaga na ostatniej stronie
  if (selectedCountry && flags[selectedCountry]) {
    const flagImg = await toBase64(flags[selectedCountry]);
    if (flagImg) {
      const fw = 60, fh = 40;
      const fx = (pageWidth - fw) / 2;
      const fy = pageHeight - fh - 5;
      doc.addImage(flagImg, "PNG", fx, fy, fw, fh);
    }
  }

  if (save) doc.save("katalog.pdf");
  return doc;
}

/* --- Funkcje przycisków --- */
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  await buildPDF(jsPDF, true);
}

async function previewPDF() {
  const { jsPDF } = window.jspdf;
  const doc = await buildPDF(jsPDF, false);
  const blobUrl = doc.output("bloburl");
  document.getElementById("pdfIframe").src = blobUrl;
  document.getElementById("pdfPreview").style.display = "block";
}

loadProducts();
