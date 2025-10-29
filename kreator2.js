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

  const applyGradient = (gradientType, opacity) => {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: opacity || 1.0 }));
    if (gradientType === "blue") {
      doc.setFillColor(240, 248, 255);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(0, 105, 192);
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "green") {
      doc.setFillColor(245, 255, 245);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(46, 139, 87);
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "gray") {
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(112, 128, 144);
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "red") {
      doc.setFillColor(255, 240, 240);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(178, 34, 34);
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "purple") {
      doc.setFillColor(245, 240, 255);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(106, 90, 205);
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "orange") {
      doc.setFillColor(255, 245, 238);
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(255, 165, 0);
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    }
    doc.restoreGraphicsState();
  };

  if (products.length > 0) {
    const pageEdit = pageEdits[pageNumber - 1] || {};
    if (pageEdit.pageBackgroundGradient && pageEdit.pageBackgroundGradient !== "none") {
      try {
        applyGradient(pageEdit.pageBackgroundGradient, pageEdit.pageBackgroundOpacity);
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

  // === MODUŁ 8 – CENA NIE WYCHODZI POZA PUDEŁKO ===
  const drawSection8 = async (sectionCols, sectionRows, boxWidth, boxHeight) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[Math.floor(productIndex / itemsPerPage)] || {
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
          try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
            doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
            doc.restoreGraphicsState();
          } catch (e) { console.error('Błąd tekstury:', e); }
        }

        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');

        let imgSrc = uploadedImages[p.indeks] || p.img;
        const hasEan = showEan && p.ean && p.barcode;

        const imgMaxW = 150, imgMaxH = 115;
        const textAreaX = x + 165;
        let currentY = y + 20;

        if (imgSrc) {
          try {
            const img = new Image(); img.src = imgSrc;
            await Promise.race([
              new Promise((res, rej) => { img.onload = res; img.onerror = rej; }),
              new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 5000))
            ]);
            const scale = Math.min(imgMaxW / img.width, imgMaxH / img.height);
            const w = img.width * scale, h = img.height * scale;
            const imgX = x + 8, imgY = y + (boxHeight - h) / 2;
            doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
          } catch (e) { console.error('Błąd obrazka:', e); }
        }

        // NAZWA
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

        // INDEKS
        doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
        doc.setFontSize(8);
        doc.setTextColor(...hexToRgb(finalEdit.indeksFontColor || '#000000'));
        doc.text(`Indeks: ${p.indeks || 'Brak'}`, textAreaX, currentY);
        currentY += 10;

        // RANKING
        if (showRanking && p.ranking) {
          doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
          doc.setFontSize(8);
          doc.setTextColor(...hexToRgb(finalEdit.rankingFontColor || '#000000'));
          doc.text(`RANKING: ${p.ranking}`, textAreaX, currentY);
          currentY += 10;
        }

        // CENA – MNIEJSZY OBSZAR, NIE WYCHODZI POZA PUDEŁKO
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
          
          // MNIEJSZY OBSZAR: -195 zamiast -175
          const textAreaWidth = boxWidth - 195;
          const priceX = textAreaX + (textAreaWidth - priceTextWidth) / 2;
          const priceY = y + boxHeight - (showEan ? 60 : 35);

          doc.text(priceText, priceX, priceY);
        }

        // EAN
        if (hasEan) {
          try {
            const bw = 100, bh = 38;
            const bx = x + boxWidth - bw - 8;
            const by = y + boxHeight - bh - 6;
            doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
          } catch (e) { console.error('Błąd EAN:', e); }
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

  // === MODUŁ 16 – PEŁNA NAZWA PRODUKTU ===
  const drawSection16 = async (sectionCols, sectionRows, boxWidth, boxHeight) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[Math.floor(productIndex / itemsPerPage)] || {
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
          try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
            doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
            doc.restoreGraphicsState();
          } catch (e) { console.error('Błąd tekstury:', e); }
        }

        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');

        let imgSrc = uploadedImages[p.indeks] || p.img;
        const hasEan = showEan && p.ean && p.barcode;

        const imgMaxW = 80;
        const imgMaxH = 60;
        const textAreaX = x + 90;
        let currentY = y + 14; // trochę wyżej

        if (imgSrc) {
          try {
            const img = new Image(); img.src = imgSrc;
            await Promise.race([
              new Promise((res, rej) => { img.onload = res; img.onerror = rej; }),
              new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 5000))
            ]);
            const scale = Math.min(imgMaxW / img.width, imgMaxH / img.height);
            const w = img.width * scale, h = img.height * scale;
            const imgX = x + 6, imgY = y + (boxHeight - h) / 2;
            doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
          } catch (e) { console.error('Błąd obrazka:', e); }
        }

        // === NAZWA – MNIEJSZA CZCIONKA, WIĘCEJ LINII ===
        doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
        doc.setFontSize(6.5); // MNIEJSZA: było 7.8 → teraz 6.5
        doc.setTextColor(...hexToRgb(finalEdit.nazwaFontColor || '#000000'));

        const textWidth = boxWidth - 90; // WIĘCEJ MIEJSCA
        const nazwaLines = doc.splitTextToSize(p.nazwa || "Brak nazwy", textWidth);

        const maxY = y + boxHeight - 55; // WIĘCEJ LINII
        let lineCount = 0;
        nazwaLines.forEach(line => {
          if (currentY <= maxY && lineCount < 5) { // max 5 linii
            doc.text(line, textAreaX, currentY);
            currentY += 7.8; // mniejszy odstęp
            lineCount++;
          }
        });
        currentY += 2; // mały odstęp

        // INDEKS
        doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...hexToRgb(finalEdit.indeksFontColor || '#000000'));
        doc.text(`Indeks: ${p.indeks || 'Brak'}`, textAreaX, currentY);
        currentY += 7;

        // RANKING
        if (showRanking && p.ranking) {
          doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(...hexToRgb(finalEdit.rankingFontColor || '#000000'));
          doc.text(`RANKING: ${p.ranking}`, textAreaX, currentY);
          currentY += 7;
        }

        // CENA – £ 4.25 lub 4.25 €
        // CENA – PRZESUNIĘTA JESZCZE NIŻEJ
        if (showCena && p.cena) {
          const priceY = currentY + 8;  // BYŁO: +6 → TERAZ +8

          doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
          doc.setFontSize(12);
          doc.setTextColor(...hexToRgb(finalEdit.cenaFontColor || '#000000'));

          const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
          const showLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
          const labelText = globalLanguage === 'en' ? 'PRICE' : 'CENA';
          const priceText = showLabel 
            ? `${labelText}: ${p.cena} ${currencySymbol}` 
            : `${p.cena} ${currencySymbol}`;

          doc.text(priceText, textAreaX, priceY);
        }

        // EAN – NA DOLE
        if (hasEan) {
          try {
            const bw = 90, bh = 33;
            const bx = x + boxWidth - bw - 6;
            const by = y + boxHeight - bh - 5;
            doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
          } catch (e) { console.error('Błąd EAN:', e); }
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

  // === MODUŁ DLA 1, 2, 4, 4-2-4 (BEZ ZMIAN) ===
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

        if (finalEdit.backgroundTexture) {
          try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
            doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
            doc.restoreGraphicsState();
          } catch (e) {
            console.error('Błąd dodawania tekstury tła:', e);
            document.getElementById('debug').innerText = "Błąd dodawania tekstury tła";
          }
        }

        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');

        let imgSrc = uploadedImages[p.indeks] || p.img;
        let logoSrc = edit.logo || (p.producent && manufacturerLogos[p.producent]) || null;
        const hasEan = showEan && p.ean && p.barcode;

        if (isLarge) {
          // === ZDJĘCIE NA GÓRZE ===
          if (imgSrc) {
            try {
              const img = new Image(); img.src = imgSrc;
              await Promise.race([
                new Promise((res, rej) => { img.onload = res; img.onerror = rej; }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 5000))
              ]);
              const maxW = boxWidth * 0.7;
              const maxH = boxHeight * 0.35;
              let scale = Math.min(maxW / img.width, maxH / img.height);
              let w = img.width * scale, h = img.height * scale;
              let imgX = x + (boxWidth - w) / 2;
              let imgY = y + 20;
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
            } catch (e) { console.error('Błąd obrazka:', e); }
          }
        
          let textY = y + 20 + (boxHeight * 0.35) + 15;
        
          // === NAZWA ===
          doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
          doc.setFontSize(14);
          doc.setTextColor(...hexToRgb(finalEdit.nazwaFontColor || '#000000'));
          const lines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - 40);
          lines.slice(0, 3).forEach((line, i) => {
            doc.text(line, x + boxWidth / 2, textY + i * 18, { align: "center" });
          });
          textY += Math.min(lines.length, 3) * 18 + 15;
        
          // === INDEKS + RANKING ===
          doc.setFont(finalEdit.indeksFont || 'Arial', "normal");
          doc.setFontSize(10);
          doc.setTextColor(...hexToRgb(finalEdit.indeksFontColor || '#000000'));
          doc.text(`Indeks: ${p.indeks || '-'}`, x + boxWidth / 2, textY, { align: "center" });
          textY += 16;
        
          if (showRanking && p.ranking) {
            doc.setFont(finalEdit.rankingFont || 'Arial', "normal");
            doc.setFontSize(10);
            doc.setTextColor(...hexToRgb(finalEdit.rankingFontColor || '#000000'));
            doc.text(`Ranking: ${p.ranking}`, x + boxWidth / 2, textY, { align: "center" });
            textY += 20;
          }
        
          // === CENA ===
          if (showCena && p.cena) {
            doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
            doc.setFontSize(20);
            doc.setTextColor(...hexToRgb(finalEdit.cenaFontColor || '#000000'));
            const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
            const showLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
            const labelText = globalLanguage === 'en' ? 'PRICE' : 'CENA';
            const priceText = showLabel
              ? `${labelText}: ${p.cena} ${currencySymbol}`
              : `${p.cena} ${currencySymbol}`;
            doc.text(priceText, x + boxWidth / 2, textY, { align: "center" });
            textY += 30;  // Dodano: Aktualizacja textY po cenie
          }
        
          // === EAN – ZAWSZE NA SAMYM DOLE ===
          let eanY = y + boxHeight - 50;
          if (showEan && p.ean && p.barcode) {
            try {
              const bw = 140, bh = 40;
              const bx = x + (boxWidth - bw) / 2;
              const by = eanY;
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
            } catch (e) { console.error('Błąd EAN:', e); }
          }
        
          // === FLAGA – TYLKO DLA UKŁADU 4 (2x2) ===
          if (layout === "4" && p.flagImg) {
            try {
              const flagWidth = 150;
              const flagHeight = 100;
              const flagX = x + (boxWidth - flagWidth) / 2 + 8;  // +8 pt = ok. 3 mm w prawo
              let flagY;

              if (hasEan) {
                // Jeśli jest EAN → flaga nad EAN
                flagY = eanY - flagHeight - 5;
              } else {
                // Jeśli nie ma EAN → flaga pod ceną
                flagY = textY + 10;
              }

              doc.addImage(p.flagImg, "PNG", flagX, flagY, flagWidth, flagHeight, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania flagi:', e);
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

  // === NOWA FUNKCJA DLA 4-2-4 (GÓRNE I DOLNE 4) – BEZ FLAGI ===
  const drawSectionSmall = async (sectionCols, sectionRows, boxWidth, boxHeight) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
        const p = products[productIndex];
        const edit = productEdits[productIndex] || {};
        const pageEdit = pageEdits[Math.floor(productIndex / itemsPerPage)] || {
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
          try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: finalEdit.backgroundOpacity || 1.0 }));
            doc.addImage(finalEdit.backgroundTexture, finalEdit.backgroundTexture.includes('image/png') ? "PNG" : "JPEG", x, y, boxWidth, boxHeight);
            doc.restoreGraphicsState();
          } catch (e) { console.error('Błąd tekstury:', e); }
        }

        drawBox(doc, x, y, boxWidth, boxHeight, finalEdit.borderStyle || 'solid', finalEdit.borderColor || '#000000');

        let imgSrc = uploadedImages[p.indeks] || p.img;
        const hasEan = showEan && p.ean && p.barcode;

        const imgMaxW = 80, imgMaxH = 60;
        const textAreaX = x + 90;
        let currentY = y + 16;

        if (imgSrc) {
          try {
            const img = new Image(); img.src = imgSrc;
            await Promise.race([
              new Promise((res, rej) => { img.onload = res; img.onerror = rej; }),
              new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 5000))
            ]);
            const scale = Math.min(imgMaxW / img.width, imgMaxH / img.height);
            const w = img.width * scale, h = img.height * scale;
            const imgX = x + 6, imgY = y + (boxHeight - h) / 2;
            doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
          } catch (e) { console.error('Błąd obrazka:', e); }
        }

        doc.setFont(finalEdit.nazwaFont || 'Arial', "bold");
        doc.setFontSize(7);
        doc.setTextColor(...hexToRgb(finalEdit.nazwaFontColor || '#000000'));
        const nazwaLines = doc.splitTextToSize(p.nazwa || "Brak nazwy", boxWidth - 100);
        const maxY = y + boxHeight - 50;
        nazwaLines.forEach(line => {
          if (currentY <= maxY) {
            doc.text(line, textAreaX, currentY);
            currentY += 8;
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

        // === CENA – WIĘCEJ ODSTĘPU OD INDEKSU ===
        if (showCena && p.cena) {
          doc.setFont(finalEdit.cenaFont || 'Arial', "bold");
          doc.setFontSize(10);
          doc.setTextColor(...hexToRgb(finalEdit.cenaFontColor || '#000000'));
          const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
          const currencyPosition = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? 'right' : 'left';
          const showLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
          const labelText = globalLanguage === 'en' ? 'PRICE' : 'CENA';
          const priceText = showLabel 
            ? `${labelText}: ${p.cena} ${currencySymbol}` 
            : `${p.cena} ${currencySymbol}`;
          
          // PRZESUŃ CENĘ 3 pt NIŻEJ
          const priceY = currentY + 3;  // BYŁO: currentY → TERAZ +3
          doc.text(priceText, textAreaX, priceY);
          currentY += 15; // WIĘCEJ ODSTĘPU NA EAN
        }

        if (hasEan) {
          try {
            const bw = 80, bh = 28;
            const bx = x + boxWidth - bw - 6;
            const by = y + boxHeight - bh - 5;
            doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
          } catch (e) { console.error('Błąd EAN:', e); }
        }
        // Usunięto blok z flagą – nie chcemy flagi w 4-2-4
        
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

  // === GŁÓWNA PĘTLA ===
  while (productIndex < products.length) {
    let cols, rows, boxWidth, boxHeight, isLarge;

    if (layout === "1") {
      cols = 1; rows = 1;
      boxWidth = pageWidth - marginLeftRight * 2;
      boxHeight = pageHeight - marginTop - marginBottom;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "2") {
      cols = 2; rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = pageHeight - marginTop - marginBottom;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "4") {
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    } else if (layout === "8") {
      cols = 2; rows = 4;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      y = await drawSection8(cols, rows, boxWidth, boxHeight);
    } else if (layout === "16") {
      cols = 2; rows = 8;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = (pageHeight - marginTop - marginBottom - (rows - 1) * 6) / rows;
      y = await drawSection16(cols, rows, boxWidth, boxHeight);
    } else if (layout === "4-2-4") {
      // GÓRNE 4 (2x2) – mały układ
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSectionSmall(cols, rows, boxWidth, boxHeight); // nowa funkcja
    
      // ŚRODKOWE 2 (2x1) – duży układ
      cols = 2; rows = 1;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.4 - (rows - 1) * 6) / rows;
      isLarge = true;
      y = await drawSection(cols, rows, boxWidth, boxHeight, isLarge);
    
      // DOLNE 4 (2x2) – mały układ
      cols = 2; rows = 2;
      boxWidth = (pageWidth - marginLeftRight * 2 - (cols - 1) * 6) / cols;
      boxHeight = ((pageHeight - marginTop - marginBottom) * 0.3 - (rows - 1) * 6) / rows;
      isLarge = false;
      y = await drawSectionSmall(cols, rows, boxWidth, boxHeight); // ta sama funkcja
    }

    if (productIndex < products.length) {
      doc.addPage();
      pageNumber++;
      const pageEdit = pageEdits[pageNumber - 1] || {};
      if (pageEdit.pageBackgroundGradient && pageEdit.pageBackgroundGradient !== "none") {
        try {
          applyGradient(pageEdit.pageBackgroundGradient, pageEdit.pageBackgroundOpacity);
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
  if (save) {
    try {
      doc.save("katalog.pdf");
    } catch (e) {
      console.error('Błąd zapisywania PDF:', e);
      document.getElementById('debug').innerText = "Błąd zapisywania PDF";
    }
  }
  return doc;
}

async function generatePDF() {
  try {
    const { jsPDF } = window.jspdf;
    await buildPDF(jsPDF, true);
  } catch (e) {
    console.error('Błąd generowania PDF:', e);
    document.getElementById('debug').innerText = "Błąd generowania PDF";
    hideProgressModal();
  }
}

async function previewPDF() {
  try {
    showProgressModal();
    const { jsPDF } = window.jspdf;
    const doc = await buildPDF(jsPDF, false);
    const blobUrl = doc.output("bloburl");
    const pdfIframe = document.getElementById("pdfIframe");
    pdfIframe.src = "";
    pdfIframe.src = blobUrl;
    document.getElementById("pdfPreview").style.display = "block";
    hideProgressModal();
  } catch (e) {
    console.error('Błąd generowania podglądu PDF:', e);
    document.getElementById('debug').innerText = "Błąd generowania podglądu PDF";
    hideProgressModal();
  }
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
    backgroundOpacity: 1.0,
    pageBackgroundGradient: 'none',
    pageBackgroundOpacity: 1.0
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
    <button onclick="savePageEdit(${pageIndex})" class="btn-primary">Zapisz</button>
  `;
  document.getElementById('editModal').style.display = 'block';
}

function savePageEdit(pageIndex) {
  try {
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
  } catch (e) {
    console.error('Błąd zapisywania edycji strony:', e);
    document.getElementById('debug').innerText = "Błąd zapisywania edycji strony";
  }
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

  // Tło (tekstura)
  if (edit.backgroundTexture) {
    try {
      fabric.Image.fromURL(edit.backgroundTexture, (bgImg) => {
        bgImg.scaleToWidth(800);
        bgImg.set({ opacity: edit.backgroundOpacity || 1.0 });
        canvas.setBackgroundImage(bgImg, canvas.renderAll.bind(canvas));
      }, { crossOrigin: 'anonymous' });
    } catch (e) {
      console.error('Błąd ładowania tekstury tła w podglądzie:', e);
      document.getElementById('debug').innerText = "Błąd ładowania tekstury tła w podglądzie";
    }
  }

  // Obraz produktu
  try {
    fabric.Image.fromURL(uploadedImages[product.indeks] || product.img, (img) => {
      img.scaleToWidth(300);
      canvas.add(img);
    }, { crossOrigin: 'anonymous' });
  } catch (e) {
    console.error('Błąd ładowania obrazu produktu w podglądzie:', e);
    document.getElementById('debug').innerText = "Błąd ładowania obrazu produktu w podglądzie";
  }

  // Obramowanie
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

  // Teksty
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

  let rankingText, cenaText;
  if (showRanking && product.ranking) {
    rankingText = new fabric.Text(`RANKING: ${product.ranking}`, {
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
    const priceLabel = globalLanguage === 'en' ? 'PRICE' : 'CENA';
    const currencySymbol = (edit.priceCurrency || globalCurrency) === 'EUR' ? 'EUR' : 'GBP';
    const priceText = (edit.priceCurrency || globalCurrency) === 'GBP'
      ? `${priceLabel}: ${currencySymbol} ${product.cena}`
      : `${priceLabel}: ${product.cena} ${currencySymbol}`;
    cenaText = new fabric.Text(priceText, {
      left: 320,
      top: 80,
      fontSize: edit.priceFontSize === 'small' ? 16 : edit.priceFontSize === 'medium' ? 20 : 24,
      fill: edit.cenaFontColor,
      fontFamily: edit.cenaFont,
      selectable: true
    });
    canvas.add(cenaText);
  }

  // Kod kreskowy
  if (showEan && product.ean && product.barcode) {
    try {
      fabric.Image.fromURL(product.barcode, (barcodeImg) => {
        barcodeImg.scaleToWidth(100);
        barcodeImg.set({ left: 320, top: 100, selectable: true });
        canvas.add(barcodeImg);
      }, { crossOrigin: 'anonymous' });
    } catch (e) {
      console.error('Błąd ładowania kodu kreskowego w podglądzie:', e);
      document.getElementById('debug').innerText = "Błąd ładowania kodu kreskowego w podglądzie";
    }
  }

  // Edycja po zaznaczeniu
  canvas.on('object:selected', (e) => {
    const obj = e.target;
    document.getElementById('editPanel').style.display = 'block';
    document.getElementById('fontSelect').value = obj.fontFamily || 'Arial';
    document.getElementById('colorSelect').value = obj.fill || '#000000';
    document.getElementById('sizeSelect').value = obj.fontSize === 16 ? 'small' : obj.fontSize === 20 ? 'medium' : 'large';
    document.getElementById('borderStyleSelect').value = edit.borderStyle || 'solid';
    document.getElementById('borderColorSelect').value = edit.borderColor || '#000000';
    document.getElementById('backgroundOpacitySelect').value = edit.backgroundOpacity || 1.0;

    window.applyTextEdit = function () {
      try {
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
            }, { crossOrigin: 'anonymous' });
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
      } catch (e) {
        console.error('Błąd stosowania edycji tekstu:', e);
        document.getElementById('debug').innerText = "Błąd stosowania edycji tekstu";
      }
    };
  });

  canvas.on('object:moving', (e) => {
    const obj = e.target;
    console.log('Przesunięto:', obj.left, obj.top);
  });

  // Zapis edycji
  document.getElementById('saveVirtualEdit').onclick = () => {
    try {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        productEdits[productIndex] = {
          ...productEdits[productIndex],
          nazwaFont: activeObject === nazwaText ? activeObject.fontFamily : edit.nazwaFont,
          nazwaFontColor: activeObject === nazwaText ? activeObject.fill : edit.nazwaFontColor,
          indeksFont: activeObject === indeksText ? activeObject.fontFamily : edit.indeksFont,
          indeksFontColor: activeObject === indeksText ? activeObject.fill : edit.indeksFontColor,
          rankingFont: rankingText && activeObject === rankingText ? activeObject.fontFamily : edit.rankingFont,
          rankingFontColor: rankingText && activeObject === rankingText ? activeObject.fill : edit.rankingFontColor,
          cenaFont: cenaText && activeObject === cenaText ? activeObject.fontFamily : edit.cenaFont,
          cenaFontColor: cenaText && activeObject === cenaText ? activeObject.fill : edit.cenaFontColor,
          priceFontSize: (activeObject === nazwaText || activeObject === cenaText)
            ? (activeObject.fontSize === 16 ? 'small' : activeObject.fontSize === 20 ? 'medium' : 'large')
            : edit.priceFontSize,
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
    } catch (e) {
      console.error('Błąd zapisywania wirtualnej edycji:', e);
      document.getElementById('debug').innerText = "Błąd zapisywania wirtualnej edycji";
    }
  };
}

function hideEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('virtualEditModal').style.display = 'none';
}

// Eksport funkcji do globalnego zakresu
window.importExcel = importExcel;
window.generatePDF = generatePDF;
window.previewPDF = previewPDF;
window.showEditModal = showEditModal;
window.showVirtualEditModal = showVirtualEditModal;
window.hideEditModal = hideEditModal;
window.showPageEditModal = showPageEditModal;
window.savePageEdit = savePageEdit;

// Uruchomienie po załadowaniu strony
loadProducts();

// Konwersja hex → RGB
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
