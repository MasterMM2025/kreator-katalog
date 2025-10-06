function drawBox(doc, x, y, w, h, borderStyle, borderColor) {
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(x + 2, y + 2, w, h, 5, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 5, 5, 'F');
  const color = borderColor ? [
    parseInt(borderColor.substring(1, 3), 16),
    parseInt(borderColor.substring(3, 5), 16),
    parseInt(borderColor.substring(5, 7), 16)
  ] : [80, 80, 80];
  doc.setDrawColor(...color);
  if (borderStyle === "dashed") {
    doc.setLineDash([5, 5]);
  } else if (borderStyle === "dotted") {
    doc.setLineDash([2, 2]);
  } else {
    doc.setLineDash([]);
  }
  doc.roundedRect(x, y, w, h, 5, 5, 'S');
}
function createGradientCanvas(gradientType, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  let gradient;
  switch (gradientType) {
    case 'ocean-breeze':
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#A5FECB');
      gradient.addColorStop(0.3, '#20BDFF');
      gradient.addColorStop(1, '#043B5C');
      break;
    case 'sunset-glow':
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FFE5B4');
      gradient.addColorStop(0.4, '#FF6B6B');
      gradient.addColorStop(1, '#4A00E0');
      break;
    case 'forest-mist':
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#D4F4DD');
      gradient.addColorStop(0.5, '#4CAF50');
      gradient.addColorStop(1, '#1B5E20');
      break;
    case 'lavender-dream':
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#F3E7FA');
      gradient.addColorStop(0.3, '#D6A4F5');
      gradient.addColorStop(1, '#6B46C1');
      break;
    case 'desert-sunset':
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FBD38D');
      gradient.addColorStop(0.4, '#F56565');
      gradient.addColorStop(1, '#9B2C2C');
      break;
    case 'midnight-sky':
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#EBF4FF');
      gradient.addColorStop(0.5, '#7F9CF5');
      gradient.addColorStop(1, '#1A237E');
      break;
    default:
      return null;
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
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
    const pageEdit = pageEdits[pageNumber - 1] || {};
    if (pageEdit.pageBackgroundGradient && pageEdit.pageBackgroundGradient !== "none") {
      try {
        const gradientImage = createGradientCanvas(pageEdit.pageBackgroundGradient, pageWidth, pageHeight);
        if (gradientImage) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: pageEdit.pageBackgroundOpacity || 1.0 }));
          doc.addImage(gradientImage, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
          doc.restoreGraphicsState();
        }
      } catch (e) {
        console.error('Błąd dodawania gradientu tła:', e);
        document.getElementById('debug').innerText = "Błąd dodawania gradientu tła";
      }
    } else if (backgroundImg) {
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
  const showEan = document.getElementById('showEan')?.checked || false;
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;
  const showLogo = document.getElementById('showLogo')?.checked || false;
  let x = marginLeftRight;
  let y = marginTop;
  let productIndex = 0;
  const getItemsPerPage = () => {
    if (layout === "1") return 1;
    if (layout === "2") return 2;
    if (layout === "4") return 4;
    if (layout === "8") return 8;
    if (layout === "16") return 16;
    if (layout === "4-2-4") return 10;
    return 4;
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
          showPriceLabel: true,
          borderStyle: 'solid',
          borderColor: '#000000',
          backgroundTexture: null,
          backgroundOpacity: 1.0,
          pageBackgroundGradient: 'none',
          pageBackgroundOpacity: 1.0
        };
        const finalEdit = { ...pageEdit, ...edit };
        console.log('BuildPDF - Product Index:', productIndex, 'Final Edit:', finalEdit);
        if (finalEdit.backgroundTexture) {
          try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
            doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
            doc.restoreGraphicsState();
          } catch (e) {
            console.error('Błąd dodawania tekstury tła:', e);
          }
        }
        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');
        let imgSrc = uploadedImages[p.indeks] || p.img;
        let logoSrc = edit.logo || (p.producent && manufacturerLogos[p.producent]) || null;
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
          doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
          doc.setFontSize(sectionCols === 1 ? 14 : 11);
          const nazwaFontColor = finalEdit.nazwaFontColor || '#000000';
          doc.setTextColor(parseInt(nazwaFontColor.substring(1, 3), 16), parseInt(nazwaFontColor.substring(3, 5), 16), parseInt(nazwaFontColor.substring(5, 7), 16));
          const lines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - (sectionCols === 1 ? 80 : 40));
          const maxLines = 3;
          lines.slice(0, maxLines).forEach((line, index) => {
            doc.text(line, x + boxWidth / 2, textY + (index * 18), { align: "center" });
          });
          textY += Math.min(lines.length, maxLines) * 18 + 10;
          doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
          doc.setFontSize(sectionCols === 1 ? 11 : 9);
          const indeksFontColor = finalEdit.indeksFontColor || '#000000';
          doc.setTextColor(parseInt(indeksFontColor.substring(1, 3), 16), parseInt(indeksFontColor.substring(3, 5), 16), parseInt(indeksFontColor.substring(5, 7), 16));
          doc.text(`Indeks: ${p.indeks || '-'}`, x + boxWidth / 2, textY, { align: "center" });
          textY += sectionCols === 1 ? 22 : 18;
          if (showRanking && p.ranking) {
            doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
            const rankingFontColor = finalEdit.rankingFontColor || '#000000';
            doc.setTextColor(parseInt(rankingFontColor.substring(1, 3), 16), parseInt(rankingFontColor.substring(3, 5), 16), parseInt(rankingFontColor.substring(5, 7), 16));
            doc.text(`RANKING: ${p.ranking}`, x + boxWidth / 2, textY, { align: "center" });
            textY += sectionCols === 1 ? 22 : 18;
          }
          if (showCena && p.cena) {
            doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
            const priceFontSize = sectionCols === 1 ? (finalEdit.priceFontSize === 'small' ? 16 : finalEdit.priceFontSize === 'medium' ? 20 : 24) : (finalEdit.priceFontSize === 'small' ? 12 : finalEdit.priceFontSize === 'medium' ? 14 : 16);
            doc.setFontSize(priceFontSize);
            const cenaFontColor = finalEdit.cenaFontColor || '#000000';
            doc.setTextColor(parseInt(cenaFontColor.substring(1, 3), 16), parseInt(cenaFontColor.substring(3, 5), 16), parseInt(cenaFontColor.substring(5, 7), 16));
            const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
            const showPriceLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${p.cena} ${currencySymbol}`, x + boxWidth / 2, textY, { align: "center" });
            textY += sectionCols === 1 ? 22 : 18;
          }
          if (showLogo && layout === "4" && logoSrc) {
            try {
              const logoImg = new Image();
              logoImg.src = logoSrc;
              await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; });
              const logoW = 120;
              const logoH = 60;
              const logoX = x + (boxWidth - logoW) / 2;
              const logoY = textY;
              doc.addImage(logoSrc, logoSrc.includes('image/png') ? "PNG" : "JPEG", logoX, logoY, logoW, logoH, undefined, 'SLOW');
              textY += logoH + 5;
            } catch (e) {
              console.error('Błąd dodawania loga:', e);
            }
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
          doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
          doc.setFontSize(8);
          const nazwaFontColor = finalEdit.nazwaFontColor || '#000000';
          doc.setTextColor(parseInt(nazwaFontColor.substring(1, 3), 16), parseInt(nazwaFontColor.substring(3, 5), 16), parseInt(nazwaFontColor.substring(5, 7), 16));
          doc.text(p.nazwa || "Brak nazwy", x + 105, textY, { maxWidth: boxWidth - 110 });
          textY += 25;
          doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
          doc.setFontSize(7);
          const indeksFontColor = finalEdit.indeksFontColor || '#000000';
          doc.setTextColor(parseInt(indeksFontColor.substring(1, 3), 16), parseInt(indeksFontColor.substring(3, 5), 16), parseInt(indeksFontColor.substring(5, 7), 16));
          doc.text(`Indeks: ${p.indeks || 'Brak indeksu'}`, x + 105, textY, { maxWidth: 150 });
          textY += 12;
          if (showRanking && p.ranking) {
            doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
            const rankingFontColor = finalEdit.rankingFontColor || '#000000';
            doc.setTextColor(parseInt(rankingFontColor.substring(1, 3), 16), parseInt(rankingFontColor.substring(3, 5), 16), parseInt(rankingFontColor.substring(5, 7), 16));
            doc.text(`RANKING: ${p.ranking}`, x + 105, textY, { maxWidth: 150 });
            textY += 12;
          }
          if (showCena && p.cena) {
            doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
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
      cols = 2;
      rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
      cols = 2;
      rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.4 - (rows - 1) * 6) / rows;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
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
      const pageEdit = pageEdits[pageNumber - 1] || {};
      if (pageEdit.pageBackgroundGradient && pageEdit.pageBackgroundGradient !== "none") {
        try {
          const gradientImage = createGradientCanvas(pageEdit.pageBackgroundGradient, pageWidth, pageHeight);
          if (gradientImage) {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: pageEdit.pageBackgroundOpacity || 1.0 }));
            doc.addImage(gradientImage, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            doc.restoreGraphicsState();
          }
        } catch (e) {
          console.error('Błąd dodawania gradientu tła:', e);
          document.getElementById('debug').innerText = "Błąd dodawania gradientu tła";
        }
      } else if (backgroundImg) {
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
      doc.setTextColor(0, 0, 0);
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
function showEditModal(productIndex) {
  const product = products[productIndex];
  const edit = productEdits[productIndex] || {
    nazwaFont: 'Arial',
    nazwaFontColor: '#000000',
    indeksFont: 'Arial',
    indeksFontColor: '#000000',
    rankingFont: 'Arial',
    rankingFontColor: '#000000',
    cenaFont: 'Arial',
    cenaFontColor: '#000000',
    priceCurrency: globalCurrency,
    priceFontSize: 'medium',
    logo: null,
    borderStyle: 'solid',
    borderColor: '#000000',
    backgroundTexture: null,
    backgroundOpacity: 1.0
  };
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;
  const showLogo = document.getElementById('showLogo')?.checked || false;
  const priceLabel = globalLanguage === 'en' ? 'Price' : 'Cena';
  const editForm = document.getElementById('editForm');
  editForm.innerHTML = `
    <div class="edit-field">
      <label>Zdjęcie:</label>
      <img src="${uploadedImages[product.indeks] || product.img || 'https://dummyimage.com/120x84/eee/000&text=brak'}" style="width:100px;height:100px;object-fit:contain;margin-bottom:10px;">
      <input type="file" id="editImage" accept="image/*">
    </div>
    <div class="edit-field">
      <label>Nazwa:</label>
      <input type="text" id="editNazwa" value="${product.nazwa || ''}">
      <select id="editNazwaFont">
        <option value="Arial" ${edit.nazwaFont === 'Arial' ? 'selected' : ''}>Arial</option>
        <option value="Helvetica" ${edit.nazwaFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
        <option value="Times" ${edit.nazwaFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
      </select>
      <input type="color" id="editNazwaColor" value="${edit.nazwaFontColor}">
    </div>
    <div class="edit-field">
      <label>Indeks:</label>
      <input type="text" id="editIndeks" value="${product.indeks || ''}">
      <select id="editIndeksFont">
        <option value="Arial" ${edit.indeksFont === 'Arial' ? 'selected' : ''}>Arial</option>
        <option value="Helvetica" ${edit.indeksFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
        <option value="Times" ${edit.indeksFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
      </select>
      <input type="color" id="editIndeksColor" value="${edit.indeksFontColor}">
    </div>
    ${showRanking ? `
      <div class="edit-field">
        <label>Ranking:</label>
        <input type="text" id="editRanking" value="${product.ranking || ''}">
        <select id="editRankingFont">
          <option value="Arial" ${edit.rankingFont === 'Arial' ? 'selected' : ''}>Arial</option>
          <option value="Helvetica" ${edit.rankingFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
          <option value="Times" ${edit.rankingFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
        </select>
        <input type="color" id="editRankingColor" value="${edit.rankingFontColor}">
      </div>
    ` : ''}
    ${showCena ? `
      <div class="edit-field">
        <label>${priceLabel}:</label>
        <input type="text" id="editCena" value="${product.cena || ''}">
        <select id="editCenaFont">
          <option value="Arial" ${edit.cenaFont === 'Arial' ? 'selected' : ''}>Arial</option>
          <option value="Helvetica" ${edit.cenaFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
          <option value="Times" ${edit.cenaFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
        </select>
        <input type="color" id="editCenaColor" value="${edit.cenaFontColor}">
        <select id="editCenaCurrency">
          <option value="EUR" ${edit.priceCurrency === 'EUR' ? 'selected' : ''}>€ (EUR)</option>
          <option value="GBP" ${edit.priceCurrency === 'GBP' ? 'selected' : ''}>£ (GBP)</option>
        </select>
        <select id="editCenaFontSize">
          <option value="small" ${edit.priceFontSize === 'small' ? 'selected' : ''}>Mały</option>
          <option value="medium" ${edit.priceFontSize === 'medium' ? 'selected' : ''}>Średni</option>
          <option value="large" ${edit.priceFontSize === 'large' ? 'selected' : ''}>Duży</option>
        </select>
      </div>
    ` : ''}
    ${showLogo ? `
      <div class="edit-field">
        <label>Logo:</label>
        <img src="${edit.logo || (product.producent && manufacturerLogos[product.producent]) || 'https://dummyimage.com/80x40/eee/000&text=brak'}" style="width:80px;height:40px;object-fit:contain;margin-bottom:10px;">
        <select id="editLogoSelect">
          <option value="">Brak logo</option>
          ${Object.keys(manufacturerLogos).map(name => `<option value="${name}" ${product.producent === name ? 'selected' : ''}>${name}</option>`).join('')}
        </select>
        <input type="file" id="editLogo" accept="image/*">
      </div>
    ` : ''}
    <div class="edit-field">
      <label>Styl obramowania:</label>
      <select id="editBorderStyle">
        <option value="solid" ${edit.borderStyle === 'solid' ? 'selected' : ''}>Pełna linia</option>
        <option value="dashed" ${edit.borderStyle === 'dashed' ? 'selected' : ''}>Kreskowana</option>
        <option value="dotted" ${edit.borderStyle === 'dotted' ? 'selected' : ''}>Kropkowana</option>
      </select>
    </div>
    <div class="edit-field">
      <label>Kolor obramowania:</label>
      <input type="color" id="editBorderColor" value="${edit.borderColor || '#000000'}">
    </div>
    <div class="edit-field">
      <label>Tekstura tła:</label>
      <input type="file" id="editBackgroundTexture" accept="image/*">
      <label>Przezroczystość:</label>
      <input type="range" id="editBackgroundOpacity" min="0.1" max="1.0" step="0.1" value="${edit.backgroundOpacity || 1.0}">
    </div>
    <button onclick="saveEdit(${productIndex})" class="btn-primary">Zapisz</button>
  `;
  document.getElementById('editModal').style.display = 'block';
}
function saveEdit(productIndex) {
  const product = products[productIndex];
  const editImage = document.getElementById('editImage').files[0];
  if (editImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages[product.indeks] = e.target.result;
      renderCatalog();
    };
    reader.readAsDataURL(editImage);
  }
  const editLogo = document.getElementById('editLogo')?.files[0];
  if (editLogo) {
    const reader = new FileReader();
    reader.onload = (e) => {
      productEdits[productIndex] = productEdits[productIndex] || {};
      productEdits[productIndex].logo = e.target.result;
      renderCatalog();
    };
    reader.readAsDataURL(editLogo);
  } else if (document.getElementById('editLogoSelect')) {
    const selectedLogo = document.getElementById('editLogoSelect').value;
    productEdits[productIndex] = productEdits[productIndex] || {};
    productEdits[productIndex].logo = selectedLogo ? manufacturerLogos[selectedLogo] : null;
    product.producent = selectedLogo || product.producent;
  }
  const editBackgroundTexture = document.getElementById('editBackgroundTexture').files[0];
  if (editBackgroundTexture) {
    const reader = new FileReader();
    reader.onload = (e) => {
      productEdits[productIndex] = productEdits[productIndex] || {};
      productEdits[productIndex].backgroundTexture = e.target.result;
      renderCatalog();
    };
    reader.readAsDataURL(editBackgroundTexture);
  } else {
    productEdits[productIndex] = productEdits[productIndex] || {};
    productEdits[productIndex].backgroundTexture = null;
  }
  product.nazwa = document.getElementById('editNazwa').value;
  product.indeks = document.getElementById('editIndeks').value;
  if (document.getElementById('showRanking')?.checked) {
    product.ranking = document.getElementById('editRanking')?.value || '';
  }
  if (document.getElementById('showCena')?.checked) {
    product.cena = document.getElementById('editCena')?.value || '';
  }
  productEdits[productIndex] = {
    nazwaFont: document.getElementById('editNazwaFont').value || 'Arial',
    nazwaFontColor: document.getElementById('editNazwaColor').value || '#000000',
    indeksFont: document.getElementById('editIndeksFont').value || 'Arial',
    indeksFontColor: document.getElementById('editIndeksColor').value || '#000000',
    rankingFont: document.getElementById('editRankingFont')?.value || 'Arial',
    rankingFontColor: document.getElementById('editRankingColor')?.value || '#000000',
    cenaFont: document.getElementById('editCenaFont')?.value || 'Arial',
    cenaFontColor: document.getElementById('editCenaColor')?.value || '#000000',
    priceCurrency: document.getElementById('editCenaCurrency')?.value || globalCurrency,
    priceFontSize: document.getElementById('editCenaFontSize')?.value || 'medium',
    logo: productEdits[productIndex]?.logo || null,
    borderStyle: document.getElementById('editBorderStyle').value || 'solid',
    borderColor: document.getElementById('editBorderColor').value || '#000000',
    backgroundTexture: productEdits[productIndex]?.backgroundTexture || null,
    backgroundOpacity: parseFloat(document.getElementById('editBackgroundOpacity').value) || 1.0
  };
  console.log('Saved Edit for Product Index:', productIndex, productEdits[productIndex]);
  renderCatalog();
  hideEditModal();
}
function showPageEditModal(pageIndex) {
  const edit = pageEdits[pageIndex] || {
    nazwaFont: 'Arial',
    nazwaFontColor: '#000000',
    indeksFont: 'Arial',
    indeksFontColor: '#000000',
    rankingFont: 'Arial',
    rankingFontColor: '#000000',
    cenaFont: 'Arial',
    cenaFontColor: '#000000',
    priceCurrency: globalCurrency,
    showPriceLabel: true,
    pageBackgroundGradient: 'none',
    pageBackgroundOpacity: 1.0
  };
  const editForm = document.getElementById('editForm');
  const layout = document.getElementById('layoutSelect').value || "16";
  let itemsPerPage;
  if (layout === "1") itemsPerPage = 1;
  else if (layout === "2") itemsPerPage = 2;
  else if (layout === "4") itemsPerPage = 4;
  else if (layout === "8") itemsPerPage = 8;
  else if (layout === "16") itemsPerPage = 16;
  else if (layout === "4-2-4") itemsPerPage = 10;
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  editForm.innerHTML = `
    <div class="edit-field">
      <label>Wybierz stronę:</label>
      <select id="editPageSelect">
        ${Array.from({ length: totalPages }, (_, i) => `<option value="${i}" ${i === pageIndex ? 'selected' : ''}>Strona ${i + 1}</option>`)}
      </select>
    </div>
    <div class="edit-field">
      <label>Czcionka nazwy:</label>
      <select id="editNazwaFont">
        <option value="Arial" ${edit.nazwaFont === 'Arial' ? 'selected' : ''}>Arial</option>
        <option value="Helvetica" ${edit.nazwaFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
        <option value="Times" ${edit.nazwaFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
      </select>
      <input type="color" id="editNazwaColor" value="${edit.nazwaFontColor}">
    </div>
    <div class="edit-field">
      <label>Czcionka indeksu:</label>
      <select id="editIndeksFont">
        <option value="Arial" ${edit.indeksFont === 'Arial' ? 'selected' : ''}>Arial</option>
        <option value="Helvetica" ${edit.indeksFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
        <option value="Times" ${edit.indeksFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
      </select>
      <input type="color" id="editIndeksColor" value="${edit.indeksFontColor}">
    </div>
    <div class="edit-field">
      <label>Czcionka rankingu:</label>
      <select id="editRankingFont">
        <option value="Arial" ${edit.rankingFont === 'Arial' ? 'selected' : ''}>Arial</option>
        <option value="Helvetica" ${edit.rankingFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
        <option value="Times" ${edit.rankingFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
      </select>
      <input type="color" id="editRankingColor" value="${edit.rankingFontColor}">
    </div>
    <div class="edit-field">
      <label>Czcionka ceny:</label>
      <select id="editCenaFont">
        <option value="Arial" ${edit.cenaFont === 'Arial' ? 'selected' : ''}>Arial</option>
        <option value="Helvetica" ${edit.cenaFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
        <option value="Times" ${edit.cenaFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
      </select>
      <input type="color" id="editCenaColor" value="${edit.cenaFontColor}">
    </div>
    <div class="edit-field">
      <label>Waluta:</label>
      <select id="editCenaCurrency">
        <option value="EUR" ${edit.priceCurrency === 'EUR' ? 'selected' : ''}>€ (EUR)</option>
        <option value="GBP" ${edit.priceCurrency === 'GBP' ? 'selected' : ''}>£ (GBP)</option>
      </select>
    </div>
    <div class="edit-field">
      <label>Format ceny:</label>
      <label><input type="radio" name="priceFormat" value="true" ${edit.showPriceLabel ? 'checked' : ''}> Price: 1.45</label>
      <label><input type="radio" name="priceFormat" value="false" ${!edit.showPriceLabel ? 'checked' : ''}> 1.45</label>
    </div>
    <div class="edit-field">
      <label>Gradient tła strony:</label>
      <select id="editPageBackgroundGradient">
        <option value="none" ${edit.pageBackgroundGradient === 'none' ? 'selected' : ''}>Brak</option>
        <option value="ocean-breeze" ${edit.pageBackgroundGradient === 'ocean-breeze' ? 'selected' : ''}>Ocean Breeze</option>
        <option value="sunset-glow" ${edit.pageBackgroundGradient === 'sunset-glow' ? 'selected' : ''}>Sunset Glow</option>
        <option value="forest-mist" ${edit.pageBackgroundGradient === 'forest-mist' ? 'selected' : ''}>Forest Mist</option>
        <option value="lavender-dream" ${edit.pageBackgroundGradient === 'lavender-dream' ? 'selected' : ''}>Lavender Dream</option>
        <option value="desert-sunset" ${edit.pageBackgroundGradient === 'desert-sunset' ? 'selected' : ''}>Desert Sunset</option>
        <option value="midnight-sky" ${edit.pageBackgroundGradient === 'midnight-sky' ? 'selected' : ''}>Midnight Sky</option>
      </select>
      <label>Przezroczystość tła:</label>
      <input type="range" id="editPageBackgroundOpacity" min="0.1" max="1.0" step="0.1" value="${edit.pageBackgroundOpacity || 1.0}">
    </div>
    <button onclick="savePageEdit(${pageIndex})" class="btn-primary">Zapisz</button>
  `;
  document.getElementById('editModal').style.display = 'block';
}
function savePageEdit(pageIndex) {
  const newPageIndex = parseInt(document.getElementById('editPageSelect').value);
  pageEdits[newPageIndex] = {
    nazwaFont: document.getElementById('editNazwaFont').value,
    nazwaFontColor: document.getElementById('editNazwaColor').value,
    indeksFont: document.getElementById('editIndeksFont').value,
    indeksFontColor: document.getElementById('editIndeksColor').value,
    rankingFont: document.getElementById('editRankingFont').value,
    rankingFontColor: document.getElementById('editRankingColor').value,
    cenaFont: document.getElementById('editCenaFont').value,
    cenaFontColor: document.getElementById('editCenaColor').value,
    priceCurrency: document.getElementById('editCenaCurrency').value,
    showPriceLabel: document.querySelector('input[name="priceFormat"]:checked').value === 'true',
    pageBackgroundGradient: document.getElementById('editPageBackgroundGradient').value || 'none',
    pageBackgroundOpacity: parseFloat(document.getElementById('editPageBackgroundOpacity').value) || 1.0
  };
  console.log('Saved Page Edit for Page Index:', newPageIndex, pageEdits[newPageIndex]);
  renderCatalog();
  hideEditModal();
}
function showVirtualEditModal(productIndex) {
  const product = products[productIndex];
  const edit = productEdits[productIndex] || {
    nazwaFont: 'Arial',
    nazwaFontColor: '#000000',
    indeksFont: 'Arial',
    indeksFontColor: '#000000',
    rankingFont: 'Arial',
    rankingFontColor: '#000000',
    cenaFont: 'Arial',
    cenaFontColor: '#000000',
    priceCurrency: globalCurrency,
    priceFontSize: 'medium',
    positionX: 320,
    positionY: 10,
    borderStyle: 'solid',
    borderColor: '#000000',
    backgroundTexture: null,
    backgroundOpacity: 1.0
  };
  const modal = document.getElementById('virtualEditModal');
  modal.innerHTML = `
    <div style="position: relative; width: 800px; height: 600px; border: 1px solid #ccc;">
      <canvas id="virtualEditCanvas" width="800" height="600"></canvas>
      <div id="editPanel" style="position: absolute; top: 10px; right: 10px; background: white; padding: 10px; border: 1px solid #ccc; display: none;">
        <select id="fontSelect">
          <option value="Arial" ${edit.nazwaFont === 'Arial' ? 'selected' : ''}>Arial</option>
          <option value="Helvetica" ${edit.nazwaFont === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
          <option value="Times" ${edit.nazwaFont === 'Times' ? 'selected' : ''}>Times New Roman</option>
        </select>
        <input type="color" id="colorSelect" value="${edit.nazwaFontColor}">
        <select id="sizeSelect">
          <option value="small" ${edit.priceFontSize === 'small' ? 'selected' : ''}>Mały</option>
          <option value="medium" ${edit.priceFontSize === 'medium' ? 'selected' : ''}>Średni</option>
          <option value="large" ${edit.priceFontSize === 'large' ? 'selected' : ''}>Duży</option>
        </select>
        <select id="borderStyleSelect">
          <option value="solid" ${edit.borderStyle === 'solid' ? 'selected' : ''}>Pełna linia</option>
          <option value="dashed" ${edit.borderStyle === 'dashed' ? 'selected' : ''}>Kreskowana</option>
          <option value="dotted" ${edit.borderStyle === 'dotted' ? 'selected' : ''}>Kropkowana</option>
        </select>
        <input type="color" id="borderColorSelect" value="${edit.borderColor || '#000000'}">
        <input type="file" id="backgroundTextureSelect" accept="image/*">
        <label>Przezroczystość tła:</label>
        <input type="range" id="backgroundOpacitySelect" min="0.1" max="1.0" step="0.1" value="${edit.backgroundOpacity || 1.0}">
        <button onclick="applyTextEdit()">Zastosuj</button>
      </div>
      <button id="saveVirtualEdit" style="position: absolute; bottom: 10px; right: 10px;">Zapisz</button>
    </div>
  `;
  modal.style.display = 'block';
  const canvas = new fabric.Canvas('virtualEditCanvas');
  if (edit.backgroundTexture) {
    fabric.Image.fromURL(edit.backgroundTexture, (bgImg) => {
      bgImg.scaleToWidth(800);
      bgImg.set({ opacity: edit.backgroundOpacity || 1.0 });
      canvas.setBackgroundImage(bgImg, canvas.renderAll.bind(canvas));
    });
  }
  fabric.Image.fromURL(uploadedImages[product.indeks] || product.img, (img) => {
    img.scaleToWidth(300);
    canvas.add(img);
  });
  const borderRect = new fabric.Rect({
    left: 0,
    top: 0,
    width: 300,
    height: 200,
    fill: 'transparent',
    stroke: edit.borderColor || '#000000',
    strokeWidth: 2,
    strokeDashArray: edit.borderStyle === 'dashed' ? [5, 5] : edit.borderStyle === 'dotted' ? [2, 2] : null,
    rx: 5,
    ry: 5,
    selectable: false
  });
  canvas.add(borderRect);
  const nazwaText = new fabric.Text(product.nazwa || 'Brak nazwy', {
    left: edit.positionX || 320,
    top: edit.positionY || 10,
    fontSize: edit.priceFontSize === 'small' ? 16 : edit.priceFontSize === 'medium' ? 20 : 24,
    fill: edit.nazwaFontColor,
    fontFamily: edit.nazwaFont,
    selectable: true
  });
  canvas.add(nazwaText);
  const indeksText = new fabric.Text(`Indeks: ${product.indeks || '-'}`, {
    left: 320,
    top: 40,
    fontSize: 16,
    fill: edit.indeksFontColor,
    fontFamily: edit.indeksFont,
    selectable: true
  });
  canvas.add(indeksText);
  if (showRanking && product.ranking) {
    const rankingText = new fabric.Text(`RANKING: ${product.ranking}`, {
      left: 320,
      top: 60,
      fontSize: 16,
      fill: edit.rankingFontColor,
      fontFamily: edit.rankingFont,
      selectable: true
    });
    canvas.add(rankingText);
  }
  if (showCena && product.cena) {
    const cenaText = new fabric.Text(`${priceLabel}: ${product.cena} ${(edit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£'}`, {
      left: 320,
      top: 80,
      fontSize: edit.priceFontSize === 'small' ? 16 : edit.priceFontSize === 'medium' ? 20 : 24,
      fill: edit.cenaFontColor,
      fontFamily: edit.cenaFont,
      selectable: true
    });
    canvas.add(cenaText);
  }
  if (showEan && product.ean && product.barcode) {
    fabric.Image.fromURL(product.barcode, (barcodeImg) => {
      barcodeImg.scaleToWidth(100);
      barcodeImg.set({ left: 320, top: 100, selectable: true });
      canvas.add(barcodeImg);
    });
  }
  canvas.on('object:selected', (e) => {
    const obj = e.target;
    document.getElementById('editPanel').style.display = 'block';
    document.getElementById('fontSelect').value = obj.fontFamily || 'Arial';
    document.getElementById('colorSelect').value = obj.fill || '#000000';
    document.getElementById('sizeSelect').value = obj.fontSize === 16 ? 'small' : obj.fontSize === 20 ? 'medium' : 'large';
    document.getElementById('borderStyleSelect').value = edit.borderStyle || 'solid';
    document.getElementById('borderColorSelect').value = edit.borderColor || '#000000';
    document.getElementById('backgroundOpacitySelect').value = edit.backgroundOpacity || 1.0;
    window.applyTextEdit = function() {
      obj.set({
        fontFamily: document.getElementById('fontSelect').value,
        fill: document.getElementById('colorSelect').value,
        fontSize: document.getElementById('sizeSelect').value === 'small' ? 16 : document.getElementById('sizeSelect').value === 'medium' ? 20 : 24
      });
      const borderStyle = document.getElementById('borderStyleSelect').value;
      const borderColor = document.getElementById('borderColorSelect').value;
      const backgroundOpacity = parseFloat(document.getElementById('backgroundOpacitySelect').value);
      const backgroundTextureInput = document.getElementById('backgroundTextureSelect').files[0];
      if (backgroundTextureInput) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fabric.Image.fromURL(e.target.result, (bgImg) => {
            bgImg.scaleToWidth(800);
            bgImg.set({ opacity: backgroundOpacity });
            canvas.setBackgroundImage(bgImg, canvas.renderAll.bind(canvas));
            edit.backgroundTexture = e.target.result;
            edit.backgroundOpacity = backgroundOpacity;
          });
        };
        reader.readAsDataURL(backgroundTextureInput);
      } else {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        edit.backgroundTexture = null;
      }
      borderRect.set({
        stroke: borderColor,
        strokeDashArray: borderStyle === 'dashed' ? [5, 5] : borderStyle === 'dotted' ? [2, 2] : null
      });
      edit.borderStyle = borderStyle;
      edit.borderColor = borderColor;
      edit.backgroundOpacity = backgroundOpacity;
      canvas.renderAll();
    };
  });
  canvas.on('object:moving', (e) => {
    const obj = e.target;
    console.log('Przesunięto:', obj.left, obj.top);
  });
  document.getElementById('saveVirtualEdit').onclick = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      productEdits[productIndex] = {
        ...productEdits[productIndex],
        nazwaFont: activeObject === nazwaText ? activeObject.fontFamily : edit.nazwaFont,
        nazwaFontColor: activeObject === nazwaText ? activeObject.fill : edit.nazwaFontColor,
        indeksFont: activeObject === indeksText ? activeObject.fontFamily : edit.indeksFont,
        indeksFontColor: activeObject === indeksText ? activeObject.fill : edit.indeksFontColor,
        rankingFont: activeObject === rankingText ? activeObject.fontFamily : edit.rankingFont,
        rankingFontColor: activeObject === rankingText ? activeObject.fill : edit.rankingFontColor,
        cenaFont: activeObject === cenaText ? activeObject.fontFamily : edit.cenaFont,
        cenaFontColor: activeObject === cenaText ? activeObject.fill : edit.cenaFontColor,
        priceFontSize: activeObject === nazwaText || activeObject === cenaText ? (activeObject.fontSize === 16 ? 'small' : activeObject.fontSize === 20 ? 'medium' : 'large') : edit.priceFontSize,
        positionX: activeObject.left,
        positionY: activeObject.top,
        borderStyle: edit.borderStyle || 'solid',
        borderColor: edit.borderColor || '#000000',
        backgroundTexture: edit.backgroundTexture || null,
        backgroundOpacity: edit.backgroundOpacity || 1.0
      };
    }
    console.log('Saved Virtual Edit for Product Index:', productIndex, productEdits[productIndex]);
    canvas.dispose();
    modal.style.display = 'none';
    renderCatalog();
    previewPDF();
  };
}
function hideEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('virtualEditModal').style.display = 'none';
}
window.importExcel = importExcel;
window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
window.showEditModal = showEditModal;
window.showVirtualEditModal = showVirtualEditModal;
window.hideEditModal = hideEditModal;
window.showPageEditModal = showPageEditModal;
window.savePageEdit = savePageEdit;
window.loadProducts = loadProducts;
loadProducts();
