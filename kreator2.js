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
@@ -35,6 +38,7 @@
  let pageNumber = 1;
  let totalProducts = products.length;
  let processedProducts = 0;

  if (selectedCover) {
    try {
      doc.addImage(selectedCover.data, selectedCover.data.includes('image/png') ? "PNG" : "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
@@ -46,30 +50,48 @@
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
      doc.setFillColor(230, 240, 250);
      doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(49, 130, 206);
      doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(240, 248, 255); // AliceBlue
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(0, 105, 192); // DeepSkyBlue
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "green") {
      doc.setFillColor(230, 255, 230);
      doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(56, 161, 105);
      doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(245, 255, 245); // Honeydew
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(46, 139, 87); // SeaGreen
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "gray") {
      doc.setFillColor(247, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(160, 174, 192);
      doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(245, 245, 245); // WhiteSmoke
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(112, 128, 144); // SlateGray
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "red") {
      doc.setFillColor(255, 240, 240); // LightPink
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(178, 34, 34); // FireBrick
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "purple") {
      doc.setFillColor(245, 240, 255); // Lavender
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(106, 90, 205); // SlateBlue
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "orange") {
      doc.setFillColor(255, 245, 238); // Seashell
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(255, 165, 0); // Orange
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    }
    doc.restoreGraphicsState();
  };

  if (products.length > 0) {
    const pageEdit = pageEdits[pageNumber - 1] || {};
    if (pageEdit.pageBackgroundGradient && pageEdit.pageBackgroundGradient !== "none") {
@@ -99,6 +121,7 @@
    doc.setFontSize(12);
    doc.text(`${pageNumber}`, pageWidth - 20, pageHeight - 10, { align: "right" });
  }

  const marginTop = 20 + bannerHeight;
  const marginBottom = 28;
  const marginLeftRight = 14;
@@ -110,6 +133,7 @@
  let x = marginLeftRight;
  let y = marginTop;
  let productIndex = 0;

  const getItemsPerPage = () => {
    if (layout === "1") return 1;
    if (layout === "2") return 2;
@@ -119,7 +143,9 @@
    if (layout === "4-2-4") return 10;
    return 4;
  };

  const itemsPerPage = getItemsPerPage();

  const drawSection = async (sectionCols, sectionRows, boxWidth, boxHeight, isLarge) => {
    for (let row = 0; row < sectionRows && productIndex < products.length; row++) {
      for (let col = 0; col < sectionCols && productIndex < products.length; col++) {
@@ -145,6 +171,7 @@
        };
        const finalEdit = { ...pageEdit, ...edit };
        console.log('BuildPDF - Product Index:', productIndex, 'Final Edit:', finalEdit);

        if (finalEdit.backgroundTexture) {
          try {
            doc.saveGraphicsState();
@@ -153,27 +180,35 @@
            doc.restoreGraphicsState();
          } catch (e) {
            console.error('Błąd dodawania tekstury tła:', e);
            document.getElementById('debug').innerText = "Błąd dodawania tekstury tła";
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
              await Promise.race([
                new Promise((res, rej) => { img.onload = res; img.onerror = rej; }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout ładowania obrazu')), 5000))
              ]);
              const maxW = boxWidth - (sectionCols === 1 ? 80 : 40);
              const maxH = boxHeight * 0.4;
              let scale = Math.min(maxW / img.width, maxH / img.height);
              let w = img.width * scale;
              let h = img.height * scale;
              let imgX = x + (boxWidth - w) / 2;
              let imgY = y + 5;
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h);
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
              document.getElementById('debug').innerText = "Błąd dodawania obrazka";
            }
          }
          let textY = y + 5 + (boxHeight * 0.4) + 10;
@@ -215,15 +250,19 @@
            try {
              const logoImg = new Image();
              logoImg.src = logoSrc;
              await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; });
              await Promise.race([
                new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout ładowania loga')), 5000))
              ]);
              const logoW = 120;
              const logoH = 60;
              const logoX = x + (boxWidth - logoW) / 2;
              const logoY = textY;
              doc.addImage(logoSrc, logoSrc.includes('image/png') ? "PNG" : "JPEG", logoX, logoY, logoW, logoH, undefined, 'SLOW');
              doc.addImage(logoSrc, logoSrc.includes('image/png') ? "PNG" : "JPEG", logoX, logoY, logoW, logoH, undefined, save ? "SLOW" : "FAST");
              textY += logoH + 5;
            } catch (e) {
              console.error('Błąd dodawania loga:', e);
              document.getElementById('debug').innerText = "Błąd dodawania loga";
            }
          }
          if (showEan && p.ean && p.barcode) {
@@ -232,27 +271,32 @@
              const bh = sectionCols === 1 ? 50 : 40;
              const bx = x + (boxWidth - bw) / 2;
              const by = y + boxHeight - bh - 5;
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh);
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania kodu kreskowego:', e);
              document.getElementById('debug').innerText = "Błąd dodawania kodu kreskowego";
            }
          }
        } else {
          if (imgSrc) {
            try {
              const img = new Image();
              img.src = imgSrc;
              await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
              await Promise.race([
                new Promise((res, rej) => { img.onload = res; img.onerror = rej; }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout ładowania obrazu')), 5000))
              ]);
              const maxW = 90;
              const maxH = 60;
              let scale = Math.min(maxW / img.width, maxH / img.height);
              let w = img.width * scale;
              let h = img.height * scale;
              let imgX = x + 5 + (maxW - w) / 2;
              let imgY = y + 8 + (maxH - h) / 2;
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h);
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
              document.getElementById('debug').innerText = "Błąd dodawania obrazka";
            }
          }
          let textY = y + 20;
@@ -283,7 +327,7 @@
            doc.setTextColor(parseInt(cenaFontColor.substring(1, 3), 16), parseInt(cenaFontColor.substring(3, 5), 16), parseInt(cenaFontColor.substring(5, 7), 16));
            const currencySymbol = (finalEdit.priceCurrency || globalCurrency) === 'EUR' ? '€' : '£';
            const showPriceLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${p.cena} ${currencySymbol}`, x + 105, textY, { maxWidth: 150});
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${p.cena} ${currencySymbol}`, x + 105, textY, { maxWidth: 150 });
            textY += 16;
          }
          if (showEan && p.ean && p.barcode) {
@@ -292,9 +336,10 @@
              const bh = 32;
              const bx = x + boxWidth - bw - 10;
              const by = y + boxHeight - bh - 5;
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh);
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania kodu kreskowego:', e);
              document.getElementById('debug').innerText = "Błąd dodawania kodu kreskowego";
            }
          }
        }
@@ -310,6 +355,7 @@
    }
    return y;
  };

  while (productIndex < products.length) {
    let cols, rows, boxWidth, boxHeight, isLarge;
    if (layout === "1") {
@@ -402,22 +448,48 @@
      y = marginTop;
    }
  }

  hideProgressModal();
  if (save) doc.save("katalog.pdf");
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
  const { jsPDF } = window.jspdf;
  await buildPDF(jsPDF, true);
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
  showProgressModal();
  const { jsPDF } = window.jspdf;
  const doc = await buildPDF(jsPDF, false);
  const blobUrl = doc.output("bloburl");
  document.getElementById("pdfIframe").src = blobUrl;
  document.getElementById("pdfPreview").style.display = "block";
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
@@ -435,7 +507,9 @@
    borderStyle: 'solid',
    borderColor: '#000000',
    backgroundTexture: null,
    backgroundOpacity: 1.0
    backgroundOpacity: 1.0,
    pageBackgroundGradient: 'none',
    pageBackgroundOpacity: 1.0
  };
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;
@@ -530,10 +604,25 @@
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
@@ -596,12 +685,15 @@
    borderStyle: document.getElementById('editBorderStyle').value || 'solid',
    borderColor: document.getElementById('editBorderColor').value || '#000000',
    backgroundTexture: productEdits[productIndex]?.backgroundTexture || null,
    backgroundOpacity: parseFloat(document.getElementById('editBackgroundOpacity').value) || 1.0
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
@@ -689,6 +781,9 @@
        <option value="blue" ${edit.pageBackgroundGradient === 'blue' ? 'selected' : ''}>Niebieski</option>
        <option value="green" ${edit.pageBackgroundGradient === 'green' ? 'selected' : ''}>Zielony</option>
        <option value="gray" ${edit.pageBackgroundGradient === 'gray' ? 'selected' : ''}>Szary</option>
        <option value="red" ${edit.pageBackgroundGradient === 'red' ? 'selected' : ''}>Czerwony</option>
        <option value="purple" ${edit.pageBackgroundGradient === 'purple' ? 'selected' : ''}>Fioletowy</option>
        <option value="orange" ${edit.pageBackgroundGradient === 'orange' ? 'selected' : ''}>Pomarańczowy</option>
      </select>
      <label>Przezroczystość tła:</label>
      <input type="range" id="editPageBackgroundOpacity" min="0.1" max="1.0" step="0.1" value="${edit.pageBackgroundOpacity || 1.0}">
@@ -697,26 +792,33 @@
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
@@ -770,16 +872,26 @@
  modal.style.display = 'block';
  const canvas = new fabric.Canvas('virtualEditCanvas');
  if (edit.backgroundTexture) {
    fabric.Image.fromURL(edit.backgroundTexture, (bgImg) => {
      bgImg.scaleToWidth(800);
      bgImg.set({ opacity: edit.backgroundOpacity || 1.0 });
      canvas.setBackgroundImage(bgImg, canvas.renderAll.bind(canvas));
    });
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
  try {
    fabric.Image.fromURL(uploadedImages[product.indeks] || product.img, (img) => {
      img.scaleToWidth(300);
      canvas.add(img);
    }, { crossOrigin: 'anonymous' });
  } catch (e) {
    console.error('Błąd ładowania obrazu produktu w podglądzie:', e);
    document.getElementById('debug').innerText = "Błąd ładowania obrazu produktu w podglądzie";
  }
  fabric.Image.fromURL(uploadedImages[product.indeks] || product.img, (img) => {
    img.scaleToWidth(300);
    canvas.add(img);
  });
  const borderRect = new fabric.Rect({
    left: 0,
    top: 0,
@@ -835,11 +947,16 @@
    canvas.add(cenaText);
  }
  if (showEan && product.ean && product.barcode) {
    fabric.Image.fromURL(product.barcode, (barcodeImg) => {
      barcodeImg.scaleToWidth(100);
      barcodeImg.set({ left: 320, top: 100, selectable: true });
      canvas.add(barcodeImg);
    });
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
  canvas.on('object:selected', (e) => {
    const obj = e.target;
@@ -851,84 +968,96 @@
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
    try {
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
    } catch (e) {
      console.error('Błąd zapisywania wirtualnej edycji:', e);
      document.getElementById('debug').innerText = "Błąd zapisywania wirtualnej edycji";
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
loadProducts();
