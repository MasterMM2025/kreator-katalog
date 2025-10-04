let products = [];
let jsonProducts = [];
let selectedBanner = null;
let selectedCover = null;
let uploadedImages = {};
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
    console.log("Załadowano jsonProducts:", jsonProducts.length);
  } catch (error) {
    document.getElementById('debug').innerText = "Błąd ładowania JSON: " + error.message;
    console.error("Błąd loadProducts:", error);
  }
}
function handleFiles(files) {
  if (!files || files.length === 0) {
    console.error("Brak plików do załadowania");
    document.getElementById('debug').innerText = "Brak zdjęć do załadowania";
    return;
  }
  [...files].forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileName = file.name.split('.')[0];
      uploadedImages[fileName] = e.target.result;
      console.log(`Załadowano obraz dla indeksu: ${fileName}`);
      document.getElementById('debug').innerText = `Załadowano obraz: ${fileName}`;
      renderCatalog(); // Odśwież katalog po załadowaniu zdjęcia
    };
    reader.onerror = () => {
      console.error(`Błąd ładowania pliku: ${file.name}`);
      document.getElementById('debug').innerText = `Błąd ładowania obrazu: ${file.name}`;
    };
    reader.readAsDataURL(file);
  });
}
function loadCustomBanner(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedBanner = { id: "custom", data: e.target.result };
    document.getElementById("debug").innerText = "Załadowano własny baner.";
  };
  reader.onerror = () => {
    document.getElementById('debug').innerText = "Błąd ładowania banera.";
  };
  reader.readAsDataURL(file);
}
function loadCustomCover(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedCover = { id: "customCover", data: e.target.result };
    document.getElementById("debug").innerText = "Załadowano własną okładkę.";
  };
  reader.onerror = () => {
    document.getElementById('debug').innerText = "Błąd ładowania okładki.";
  };
  reader.readAsDataURL(file);
}
document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("imageInput");
  const uploadArea = document.getElementById("uploadArea");
  if (imageInput && uploadArea) {
    imageInput.addEventListener("change", (e) => {
      console.log("Zmiana w imageInput, pliki:", e.target.files.length);
      handleFiles(e.target.files);
    });
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      console.log("Drop plików:", e.dataTransfer.files.length);
      handleFiles(e.dataTransfer.files);
    });
    uploadArea.addEventListener("click", () => imageInput.click());
  } else {
    console.error("Nie znaleziono elementów: imageInput lub uploadArea");
    document.getElementById('debug').innerText = "Błąd: Brak elementów do obsługi zdjęć";
  }
  const bannerFileInput = document.getElementById("bannerFileInput");
  const bannerUpload = document.getElementById("bannerUpload");
  if (bannerFileInput && bannerUpload) {
    bannerFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) loadCustomBanner(e.target.files[0]);
    });
    bannerUpload.addEventListener("dragover", (e) => {
      e.preventDefault();
      bannerUpload.classList.add("dragover");
    });
    bannerUpload.addEventListener("dragleave", () => {
      bannerUpload.classList.remove("dragover");
    });
    bannerUpload.addEventListener("drop", (e) => {
      e.preventDefault();
      bannerUpload.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) loadCustomBanner(e.dataTransfer.files[0]);
    });
    bannerUpload.addEventListener("click", () => bannerFileInput.click());
  }
  const coverFileInput = document.getElementById("coverFileInput");
  const coverUpload = document.getElementById("coverUpload");
  if (coverFileInput && coverUpload) {
    coverFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) loadCustomCover(e.target.files[0]);
    });
    coverUpload.addEventListener("dragover", (e) => {
      e.preventDefault();
      coverUpload.classList.add("dragover");
    });
    coverUpload.addEventListener("dragleave", () => {
      coverUpload.classList.remove("dragover");
    });
    coverUpload.addEventListener("drop", (e) => {
      e.preventDefault();
      coverUpload.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) loadCustomCover(e.dataTransfer.files[0]);
    });
    coverUpload.addEventListener("click", () => coverFileInput.click());
  }
});
function showBannerModal() {
  const bannerModal = document.getElementById('bannerModal');
  if (bannerModal) {
    bannerModal.style.display = 'block';
    loadBanners();
  } else {
    console.error("Nie znaleziono elementu bannerModal");
    document.getElementById('debug').innerText = "Błąd: Brak modalu banera";
  }
}
function hideBannerModal() {
  const bannerModal = document.getElementById('bannerModal');
  if (bannerModal) {
    bannerModal.style.display = 'none';
  }
}
async function loadBanners() {
  const bannerOptions = document.getElementById('bannerOptions');
  if (!bannerOptions) {
    console.error("Nie znaleziono elementu bannerOptions");
    document.getElementById('debug').innerText = "Błąd: Brak kontenera opcji banera";
    return;
  }
  bannerOptions.innerHTML = '';
  const bannerList = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
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
  event.currentTarget.classList.add('selected');
  hideBannerModal();
}
function renderCatalog() {
  const container = document.getElementById("catalog");
  if (!container) {
    console.error("Nie znaleziono elementu catalog");
    document.getElementById('debug').innerText = "Błąd: Brak elementu katalogu";
    return;
  }
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
function importExcel() {
  const file = document.getElementById('excelFile').files[0];
  if (!file) {
    alert('Wybierz plik Excel lub CSV do importu');
    document.getElementById('debug').innerText = "Błąd: Nie wybrano pliku";
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    let rows;
    if (file.name.endsWith('.csv')) {
      const parsed = Papa.parse(e.target.result, { header: true, skipEmptyLines: true });
      rows = parsed.data;
      if (rows.length === 0) {
        console.error("Plik CSV jest pusty lub niepoprawny");
        document.getElementById('debug').innerText = "Błąd: Plik CSV jest pusty";
        return;
      }
      const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
      rows = rows.map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          const value = row[Object.keys(row)[i]];
          if (header.includes('index') || header.includes('indeks')) obj['indeks'] = value || '';
          if (header.includes('ean')) obj['ean'] = value || '';
          if (header.includes('rank')) obj['ranking'] = value || '';
          if (header.includes('cen')) obj['cena'] = value || '';
          if (header.includes('nazwa')) obj['nazwa'] = value || '';
        });
        return obj;
      });
    } else {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
      const headers = rows[0].map(h => h.toString().toLowerCase().trim());
      rows = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          if (header.includes('index') || header.includes('indeks')) obj['indeks'] = row[i] || '';
          if (header.includes('ean')) obj['ean'] = row[i] || '';
          if (header.includes('rank')) obj['ranking'] = row[i] || '';
          if (header.includes('cen')) obj['cena'] = row[i] || '';
          if (header.includes('nazwa')) obj['nazwa'] = row[i] || '';
        });
        return obj;
      });
    }
    console.log("Przetworzone wiersze CSV/Excel:", rows);
    const newProducts = [];
    rows.forEach(row => {
      const indeks = row['indeks'] || row[0];
      if (indeks) {
        const matched = jsonProducts.find(p => p.indeks === indeks.toString());
        newProducts.push({
          nazwa: row['nazwa'] || (matched ? matched.nazwa : ''),
          ean: row['ean'] || (matched ? matched.ean : ''),
          ranking: row['ranking'] || (matched ? matched.ranking : ''),
          cena: row['cena'] || (matched ? matched.cena : ''),
          indeks: indeks.toString(),
          img: uploadedImages[indeks.toString()] || (matched ? matched.img : null)
        });
      }
    });
    console.log("Nowe produkty:", newProducts);
    if (newProducts.length) {
      products = newProducts;
      renderCatalog();
      document.getElementById('pdfButton').disabled = false;
      document.getElementById('previewButton').disabled = false;
      document.getElementById('debug').innerText = `Zaimportowano ${newProducts.length} produktów`;
    } else {
      document.getElementById('debug').innerText = "Brak produktów po imporcie. Sprawdź format pliku.";
    }
  };
  reader.onerror = () => {
    console.error("Błąd odczytu pliku");
    document.getElementById('debug').innerText = "Błąd odczytu pliku CSV/Excel";
  };
  if (file.name.endsWith('.csv')) reader.readAsText(file);
  else reader.readAsBinaryString(file);
}
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
async function buildPDF(jsPDF, save = true) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bannerHeight = 85;
  if (selectedCover) {
    try {
      doc.addImage(selectedCover.data, selectedCover.data.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      if (products.length > 0) doc.addPage();
    } catch (e) {
      console.error('Błąd dodawania okładki:', e);
      document.getElementById('debug').innerText = "Błąd dodawania okładki";
    }
  }
  const bannerImg = selectedBanner ? selectedBanner.data : null;
  if (bannerImg && products.length > 0) {
    try {
      doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
    } catch (e) {
      console.error('Błąd dodawania banera:', e);
      document.getElementById('debug').innerText = "Błąd dodawania banera";
    }
  }
  const marginTop = 20 + bannerHeight;
  const marginBottom = 28;
  const marginLeftRight = 14;
  const layout = document.querySelector('input[name="layout"]:checked')?.value || "16";
  const frameStyle = document.querySelector('input[name="frameStyle"]:checked')?.value || "3d";
  const showEan = document.getElementById('showEan')?.checked || false;
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;
  let x = marginLeftRight;
  let y = marginTop;
  let productIndex = 0;

  const drawSection = async (sectionCols, sectionRows, boxWidth, boxHeight, isLarge) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        drawBox(doc, x, y, boxWidth, boxHeight, frameStyle);
        let imgSrc = uploadedImages[p.indeks] || p.img;
        if (isLarge) { // Layout like module 4
          if (imgSrc) {
            try {
              const img = new Image();
              img.src = imgSrc;
              await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
              const maxW = boxWidth - 40;
              const maxH = boxHeight * 0.4;
              let scale = Math.min(maxW / img.width, maxH / img.height);
              let w = img.width * scale;
              let h = img.height * scale;
              let imgX = x + (boxWidth - w) / 2;
              let imgY = y + 25;
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h);
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
            }
          }
          let textY = y + boxHeight * 0.5;
          doc.setFont("Arial", "bold");
          doc.setFontSize(11);
          const lines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - 40);
          lines.forEach(line => {
            doc.text(line, x + boxWidth / 2, textY, { align: "center" });
            textY += 14;
          });
          textY += 10;
          doc.setFont("Arial", "normal"); doc.setFontSize(9);
          doc.text(`Indeks: ${p.indeks || '-'}`, x + boxWidth / 2, textY, { align: "center" });
          if (showRanking && p.ranking) {
            textY += 18;
            doc.text(`RANKING: ${p.ranking}`, x + boxWidth / 2, textY, { align: "center" });
          }
          if (showCena && p.cena) {
            textY += 20;
            doc.setFont("Arial", "bold"); doc.setFontSize(14);
            doc.text(`CENA: ${p.cena}`, x + boxWidth / 2, textY, { align: "center" });
          }
          if (showEan && p.ean && /^\d{12,13}$/.test(p.ean)) {
            try {
              const barcodeCanvas = document.createElement('canvas');
              JsBarcode(barcodeCanvas, p.ean, {
                format: "EAN13", width: 2, height: 40,
                displayValue: true, fontSize: 10, margin: 0
              });
              const barcodeImg = barcodeCanvas.toDataURL("image/png");
              const bw = 140, bh = 40;
              const bx = x + (boxWidth - bw) / 2;
              const by = y + boxHeight - bh - 20;
              doc.addImage(barcodeImg, "PNG", bx, by, bw, bh);
            } catch (e) {
              console.error('Błąd generowania kodu kreskowego:', e);
            }
          }
        } else { // Layout like module 16
          if (imgSrc) {
            try {
              const img = new Image();
              img.src = imgSrc;
              await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
              const maxW = 90;
              const maxH = 60;
              let scale = Math.min(maxW / img.width, maxH / img.height);
              let w = img.width * scale;
              let h = img.height * scale;
              let imgX = x + 5 + (maxW - w) / 2;
              let imgY = y + 8 + (maxH - h) / 2;
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h);
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
            }
          }
          let textY = y + 20;
          doc.setFont("Arial", "bold"); doc.setFontSize(8);
          doc.text(p.nazwa || "Brak nazwy", x + 105, textY, { maxWidth: boxWidth - 110 });
          textY += 25;
          doc.setFont("Arial", "normal"); doc.setFontSize(7);
          doc.text(`Indeks: ${p.indeks || 'Brak indeksu'}`, x + 105, textY, { maxWidth: 150 });
          textY += 12;
          if (showRanking && p.ranking) {
            doc.text(`RANKING: ${p.ranking}`, x + 105, textY, { maxWidth: 150 });
            textY += 12;
          }
          if (showCena && p.cena) {
            doc.setFont("Arial", "bold"); doc.setFontSize(12);
            doc.text(`CENA: ${p.cena}`, x + 105, textY, { maxWidth: 150 });
            textY += 16;
          }
          if (showEan && p.ean && /^\d{12,13}$/.test(p.ean)) {
            try {
              const barcodeCanvas = document.createElement('canvas');
              JsBarcode(barcodeCanvas, p.ean, {
                format: "EAN13", width: 1.6, height: 32,
                displayValue: true, fontSize: 9, margin: 0
              });
              const barcodeImg = barcodeCanvas.toDataURL("image/png", 0.8);
              const bw = 85, bh = 32;
              const bx = x + boxWidth - bw - 10;
              const by = y + boxHeight - bh - 5;
              doc.addImage(barcodeImg, "PNG", bx, by, bw, bh);
            } catch (e) {
              console.error('Błąd generowania kodu kreskowego:', e);
            }
          }
        }
        x += boxWidth + 6;
        productIndex++;
      }
      x = marginLeftRight;
      y += boxHeight + 6;
    }
    return y; // Return the new y position after this section
  };

  while (productIndex < products.length) {
    if (layout === "4") {
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      y = await drawSection(cols, rows, boxWidth, boxHeight, true);
    } else if (layout === "8") {
      cols = 2; rows = 4;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      y = await drawSection(cols, rows, boxWidth, boxHeight, false);
    } else if (layout === "16") {
      cols = 2; rows = 8;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      y = await drawSection(cols, rows, boxWidth, boxHeight, false);
    } else if (layout === "4-2-4") {
      // First section: 4 windows (2x2, like module 16)
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows; // 30% height for first section
      y = await drawSection(cols, rows, boxWidth, boxHeight, false);
      
      // Second section: 2 windows (2x1, like module 4)
      cols = 2; rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.4 - (rows - 1) * 6) / rows; // 40% height for middle section
      y = await drawSection(cols, rows, boxWidth, boxHeight, true);
      
      // Third section: 4 windows (2x2, like module 16)
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows; // 30% height for last section
      y = await drawSection(cols, rows, boxWidth, boxHeight, false);
    }
    if (productIndex < products.length) {
      doc.addPage();
      if (bannerImg) {
        doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
      }
      x = marginLeftRight;
      y = marginTop;
    }
  }

  if (save) doc.save("katalog.pdf");
  return doc;
}
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
// Upewnij się, że funkcje są globalne dla atrybutów onclick
window.importExcel = importExcel;
window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
window.showBannerModal = showBannerModal;
window.hideBannerModal = hideBannerModal;
loadProducts();
