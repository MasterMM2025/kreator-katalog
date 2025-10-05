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

function showProgressModal() {
  document.getElementById('progressModal').style.display = 'block';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressText').textContent = '0%';
}

function hideProgressModal() {
  document.getElementById('progressModal').style.display = 'none';
}

async function buildPDF(jsPDF, save = true) {
  showProgressModal();
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bannerHeight = 85;
  let pageNumber = 1;
  let totalProducts = products.length;
  let processedProducts = 0;

  if (selectedCover) {
    try {
      doc.addImage(selectedCover.data, selectedCover.data.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      if (products.length > 0) {
        doc.addPage();
      }
    } catch (e) {
      console.error('Błąd dodawania okładki:', e);
      document.getElementById('debug').innerText = "Błąd dodawania okładki";
    }
  }

  const bannerImg = selectedBanner ? selectedBanner.data : null;
  const backgroundImg = selectedBackground ? selectedBackground.data : null;
  const priceLabel = globalLanguage === 'en' ? 'PRICE' : 'CENA';

  if (products.length > 0) {
    if (backgroundImg) {
      try {
        doc.addImage(backgroundImg, backgroundImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      } catch (e) {
        console.error('Błąd dodawania tła:', e);
        document.getElementById('debug').innerText = "Błąd dodawania tła";
      }
    }
    if (bannerImg) {
      try {
        doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
      } catch (e) {
        console.error('Błąd dodawania banera:', e);
        document.getElementById('debug').innerText = "Błąd dodawania banera";
      }
    }
    doc.setFont("Arial", "bold");
    doc.setFontSize(12);
    doc.text(`${pageNumber}`, pageWidth - 20, pageHeight - 10, { align: "right" });
  }

  const marginTop = 20 + bannerHeight;
  const marginBottom = 28;
  const marginLeftRight = 14;
  const layout = document.getElementById('layoutSelect')?.value || "16";
  const frameStyle = document.querySelector('input[name="frameStyle"]:checked')?.value || "3d";
  const showEan = document.getElementById('showEan')?.checked || false;
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;

  let x = marginLeftRight;
  let y = marginTop;
  let productIndex = 0;

  const getItemsPerPage = () => {
    if (layout === "1") return 1;
    if (layout === "2") return 2;
    if (layout === "4") return 4;
    if (layout === "8") return 8;
    if (layout === "16") return 16;
    if (layout === "4-2-4") return 10; // Przybliżona liczba dla 4-2-4 (4+2+4)
    return 4; // Domyślnie
  };

  const itemsPerPage = getItemsPerPage();

  const drawSection = async (sectionCols, sectionRows, boxWidth, boxHeight, isLarge) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[Math.floor(productIndex / itemsPerPage)] || {
          nazwaFont: 'Arial',
          nazwaFontColor: '#000000',
          indeksFont: 'Arial',
          indeksFontColor: '#000000',
          rankingFont: 'Arial',
          rankingFontColor: '#000000',
          cenaFont: 'Arial',
          cenaFontColor: '#000000',
          priceCurrency: globalCurrency,
          showPriceLabel: true
        };
        // Ulepszona logika: baza pageEdit z nadpisywaniem tylko istniejącymi polami z edit
        const finalEdit = {
          ...pageEdit,
          ...(edit.font && { font: edit.font }),
          ...(edit.fontColor && { fontColor: edit.fontColor }),
          ...(edit.indeksFont && { indeksFont: edit.indeksFont }),
          ...(edit.indeksFontColor && { indeksFontColor: edit.indeksFontColor }),
          ...(edit.rankingFont && { rankingFont: edit.rankingFont }),
          ...(edit.rankingFontColor && { rankingFontColor: edit.rankingFontColor }),
          ...(edit.cenaFont && { cenaFont: edit.cenaFont }),
          ...(edit.cenaFontColor && { cenaFontColor: edit.cenaFontColor }),
          ...(edit.priceCurrency && { priceCurrency: edit.priceCurrency }),
          ...(edit.priceFontSize && { priceFontSize: edit.priceFontSize }),
          ...(edit.showPriceLabel !== undefined && { showPriceLabel: edit.showPriceLabel })
        };
        drawBox(doc, x, y, boxWidth, boxHeight, frameStyle);

        let imgSrc = uploadedImages[p.indeks] || p.img;
        if (isLarge) {
          if (imgSrc) {
            try {
              const img = new Image();
              img.src = imgSrc;
              await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
              const maxW = boxWidth - (sectionCols === 1 ? 80 : 40);
              const maxH = boxHeight * 0.4;
              let scale = Math.min(maxW / img.width, maxH / img.height);
              let w = img.width * scale;
              let h = img.height * scale;
              let imgX = x + (boxWidth - w) / 2;
              let imgY = y + 5;
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h);
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
            }
          }

          let textY = y + 5 + (boxHeight * 0.4) + 10;
          doc.setFont(finalEdit.nazwaFont, "bold");
          doc.setFontSize(sectionCols === 1 ? 14 : 11);
          const nazwaFontColor = finalEdit.nazwaFontColor || '#000000'; // Fallback
          doc.setTextColor(parseInt(nazwaFontColor.substring(1, 3), 16), parseInt(nazwaFontColor.substring(3, 5), 16), parseInt(nazwaFontColor.substring(5, 7), 16));
          const lines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - (sectionCols === 1 ? 80 : 40));
          const maxLines = 3;
          lines.slice(0, maxLines).forEach((line, index) => {
            doc.text(line, x + boxWidth / 2, textY + (index * 18), { align: "center" });
          });
          textY += Math.min(lines.length, maxLines) * 18 + 10;

          doc.setFont(finalEdit.indeksFont, "normal");
          doc.setFontSize(sectionCols === 1 ? 11 : 9);
          const indeksFontColor = finalEdit.indeksFontColor || '#000000'; // Fallback
          doc.setTextColor(parseInt(indeksFontColor.substring(1, 3), 16), parseInt(indeksFontColor.substring(3, 5), 16), parseInt(indeksFontColor.substring(5, 7), 16));
          doc.text(`Indeks: ${p.indeks || '-'}`, x + boxWidth / 2, textY, { align: "center" });
          textY += sectionCols === 1 ? 22 : 18;

          if (showRanking && p.ranking) {
            doc.setFont(finalEdit.rankingFont, "normal");
            const rankingFontColor = finalEdit.rankingFontColor || '#000000'; // Fallback
            doc.setTextColor(parseInt(rankingFontColor.substring(1, 3), 16), parseInt(rankingFontColor.substring(3, 5), 16), parseInt(rankingFontColor.substring(5, 7), 16));
            doc.text(`RANKING: ${p.ranking}`, x + boxWidth / 2, textY, { align: "center" });
            textY += sectionCols === 1 ? 22 : 18;
          }

          if (showCena && p.cena) {
            doc.setFont(finalEdit.cenaFont, "bold");
            const priceFontSize = sectionCols === 1 ? (finalEdit.priceFontSize === 'small' ? 16 : finalEdit.priceFontSize === 'medium' ? 20 : 24) : (finalEdit.priceFontSize === 'small' ? 12 : finalEdit.priceFontSize === 'medium' ? 14 : 16);
            doc.setFontSize(priceFontSize);
            const cenaFontColor = finalEdit.cenaFontColor || '#000000'; // Fallback
            doc.setTextColor(parseInt(cenaFontColor.substring(1, 3), 16), parseInt(cenaFontColor.substring(3, 5), 16), parseInt(cenaFontColor.substring(5, 7), 16));
            const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
            const showPriceLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${p.cena} ${currencySymbol}`, x + boxWidth / 2, textY, { align: "center" });
          }

          if (showEan && p.ean && p.barcode) {
            try {
              const bw = sectionCols === 1 ? 180 : 140;
              const bh = sectionCols === 1 ? 50 : 40;
              const bx = x + (boxWidth - bw) / 2;
              const by = y + boxHeight - bh - 5;
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh);
            } catch (e) {
              console.error('Błąd dodawania kodu kreskowego:', e);
            }
          }
        } else {
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
          doc.setFont(finalEdit.nazwaFont, "bold");
          doc.setFontSize(8);
          const nazwaFontColor = finalEdit.nazwaFontColor || '#000000';
          doc.setTextColor(parseInt(nazwaFontColor.substring(1, 3), 16), parseInt(nazwaFontColor.substring(3, 5), 16), parseInt(nazwaFontColor.substring(5, 7), 16));
          doc.text(p.nazwa || "Brak nazwy", x + 105, textY, { maxWidth: boxWidth - 110 });
          textY += 25;
          doc.setFont(finalEdit.indeksFont, "normal");
          doc.setFontSize(7);
          const indeksFontColor = finalEdit.indeksFontColor || '#000000';
          doc.setTextColor(parseInt(indeksFontColor.substring(1, 3), 16), parseInt(indeksFontColor.substring(3, 5), 16), parseInt(indeksFontColor.substring(5, 7), 16));
          doc.text(`Indeks: ${p.indeks || 'Brak indeksu'}`, x + 105, textY, { maxWidth: 150 });
          textY += 12;
          if (showRanking && p.ranking) {
            doc.setFont(finalEdit.rankingFont, "normal");
            const rankingFontColor = finalEdit.rankingFontColor || '#000000';
            doc.setTextColor(parseInt(rankingFontColor.substring(1, 3), 16), parseInt(rankingFontColor.substring(3, 5), 16), parseInt(rankingFontColor.substring(5, 7), 16));
            doc.text(`RANKING: ${p.ranking}`, x + 105, textY, { maxWidth: 150 });
            textY += 12;
          }
          if (showCena && p.cena) {
            doc.setFont(finalEdit.cenaFont, "bold");
            const priceFontSize = (finalEdit.priceFontSize || 'medium') === 'small' ? 10 : (finalEdit.priceFontSize || 'medium') === 'medium' ? 12 : 14;
            doc.setFontSize(priceFontSize);
            const cenaFontColor = finalEdit.cenaFontColor || '#000000';
            doc.setTextColor(parseInt(cenaFontColor.substring(1, 3), 16), parseInt(cenaFontColor.substring(3, 5), 16), parseInt(cenaFontColor.substring(5, 7), 16));
            const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
            const showPriceLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${p.cena} ${currencySymbol}`, x + 105, textY, { maxWidth: 150});
            textY += 16;
          }
          if (showEan && p.ean && p.barcode) {
            try {
              const bw = 85;
              const bh = 32;
              const bx = x + boxWidth - bw - 10;
              const by = y + boxHeight - bh - 5;
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh);
            } catch (e) {
              console.error('Błąd dodawania kodu kreskowego:', e);
            }
          }
        }

        processedProducts++;
        const progress = (processedProducts / totalProducts) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${Math.round(progress)}%`;
        x += boxWidth + 6;
        productIndex++;
      }
      x = marginLeftRight;
      y += boxHeight + 6;
    }
    return y;
  };

  while (productIndex < products.length) {
    let cols, rows, boxWidth, boxHeight, isLarge;
    if (layout === "1") {
      cols = 1;
      rows = 1;
      boxWidth = pageWidth - marginLeftRight * 2;
      boxHeight = pageHeight - marginTop - marginBottom;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "2") {
      cols = 2;
      rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = pageHeight - marginTop - marginBottom;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "4") {
      cols = 2;
      rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "8") {
      cols = 2;
      rows = 4;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "16") {
      cols = 2;
      rows = 8;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "4-2-4") {
      // First 4 (top)
      cols = 2;
      rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);

      // Middle 2
      cols = 2;
      rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.4 - (rows - 1) * 6) / rows;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);

      // Last 4 (bottom)
      cols = 2;
      rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    }

    if (productIndex < products.length) {
      doc.addPage();
      pageNumber++;
      if (backgroundImg) {
        try {
          doc.addImage(backgroundImg, backgroundImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
        } catch (e) {
          console.error('Błąd dodawania tła:', e);
          document.getElementById('debug').innerText = "Błąd dodawania tła";
        }
      }
      if (bannerImg) {
        try {
          doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
        } catch (e) {
          console.error('Błąd dodawania banera:', e);
          document.getElementById('debug').innerText = "Błąd dodawania banera";
        }
      }
      doc.setFont("Arial", "bold");
      doc.setTextColor(0, 0, 0); // Domyślny kolor tekstu dla numeru strony
      doc.setFontSize(12);
      doc.text(`${pageNumber}`, pageWidth - 20, pageHeight - 10, { align: "right" });
      x = marginLeftRight;
      y = marginTop;
    }
  }

  hideProgressModal();
  if (save) doc.save("katalog.pdf");
  return doc;
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  await buildPDF(jsPDF, true);
}

async function previewPDF() {
  showProgressModal();
  const { jsPDF } = window.jspdf;
  const doc = await buildPDF(jsPDF, false);
  const blobUrl = doc.output("bloburl");
  document.getElementById("pdfIframe").src = blobUrl;
  document.getElementById("pdfPreview").style.display = "block";
}

window.importExcel = importExcel;
window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
window.showBannerModal = showBannerModal;
window.hideBannerModal = hideBannerModal;
window.showEditModal = showEditModal;
window.hideEditModal = hideEditModal;
window.saveEdit = saveEdit;
window.showPageEditModal = showPageEditModal;
window.savePageEdit = savePageEdit;

loadProducts();
