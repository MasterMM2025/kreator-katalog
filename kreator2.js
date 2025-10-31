// === PODSTAWOWE FUNKCJE ===
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
  if (borderStyle === "dashed") doc.setLineDash([5, 5]);
  else if (borderStyle === "dotted") doc.setLineDash([2, 2]);
  else doc.setLineDash([]);
  doc.roundedRect(x, y, w, h, 5, 5, 'S');
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function showProgressModal() {
  document.getElementById('progressModal').style.display = 'block';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressText').textContent = '0%';
}

function hideProgressModal() {
  document.getElementById('progressModal').style.display = 'none';
}

// === BUDOWANIE PDF ===
async function buildPDF(jsPDF, save = true) {
  showProgressModal();
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bannerHeight = 85;
  let totalProducts = products.length;
  let processedProducts = 0;

  let productIndex = 0;
  let pageNumber = 1;

  // === OKŁADKA ===
  if (selectedCover) {
    try {
      doc.addImage(selectedCover.data, selectedCover.data.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      if (products.length > 0) doc.addPage();
    } catch (e) {
      console.error('Błąd okładki:', e);
    }
  }

  // === DEKLARACJE TŁA I BANNERA ===
  const bannerImg = selectedBanner ? selectedBanner.data : null;
  const backgroundImg = selectedBackground ? selectedBackground.data : null;

  const applyGradient = (gradientType, opacity) => {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: opacity || 1.0 }));
    if (gradientType === "blue") {
      doc.setFillColor(240, 248, 255); doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(0, 105, 192); doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "green") {
      doc.setFillColor(245, 255, 245); doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(46, 139, 87); doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "gray") {
      doc.setFillColor(245, 245, 245); doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(112, 128, 144); doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "red") {
      doc.setFillColor(255, 240, 240); doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(178, 34, 34); doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "purple") {
      doc.setFillColor(245, 240, 255); doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(106, 90, 205); doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "orange") {
      doc.setFillColor(255, 245, 238); doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(255, 165, 0); doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    }
    doc.restoreGraphicsState();
  };

  const marginTop = 20 + bannerHeight;
  const marginBottom = 28;
  const marginLeftRight = 14;
  const showEan = document.getElementById('showEan')?.checked || false;
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;
  let x = marginLeftRight;
  let y = marginTop;

  function getItemsPerPage(layout) {
    if (layout === "1") return 1;
    if (layout === "2") return 2;
    if (layout === "4") return 4;
    if (layout === "8") return 8;
    if (layout === "16") return 16;
    if (layout === "4-2-4") return 10;
    return 16;
  }

  // === FUNKCJA DODAJĄCA TŁO I BANNER (GLOBALNY + INDYWIDUALNY) ===
  const addBackgroundAndBanner = (pageIndex) => {
    if (backgroundImg) {
      doc.addImage(backgroundImg, backgroundImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    }

    // 1. Indywidualny banner – jeśli istnieje
    if (typeof addPageBanner === 'function' && pageBanners[pageIndex]) {
      addPageBanner(doc, pageIndex, pageWidth, bannerHeight);
    }
    // 2. Globalny banner – fallback
    else if (bannerImg) {
      doc.addImage(bannerImg, bannerImg.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, bannerHeight, undefined, "FAST");
    }
  };

  // === PIERWSZA STRONA Z PRODUKTAMI ===
  if (products.length > 0) {
    addBackgroundAndBanner(0); // strona 0
  }

  // === MODUŁ 8 ===
  const drawSection8 = async (sectionCols, sectionRows, boxWidth, boxHeight) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[pageNumber - 1] || {
          nazwaFont: 'Arial', nazwaFontColor: '#000000',
          indeksFont: 'Arial', indeksFontColor: '#000000',
          rankingFont: 'Arial', rankingFontColor: '#000000',
          cenaFont: 'Arial', cenaFontColor: '#000000',
          priceCurrency: globalCurrency, showPriceLabel: true,
          borderStyle: 'solid', borderColor: '#000000',
          backgroundTexture: null, backgroundOpacity: 1.0
        };
        const finalEdit = { ...pageEdit, ...edit };

        if (finalEdit.backgroundTexture) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
          doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
          doc.restoreGraphicsState();
        }

        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');

        let imgSrc = uploadedImages[p.indeks] || p.img;
        const hasEan = showEan && p.ean && p.barcode;

        const imgMaxW = 150, imgMaxH = 115;
        const textAreaX = x + 165;
        let currentY = y + 20;

        if (imgSrc) {
          const img = new Image(); img.src = imgSrc;
          await Promise.race([new Promise(res => img.onload = res), new Promise((_, rej) => setTimeout(() => rej(), 5000))]).catch(() => {});
          const scale = Math.min(imgMaxW / img.width, imgMaxH / img.height);
          const w = img.width * scale, h = img.height * scale;
          const imgX = x + 8, imgY = y + (boxHeight - h) / 2;
          doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
        }

        doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
        doc.setFontSize(9);
        doc.setTextColor(...hexToRgb(finalEdit.nazwaFontColor || '#000000'));
        const nazwaLines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - 175);
        const maxY = y + boxHeight - 25;
        nazwaLines.forEach(line => {
          if (currentY <= maxY) {
            doc.text(line, textAreaX, currentY);
            currentY += 10;
          }
        });
        currentY += 6;

        doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
        doc.setFontSize(8);
        doc.setTextColor(...hexToRgb(finalEdit.indeksFontColor || '#000000'));
        doc.text(`Indeks: ${p.indeks || 'Brak'}`, textAreaX, currentY);
        currentY += 10;

        if (showRanking && p.ranking) {
          doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
          doc.setFontSize(8);
          doc.setTextColor(...hexToRgb(finalEdit.rankingFontColor || '#000000'));
          doc.text(`RANKING: ${p.ranking}`, textAreaX, currentY);
          currentY += 10;
        }

        let priceY = y + boxHeight - 60;
        if (showCena && p.cena) {
          const priceFontSize = (finalEdit.priceFontSize || 'medium') === 'small' ? 13 : (finalEdit.priceFontSize === 'medium' ? 15 : 17);
          doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
          doc.setFontSize(priceFontSize);
          doc.setTextColor(...hexToRgb(finalEdit.cenaFontColor || '#000000'));

          const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? 'EUR' : 'GBP';
          const showLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
          const labelText = globalLanguage === 'en' ? 'PRICE' : 'CENA';
          const priceText = (finalEdit.priceCurrency || globalCurrency) === 'GBP'
            ? `${showLabel ? `${labelText}: ` : ''}${currencySymbol} ${p.cena}`
            : `${showLabel ? `${labelText}: ` : ''}${p.cena} ${currencySymbol}`;

          const priceTextWidth = doc.getTextWidth(priceText);
          const textAreaWidth = boxWidth - 195;
          const priceX = textAreaX + (textAreaWidth - priceTextWidth) / 2;
          priceY = y + boxHeight - (hasEan ? 60 : 35);

          doc.text(priceText, priceX, priceY);
        }

        let by = y + boxHeight - 44;
        if (hasEan) {
          const bw = 100, bh = 38;
          const bx = x + boxWidth - bw - 8;
          by = y + boxHeight - bh - 6;
          doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
        }

        if (p.flagImg) {
          const flagWidth = 100;
          const flagHeight = 80;
          const flagX = x + boxWidth - flagWidth - 1;
          let flagY;
          if (hasEan) {
            flagY = by - flagHeight - 2;
          } else {
            flagY = priceY + 10;
          }
          doc.addImage(p.flagImg, "PNG", flagX, flagY, flagWidth, flagHeight, undefined, save ? "SLOW" : "FAST");
        }

        processedProducts++;
        document.getElementById('progressBar').style.width = `${(processedProducts / totalProducts) * 100}%`;
        document.getElementById('progressText').textContent = `${Math.round((processedProducts / totalProducts) * 100)}%`;
        x += boxWidth + 6;
        productIndex++;
      }
      x = marginLeftRight;
      y += boxHeight + 6;
    }
    return y;
  };

  // === MODUŁ 16 ===
  const drawSection16 = async (sectionCols, sectionRows, boxWidth, boxHeight) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[pageNumber - 1] || {
          nazwaFont: 'Arial', nazwaFontColor: '#000000',
          indeksFont: 'Arial', indeksFontColor: '#000000',
          rankingFont: 'Arial', rankingFontColor: '#000000',
          cenaFont: 'Arial', cenaFontColor: '#000000',
          priceCurrency: globalCurrency, showPriceLabel: true,
          borderStyle: 'solid', borderColor: '#000000',
          backgroundTexture: null, backgroundOpacity: 1.0
        };
        const finalEdit = { ...pageEdit, ...edit };

        if (finalEdit.backgroundTexture) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
          doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
          doc.restoreGraphicsState();
        }

        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');

        let imgSrc = uploadedImages[p.indeks] || p.img;
        const hasEan = showEan && p.ean && p.barcode;

        const imgMaxW = 80, imgMaxH = 60;
        const textAreaX = x + 90;
        let currentY = y + 14;

        if (imgSrc) {
          const img = new Image(); img.src = imgSrc;
          await Promise.race([new Promise(res => img.onload = res), new Promise((_, rej) => setTimeout(() => rej(), 5000))]).catch(() => {});
          const scale = Math.min(imgMaxW / img.width, imgMaxH / img.height);
          const w = img.width * scale, h = img.height * scale;
          const imgX = x + 6, imgY = y + (boxHeight - h) / 2;
          doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
        }

        doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb(finalEdit.nazwaFontColor || '#000000'));
        const nazwaLines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - 90);
        const maxY = y + boxHeight - 55;
        let lineCount = 0;
        nazwaLines.forEach(line => {
          if (currentY <= maxY && lineCount < 5) {
            doc.text(line, textAreaX, currentY);
            currentY += 7.8;
            lineCount++;
          }
        });
        currentY += 2;

        doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb(finalEdit.indeksFontColor || '#000000'));
        doc.text(`Indeks: ${p.indeks || 'Brak'}`, textAreaX, currentY);
        currentY += 7;

        if (showRanking && p.ranking) {
          doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(...hexToRgb(finalEdit.rankingFontColor || '#000000'));
          doc.text(`RANKING: ${p.ranking}`, textAreaX, currentY);
          currentY += 7;
        }

        if (showCena && p.cena) {
          const priceY = currentY + 8;
          doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
          doc.setFontSize(12);
          doc.setTextColor(...hexToRgb(finalEdit.cenaFontColor || '#000000'));
          const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? 'EUR' : 'GBP';
          const showLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
          const labelText = globalLanguage === 'en' ? 'PRICE' : 'CENA';
          const priceText = showLabel
            ? `${labelText}: ${p.cena} ${currencySymbol}`
            : `${p.cena} ${currencySymbol}`;
          doc.text(priceText, textAreaX, priceY);
        }

        if (hasEan) {
          const bw = 90, bh = 33;
          const bx = x + boxWidth - bw - 6;
          const by = y + boxHeight - bh - 5;
          doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
        }

        processedProducts++;
        document.getElementById('progressBar').style.width = `${(processedProducts / totalProducts) * 100}%`;
        document.getElementById('progressText').textContent = `${Math.round((processedProducts / totalProducts) * 100)}%`;
        x += boxWidth + 6;
        productIndex++;
      }
      x = marginLeftRight;
      y += boxHeight + 6;
    }
    return y;
  };

    // === MODUŁ UNIWERSALNY ===
  const drawSection = async (sectionCols, sectionRows, boxWidth, boxHeight, isLarge) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[pageNumber - 1] || {
          nazwaFont: 'Arial', nazwaFontColor: '#000000',
          indeksFont: 'Arial', indeksFontColor: '#000000',
          rankingFont: 'Arial', rankingFontColor: '#000000',
          cenaFont: 'Arial', cenaFontColor: '#000000',
          priceCurrency: globalCurrency, showPriceLabel: true,
          borderStyle: 'solid', borderColor: '#000000',
          backgroundTexture: null, backgroundOpacity: 1.0
        };
        const finalEdit = { ...pageEdit, ...edit };
        if (finalEdit.backgroundTexture) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
          doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
          doc.restoreGraphicsState();
        }
        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');
        let imgSrc = uploadedImages[p.indeks] || p.img;
        const hasEan = showEan && p.ean && p.barcode;
        // RYSUJ ZDJĘCIE – ZAWSZE, DLA MAŁYCH I DUŻYCH MODUŁÓW
        if (imgSrc) {
          const img = new Image(); img.src = imgSrc;
          await Promise.race([new Promise(res => img.onload = res), new Promise((_, rej) => setTimeout(() => rej(), 5000))]).catch(() => {});
          let maxW, maxH, imgX, imgY, w, h, scale;
          if (isLarge) {
            maxW = 180; maxH = 140;
            scale = Math.min(maxW / img.width, maxH / img.height);
            w = img.width * scale; h = img.height * scale;
            imgX = x + (boxWidth - w) / 2;
            imgY = y + 25;
          } else {
            maxW = 80; maxH = 60;
            scale = Math.min(maxW / img.width, maxH / img.height);
            w = img.width * scale; h = img.height * scale;
            imgX = x + 6;
            imgY = y + (boxHeight - h) / 2;
          }
          doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
        }
       
        // POZYCJA TEKSTU – JAK W MODULE 16
        let textY = isLarge ? y + 25 + 140 + 20 : y + 14;
        const tx = x + (isLarge ? boxWidth / 2 : 90);
        const align = isLarge ? "center" : "left";

        // NAZWA – TYLKO 2 LINIE W MAŁYCH MODUŁACH
        doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
        doc.setFontSize(isLarge ? 14 : 9);
        doc.setTextColor(...hexToRgb(finalEdit.nazwaFontColor || '#000000'));
        const lines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - (isLarge ? 40 : 90));
        const maxNameLines = isLarge ? 3 : 2;
        lines.slice(0, maxNameLines).forEach((line, i) => {
          doc.text(line, tx, textY + i * (isLarge ? 18 : 10), { align });
        });
        textY += (isLarge ? maxNameLines * 18 + 10 : maxNameLines * 10 + 6);

        // INDEKS
        doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
        doc.setFontSize(isLarge ? 10 : 8);
        doc.setTextColor(...hexToRgb(finalEdit.indeksFontColor || '#000000'));
        doc.text(`Indeks: ${p.indeks || '-'}`, tx, textY, { align });

        // WIĘKSZY ODSTĘP MIĘDZY INDEKSEM A CENĄ
        textY += isLarge ? 20 : 12; // ← POPRAWKA: 12pt w małych modułach

        // CENA
        if (showCena && p.cena) {
          doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
          doc.setFontSize(isLarge ? 20 : 12);
          doc.setTextColor(...hexToRgb(finalEdit.cenaFontColor || '#000000'));
          const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
          const showLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
          const labelText = globalLanguage === 'en' ? 'PRICE' : 'CENA';
          const priceText = showLabel
            ? `${labelText}: ${currencySymbol === '£' ? `${currencySymbol} ${p.cena}` : `${p.cena} ${currencySymbol}`}`
            : `${currencySymbol === '£' ? `${currencySymbol} ${p.cena}` : `${p.cena} ${currencySymbol}`}`;
          doc.text(priceText, tx, textY, { align });
        }

        let bw, bh, bx, by;
        if (hasEan) {
          bw = isLarge ? 140 : 90;
          bh = isLarge ? 40 : 33;
          bx = isLarge ? x + (boxWidth - bw) / 2 : x + boxWidth - bw - 6;
          by = y + boxHeight - bh - 5;
          doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
        }
        if (pageEdits[pageNumber - 1]?.layout === "4" && p.flagImg && isLarge) {
          const flagWidth = 150, flagHeight = 100;
          const flagX = x + (boxWidth - flagWidth) / 2 + 8;
          const flagY = hasEan ? (y + boxHeight - bh - 5 - flagHeight) : textY + 10;
          doc.addImage(p.flagImg, "PNG", flagX, flagY, flagWidth, flagHeight, undefined, save ? "SLOW" : "FAST");
        }
        processedProducts++;
        document.getElementById('progressBar').style.width = `${(processedProducts / totalProducts) * 100}%`;
        document.getElementById('progressText').textContent = `${Math.round((processedProducts / totalProducts) * 100)}%`;
        x += boxWidth + 6;
        productIndex++;
      }
      x = marginLeftRight;
      y += boxHeight + 6;
    }
    return y;
  };
  const drawSectionSmall = async (sectionCols, sectionRows, boxWidth, boxHeight) => {
    return await drawSection(sectionCols, sectionRows, boxWidth, boxHeight, false);
  };

  // === GŁÓWNA PĘTLA ===
  while (productIndex < products.length) {
    const pageEdit = pageEdits[pageNumber - 1] || {};
    const currentLayout = pageEdit.layout || "16";

    let cols, rows, boxWidth, boxHeight, isLarge;

    if (currentLayout === "1") {
      cols = 1; rows = 1;
      boxWidth = pageWidth - marginLeftRight * 2;
      boxHeight = pageHeight - marginTop - marginBottom;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (currentLayout === "2") {
      cols = 2; rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = pageHeight - marginTop - marginBottom;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (currentLayout === "4") {
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = (pageHeight - marginTop - marginBottom - 6) / 2;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (currentLayout === "8") {
      cols = 2; rows = 4;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = (pageHeight - marginTop - marginBottom - 18) / 4;
      y = await drawSection8(cols, rows, boxWidth, boxHeight);
    } else if (currentLayout === "16") {
      cols = 2; rows = 8;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = (pageHeight - marginTop - marginBottom - 42) / 8;
      y = await drawSection16(cols, rows, boxWidth, boxHeight);
    } else if (currentLayout === "4-2-4") {
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - 6) / 2;
      isLarge = false;
      y = await drawSectionSmall(cols, rows, boxWidth, boxHeight);

      cols = 2; rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = (pageHeight - marginTop - marginBottom) * 0.4;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);

      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - 6) / 2;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - 6) / 2;
      isLarge = false;
      y = await drawSectionSmall(cols, rows, boxWidth, boxHeight);
    }

    if (productIndex < products.length) {
      // === DODAJ STRONĘ A4 PO OBECNEJ STRONIE (przed przejściem do następnej) ===
      if (typeof addInsertPage === 'function') {
        addInsertPage(doc, pageNumber - 1, pageWidth, pageHeight); // po stronie (pageNumber-1)
      }
    
      doc.addPage();
      pageNumber++;
    
      const nextPageEdit = pageEdits[pageNumber - 1] || {};
    
      // TŁO I BANNER NA NOWEJ STRONIE
      addBackgroundAndBanner(pageNumber - 1);
    
      // GRADIENT INDYWIDUALNY
      if (nextPageEdit.pageBackgroundGradient && nextPageEdit.pageBackgroundGradient !== "none") {
        applyGradient(nextPageEdit.pageBackgroundGradient, nextPageEdit.pageBackgroundOpacity);
      }
    
      doc.setFont("Arial", "bold");
      doc.setFontSize(12);
      doc.text(`${pageNumber}`, pageWidth - 20, pageHeight - 10, { align: "right" });
    
      x = marginLeftRight;
      y = marginTop;
    }
  }

  // === DODAJ OSTATNIĄ STRONĘ (BACK COVER) ===
  if (typeof addBackCover === 'function') {
    addBackCover(doc, pageWidth, pageHeight);
  }

  hideProgressModal();
  if (save) doc.save("katalog.pdf");
  return doc;
}

async function generatePDF() {
  try {
    const { jsPDF } = window.jspdf;
    await buildPDF(jsPDF, true);
  } catch (e) {
    console.error('Błąd:', e);
    hideProgressModal();
  }
}

async function previewPDF() {
  try {
    showProgressModal();
    const { jsPDF } = window.jspdf;
    const doc = await buildPDF(jsPDF, false);
    document.getElementById("pdfIframe").src = doc.output("bloburl");
    document.getElementById("pdfPreview").style.display = "block";
    hideProgressModal();
  } catch (e) {
    console.error('Błąd podglądu:', e);
    hideProgressModal();
  }
}

// === SIDEBAR – TYLKO DOMYŚLNY LAYOUT ===
document.getElementById('layoutSelect')?.addEventListener('change', function() {
  renderCatalog();
  previewPDF();
});

function getItemsPerPage(layout) {
  if (layout === "1") return 1;
  if (layout === "2") return 2;
  if (layout === "4") return 4;
  if (layout === "8") return 8;
  if (layout === "16") return 16;
  if (layout === "4-2-4") return 10;
  return 16;
}

// === FUNKCJA OBLICZAJĄCA RZECZYWISTĄ LICZBĘ STRON ===
function calculateTotalPages() {
  let totalProducts = products.length;
  let currentProduct = 0;
  let calculatedPages = 0;

  while (currentProduct < totalProducts) {
    const pageEdit = pageEdits[calculatedPages] || {};
    const layout = pageEdit.layout || "16";
    const itemsPerPage = getItemsPerPage(layout);
    currentProduct += itemsPerPage;
    calculatedPages++;

    if (!pageEdits[calculatedPages]) {
      pageEdits[calculatedPages] = { layout: "16" };
    }
  }

  return calculatedPages;
}

// === EDYCJA PRODUKTU ===
function showEditModal(productIndex) {
  const product = products[productIndex];
  const edit = productEdits[productIndex] || {
    nazwaFont: 'Arial', nazwaFontColor: '#000000',
    indeksFont: 'Arial', indeksFontColor: '#000000',
    rankingFont: 'Arial', rankingFontColor: '#000000',
    cenaFont: 'Arial', cenaFontColor: '#000000',
    priceCurrency: globalCurrency, priceFontSize: 'medium',
    logo: null, borderStyle: 'solid', borderColor: '#000000',
    backgroundTexture: null, backgroundOpacity: 1.0,
    pageBackgroundGradient: 'none', pageBackgroundOpacity: 1.0
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
          <option value="EUR" ${edit.priceCurrency === 'EUR' ? 'selected' : ''}>EUR (EUR)</option>
          <option value="GBP" ${edit.priceCurrency === 'GBP' ? 'selected' : ''}>GBP (GBP)</option>
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
    <div class="edit-field">
      <label>Gradient tła strony:</label>
      <select id="editPageBackgroundGradient">
        <option value="none" ${edit.pageBackgroundGradient === 'none' ? 'selected' : ''}>Brak</option>
        <option value="blue" ${edit.pageBackgroundGradient === 'blue' ? 'selected' : ''}>Niebieski</option>
        <option value="green" ${edit.pageBackgroundGradient === 'green' ? 'selected' : ''}>Zielony</option>
        <option value="gray" ${edit.pageBackgroundGradient === 'gray' ? 'selected' : ''}>Szary</option>
        <option value="red" ${edit.pageBackgroundGradient === 'red' ? 'selected' : ''}>Czerwony</option>
        <option value="purple" ${edit.pageBackgroundGradient === 'purple' ? 'selected' : ''}>Fioletowy</option>
        <option value="orange" ${edit.pageBackgroundGradient === 'orange' ? 'selected' : ''}>Pomarańczowy</option>
      </select>
      <label>Przezroczystość tła:</label>
      <input type="range" id="editPageBackgroundOpacity" min="0.1" max="1.0" step="0.1" value="${edit.pageBackgroundOpacity || 1.0}">
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
    backgroundOpacity: parseFloat(document.getElementById('editBackgroundOpacity').value) || 1.0,
    pageBackgroundGradient: document.getElementById('editPageBackgroundGradient').value || 'none',
    pageBackgroundOpacity: parseFloat(document.getElementById('editPageBackgroundOpacity').value) || 1.0
  };
  console.log('Saved Edit for Product Index:', productIndex, productEdits[productIndex]);
  renderCatalog();
  hideEditModal();
}

function showPageEditModal(pageIndex) {
  const totalPages = calculateTotalPages();

  const edit = pageEdits[pageIndex] || {
    nazwaFont: 'Arial', nazwaFontColor: '#000000',
    indeksFont: 'Arial', indeksFontColor: '#000000',
    rankingFont: 'Arial', rankingFontColor: '#000000',
    cenaFont: 'Arial', cenaFontColor: '#000000',
    priceCurrency: globalCurrency, showPriceLabel: true,
    pageBackgroundGradient: 'none', pageBackgroundOpacity: 1.0,
    layout: '16'
  };

  const editForm = document.getElementById('editForm');

  editForm.innerHTML = `
    <div class="edit-field">
      <label>Wybierz stronę:</label>
      <select id="editPageSelect">
        ${Array.from({ length: totalPages }, (_, i) => `<option value="${i}" ${i === pageIndex ? 'selected' : ''}>Strona ${i + 1}</option>`).join('')}
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
        <option value="EUR" ${edit.priceCurrency === 'EUR' ? 'selected' : ''}>EUR (EUR)</option>
        <option value="GBP" ${edit.priceCurrency === 'GBP' ? 'selected' : ''}>GBP (GBP)</option>
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
        <option value="blue" ${edit.pageBackgroundGradient === 'blue' ? 'selected' : ''}>Niebieski</option>
        <option value="green" ${edit.pageBackgroundGradient === 'green' ? 'selected' : ''}>Zielony</option>
        <option value="gray" ${edit.pageBackgroundGradient === 'gray' ? 'selected' : ''}>Szary</option>
        <option value="red" ${edit.pageBackgroundGradient === 'red' ? 'selected' : ''}>Czerwony</option>
        <option value="purple" ${edit.pageBackgroundGradient === 'purple' ? 'selected' : ''}>Fioletowy</option>
        <option value="orange" ${edit.pageBackgroundGradient === 'orange' ? 'selected' : ''}>Pomarańczowy</option>
      </select>
      <label>Przezroczystość tła:</label>
      <input type="range" id="editPageBackgroundOpacity" min="0.1" max="1.0" step="0.1" value="${edit.pageBackgroundOpacity || 1.0}">
    </div>
    <div class="edit-field">
      <label>Layout strony:</label>
      <select id="editPageLayout">
        <option value="1" ${edit.layout === '1' ? 'selected' : ''}>1 produkt</option>
        <option value="2" ${edit.layout === '2' ? 'selected' : ''}>2 produkty</option>
        <option value="4" ${edit.layout === '4' ? 'selected' : ''}>4 produkty</option>
        <option value="8" ${edit.layout === '8' ? 'selected' : ''}>8 produktów</option>
        <option value="16" ${edit.layout === '16' ? 'selected' : ''}>16 produktów</option>
        <option value="4-2-4" ${edit.layout === '4-2-4' ? 'selected' : ''}>4-2-4</option>
      </select>
    </div>
    <button onclick="savePageEdit(${pageIndex})" class="btn-primary">Zapisz</button>
  `;
  document.getElementById('editModal').style.display = 'block';

  // === DODAJ OPCJE BANNERA OD RAZU ===
  if (typeof updatePageEnhancements === 'function') {
    setTimeout(updatePageEnhancements, 50);
  }

  // === REAGUJ NA ZMIANĘ STRONY ===
  const select = document.getElementById('editPageSelect');
  select.onchange = () => {
    if (typeof updatePageEnhancements === 'function') {
      setTimeout(updatePageEnhancements, 50);
    }
  };
}

function savePageEdit(pageIndex) {
  try {
    const newPageIndex = parseInt(document.getElementById('editPageSelect').value);
    const newLayout = document.getElementById('editPageLayout').value;

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
      pageBackgroundOpacity: parseFloat(document.getElementById('editPageBackgroundOpacity').value) || 1.0,
      layout: newLayout
    };

    calculateTotalPages();

    console.log('Saved Page Edit for Page Index:', newPageIndex, pageEdits[newPageIndex]);
    renderCatalog();
    hideEditModal();
    previewPDF();
  } catch (e) {
    console.error('Błąd zapisywania edycji strony:', e);
    document.getElementById('debug').innerText = "Błąd zapisywania edycji strony";
  }
}

function showVirtualEditModal(productIndex) {
  // ... (bez zmian)
}

function hideEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('virtualEditModal').style.display = 'none';
}

// === FUNKCJA DODAJĄCA BANNER + STRONĘ A4 (z kreator2.1.js) ===
function updatePageEnhancements() {
  const modal = document.getElementById('editModal');
  const select = document.getElementById('editPageSelect');
  if (!modal || !select || modal.style.display !== 'block') return;

  const pageIndex = parseInt(select.value);
  const totalPages = typeof calculateTotalPages === 'function' ? calculateTotalPages() : 1;

  document.querySelectorAll('.edit-field[data-page-enhance]').forEach(el => el.remove());

  // === BANNER ===
  const bannerDiv = document.createElement('div');
  bannerDiv.className = 'edit-field';
  bannerDiv.dataset.pageEnhance = 'true';

  const bannerLabel = document.createElement('label');
  bannerLabel.textContent = `Banner strony ${pageIndex + 1}:`;
  bannerDiv.appendChild(bannerLabel);

  const bannerButton = document.createElement('button');
  bannerButton.type = 'button';
  bannerButton.className = 'btn-small';
  bannerButton.textContent = 'Zmień';
  bannerButton.onclick = () => importPageBanner(pageIndex);
  bannerDiv.appendChild(bannerButton);

  if (pageBanners[pageIndex]) {
    const img = document.createElement('img');
    img.src = pageBanners[pageIndex].data;
    img.style = 'max-width:150px; margin-top:5px; display:block;';
    bannerDiv.appendChild(img);
  }

  const lastField = modal.querySelector('.edit-field:last-of-type');
  if (lastField) lastField.insertAdjacentElement('afterend', bannerDiv);

  // === STRONA A4 ===
  const insertDiv = document.createElement('div');
  insertDiv.className = 'edit-field';
  insertDiv.dataset.pageEnhance = 'true';

  const insertLabel = document.createElement('label');
  insertLabel.textContent = `Strona A4 po stronie ${pageIndex + 1}:`;
  insertDiv.appendChild(insertLabel);

  const insertButton = document.createElement('button');
  insertButton.type = 'button';
  insertButton.className = 'btn-small';
  insertButton.textContent = 'Dodaj grafikę';
  insertButton.onclick = () => importInsertPage(pageIndex);
  insertDiv.appendChild(insertButton);

  if (pageInserts[pageIndex]) {
    const img = document.createElement('img');
    img.src = pageInserts[pageIndex].data;
    img.style = 'max-width:150px; margin-top:5px; display:block;';
    insertDiv.appendChild(img);
  }

  modal.appendChild(insertDiv);

  // === BACK COVER ===
  if (pageIndex === totalPages - 1) {
    const backDiv = document.createElement('div');
    backDiv.className = 'edit-field';
    backDiv.dataset.pageEnhance = 'true';

    const backLabel = document.createElement('label');
    backLabel.textContent = 'Ostatnia strona (back cover):';
    backDiv.appendChild(backLabel);

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'btn-small';
    backButton.textContent = 'Importuj';
    backButton.onclick = importBackCover;
    backDiv.appendChild(backButton);

    if (selectedBackCover) {
      const img = document.createElement('img');
      img.src = selectedBackCover.data;
      img.style = 'max-width:150px; margin-top:5px; display:block;';
      backDiv.appendChild(img);
    }

    modal.appendChild(backDiv);
  }
}

// === EKSPORT FUNKCJI ===
window.importExcel = importExcel;
window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
window.showEditModal = showEditModal;
window.showVirtualEditModal = showVirtualEditModal;
window.hideEditModal = hideEditModal;
window.showPageEditModal = showPageEditModal;
window.savePageEdit = savePageEdit;

// === URUCHOMIENIE – TYLKO W KREATOR1.JS! ===
window.addEventListener('load', () => {
  loadProducts();
});
