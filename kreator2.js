let products = [];
let jsonProducts = [];
let selectedBanner = null;
let selectedCover = null;
let selectedBackground = null;
let uploadedImages = {};
let productEdits = {};
let pageEdits = {};
let globalCurrency = 'EUR';
let globalLanguage = 'pl';
let manufacturerLogos = {};

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

async function loadManufacturerLogos() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/MasterMM2025/kreator-katalog/main/Producenci.json");
    if (!response.ok) throw new Error(`Nie udało się załadować Producenci.json: ${response.status}`);
    const jsonData = await response.json();
    for (const manufacturer of jsonData) {
      const name = manufacturer.NAZWA_PROD.trim();
      const urls = [
        `https://raw.githubusercontent.com/MasterMM2025/kreator-katalog/main/zdjecia/${name}.jpg`,
        `https://raw.githubusercontent.com/MasterMM2025/kreator-katalog/main/zdjecia/${name}.png`
      ];
      let base64Logo = null;
      for (const url of urls) {
        base64Logo = await toBase64(url);
        if (base64Logo) break;
      }
      if (base64Logo) {
        manufacturerLogos[name] = base64Logo;
      }
    }
    console.log("Załadowano loga producentów:", Object.keys(manufacturerLogos).length);
  } catch (error) {
    console.error("Błąd ładowania logów producentów:", error);
    document.getElementById('debug').innerText = "Błąd ładowania logów producentów: " + error.message;
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
        img: base64Img,
        producent: p.NAZWA_PROD || ''
      };
    }));
    console.log("Załadowano jsonProducts:", jsonProducts.length);
    await loadManufacturerLogos();
  } catch (error) {
    document.getElementById('debug').innerText = "Błąd ładowania JSON: " + error.message;
    console.error("Błąd loadProducts:", error);
  }
}

function handleFiles(files, callback) {
  if (!files || files.length === 0) {
    console.error("Brak plików do załadowania");
    document.getElementById('debug').innerText = "Brak zdjęć do załadowania";
    return;
  }
  [...files].forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(file, e.target.result);
      document.getElementById('debug').innerText = `Załadowano plik: ${file.name}`;
    };
    reader.onerror = () => {
      console.error(`Błąd ładowania pliku: ${file.name}`);
      document.getElementById('debug').innerText = `Błąd ładowania pliku: ${file.name}`;
    };
    reader.readAsDataURL(file);
  });
}

function loadCustomBanner(file, data) {
  selectedBanner = { id: "custom", data };
  console.log("Załadowano baner:", file.name);
}

function loadCustomBackground(file, data) {
  selectedBackground = { id: "customBackground", data };
  console.log("Załadowano tło:", file.name);
}

function loadCustomCover(file, data) {
  selectedCover = { id: "customCover", data };
  console.log("Załadowano okładkę:", file.name);
}

function loadCustomImages(file, data) {
  const fileName = file.name.split('.')[0];
  uploadedImages[fileName] = data;
  console.log(`Załadowano obraz dla indeksu: ${fileName}`);
  renderCatalog();
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
    logo: null
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
    logo: productEdits[productIndex]?.logo || null
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
    showPriceLabel: true
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
    showPriceLabel: document.querySelector('input[name="priceFormat"]:checked').value === 'true'
  };
  console.log('Saved Page Edit for Page Index:', newPageIndex, pageEdits[newPageIndex]);
  renderCatalog();
  hideEditModal();
}

document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("imageInput");
  const uploadArea = document.getElementById("uploadArea");
  if (imageInput && uploadArea) {
    imageInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        console.log("Zmiana w imageInput, pliki:", e.target.files.length);
        handleFiles(e.target.files, loadCustomImages);
      }
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
      if (e.dataTransfer.files.length > 0) {
        console.log("Drop zdjęć:", e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files, loadCustomImages);
      }
    });
    uploadArea.querySelector('.file-label').addEventListener("click", (e) => {
      e.preventDefault();
      imageInput.click();
    });
  } else {
    console.error("Nie znaleziono elementów: imageInput lub uploadArea");
    document.getElementById('debug').innerText = "Błąd: Brak elementów do obsługi zdjęć";
  }
  const bannerFileInput = document.getElementById("bannerFileInput");
  const bannerUpload = document.getElementById("bannerUpload");
  if (bannerFileInput && bannerUpload) {
    bannerFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        console.log("Zmiana w bannerFileInput, pliki:", e.target.files.length);
        handleFiles(e.target.files, loadCustomBanner);
      }
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
      if (e.dataTransfer.files.length > 0) {
        console.log("Drop banera:", e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files, loadCustomBanner);
      }
    });
    bannerUpload.querySelector('.file-label').addEventListener("click", (e) => {
      e.preventDefault();
      bannerFileInput.click();
    });
  } else {
    console.error("Nie znaleziono elementów: bannerFileInput lub bannerUpload");
    document.getElementById('debug').innerText = "Błąd: Brak elementów do obsługi banera";
  }
  const backgroundFileInput = document.getElementById("backgroundFileInput");
  const backgroundUpload = document.getElementById("backgroundUpload");
  if (backgroundFileInput && backgroundUpload) {
    backgroundFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        console.log("Zmiana w backgroundFileInput, pliki:", e.target.files.length);
        handleFiles(e.target.files, loadCustomBackground);
      }
    });
    backgroundUpload.addEventListener("dragover", (e) => {
      e.preventDefault();
      backgroundUpload.classList.add("dragover");
    });
    backgroundUpload.addEventListener("dragleave", () => {
      backgroundUpload.classList.remove("dragover");
    });
    backgroundUpload.addEventListener("drop", (e) => {
      e.preventDefault();
      backgroundUpload.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        console.log("Drop tła:", e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files, loadCustomBackground);
      }
    });
    backgroundUpload.querySelector('.file-label').addEventListener("click", (e) => {
      e.preventDefault();
      backgroundFileInput.click();
    });
  } else {
    console.error("Nie znaleziono elementów: backgroundFileInput lub backgroundUpload");
    document.getElementById('debug').innerText = "Błąd: Brak elementów do obsługi tła";
  }
  const coverFileInput = document.getElementById("coverFileInput");
  const coverUpload = document.getElementById("coverUpload");
  if (coverFileInput && coverUpload) {
    coverFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        console.log("Zmiana w coverFileInput, pliki:", e.target.files.length);
        handleFiles(e.target.files, loadCustomCover);
      }
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
      if (e.dataTransfer.files.length > 0) {
        console.log("Drop okładki:", e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files, loadCustomCover);
      }
    });
    coverUpload.querySelector('.file-label').addEventListener("click", (e) => {
      e.preventDefault();
      coverFileInput.click();
    });
  } else {
    console.error("Nie znaleziono elementów: coverFileInput lub coverUpload");
    document.getElementById('debug').innerText = "Błąd: Brak elementów do obsługi okładki";
  }
  const excelFileInput = document.getElementById("excelFile");
  const fileLabelWrapper = document.querySelector(".file-label-wrapper");
  if (excelFileInput && fileLabelWrapper) {
    excelFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        console.log("Zmiana w excelFileInput, plik:", e.target.files[0].name);
        importExcel();
      }
    });
    fileLabelWrapper.addEventListener("click", (e) => {
      e.preventDefault();
      excelFileInput.click();
    });
  } else {
    console.error("Nie znaleziono elementów: excelFileInput lub fileLabelWrapper");
    document.getElementById('debug').innerText = "Błąd: Brak elementów do obsługi importu Excel";
  }
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      globalCurrency = e.target.value;
      console.log("Zmieniono walutę na:", globalCurrency);
      renderCatalog();
    });
  }
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      globalLanguage = e.target.value;
      console.log("Zmieniono język na:", globalLanguage);
      renderCatalog();
    });
  }
  const pageEditButton = document.createElement('button');
  pageEditButton.className = 'btn-secondary';
  pageEditButton.innerHTML = '<i class="fas fa-file-alt"></i> Edytuj stronę PDF';
  pageEditButton.onclick = () => showPageEditModal(0);
  document.querySelector('.improved-panel').appendChild(pageEditButton);
}

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
  const layout = document.getElementById('layoutSelect')?.value || "16";
  const showCena = document.getElementById('showCena')?.checked || false;
  const showLogo = document.getElementById('showLogo')?.checked || false;
  const priceLabel = globalLanguage === 'en' ? 'Price' : 'Cena';
  let itemsPerPage;
  if (layout === "1") itemsPerPage = 1;
  else if (layout === "2") itemsPerPage = 2;
  else if (layout === "4") itemsPerPage = 4;
  else if (layout === "8") itemsPerPage = 8;
  else if (layout === "16") itemsPerPage = 16;
  else if (layout === "4-2-4") itemsPerPage = 10;
  let pageDiv;
  let currentPage = 0;
  products.forEach((p, i) => {
    if (i % itemsPerPage === 0) {
      pageDiv = document.createElement("div");
      pageDiv.className = "page";
      pageDiv.setAttribute("data-page", currentPage);
      currentPage++;
      container.appendChild(pageDiv);
    }
    const item = document.createElement("div");
    item.className = layout === "1" || layout === "2" ? "item item-large" : "item";
    const img = document.createElement('img');
    img.src = uploadedImages[p.indeks] || p.img || "https://dummyimage.com/120x84/eee/000&text=brak";
    const details = document.createElement('div');
    details.className = "details";
    const edit = productEdits[i] || {};
    const pageEdit = pageEdits[Math.floor(i / itemsPerPage)] || {};
    const finalEdit = { ...pageEdit, ...edit };
    details.innerHTML = `<b style="font-family: ${finalEdit.nazwaFont || 'Arial'}; color: ${finalEdit.nazwaFontColor || '#000000'}">${p.nazwa || 'Brak nazwy'}</b><br>` +
                       `<span style="font-family: ${finalEdit.indeksFont || 'Arial'}; color: ${finalEdit.indeksFontColor || '#000000'}">Indeks: ${p.indeks || 'Brak indeksu'}</span>`;
    if (showCena && p.cena) {
      const currency = finalEdit.priceCurrency || globalCurrency;
      const currencySymbol = currency === 'EUR' ? '€' : '£';
      const showPriceLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
      details.innerHTML += `<br><span style="font-family: ${finalEdit.cenaFont || 'Arial'}; color: ${finalEdit.cenaFontColor || '#000000'}; font-size: ${finalEdit.priceFontSize || 'medium'}">${showPriceLabel ? `${priceLabel}: ` : ''}${currencySymbol} ${p.cena}</span>`;
    }
    if (showLogo && layout === "4" && (finalEdit.logo || (p.producent && manufacturerLogos[p.producent]))) {
      const logoImg = document.createElement('img');
      logoImg.src = finalEdit.logo || manufacturerLogos[p.producent];
      logoImg.style.width = '120px';
      logoImg.style.height = '60px';
      logoImg.style.objectFit = 'contain';
      logoImg.style.marginTop = '8px';
      details.appendChild(logoImg);
    }
    const editButton = document.createElement('button');
    editButton.className = 'btn-primary edit-button';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Edytuj';
    editButton.onclick = () => showEditModal(i);
    item.appendChild(img);
    item.appendChild(details);
    item.appendChild(editButton);
    pageDiv.appendChild(item);
  });
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
          if (['index', 'indeks'].some(h => header.includes(h))) obj['indeks'] = value || '';
          if (['ean', 'kod ean', 'barcode'].some(h => header.includes(h))) obj['ean'] = value || '';
          if (['rank', 'ranking'].some(h => header.includes(h))) obj['ranking'] = value || '';
          if (['cen', 'cena', 'price', 'netto'].some(h => header.includes(h))) obj['cena'] = value || '';
          if (['nazwa', 'name'].some(h => header.includes(h))) obj['nazwa'] = value || '';
          if (['logo', 'nazwa_prod', 'producent', 'manufacturer'].some(h => header.includes(h))) obj['producent'] = value || '';
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
          if (['index', 'indeks'].some(h => header.includes(h))) obj['indeks'] = row[i] || '';
          if (['ean', 'kod ean', 'barcode'].some(h => header.includes(h))) obj['ean'] = row[i] || '';
          if (['rank', 'ranking'].some(h => header.includes(h))) obj['ranking'] = row[i] || '';
          if (['cen', 'cena', 'price', 'netto'].some(h => header.includes(h))) obj['cena'] = row[i] || '';
          if (['nazwa', 'name'].some(h => header.includes(h))) obj['nazwa'] = row[i] || '';
          if (['logo', 'nazwa_prod', 'producent', 'manufacturer'].some(h => header.includes(h))) obj['producent'] = row[i] || '';
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
        let barcodeImg = null;
        if (row['ean'] && /^\d{12,13}$/.test(row['ean'])) {
          try {
            const barcodeCanvas = document.createElement('canvas');
            JsBarcode(barcodeCanvas, row['ean'], {
              format: "EAN13",
              width: 1.6,
              height: 32,
              displayValue: true,
              fontSize: 9,
              margin: 0
            });
            barcodeImg = barcodeCanvas.toDataURL("image/png", 0.8);
          } catch (e) {
            console.error('Błąd generowania kodu kreskowego:', e);
          }
        }
        newProducts.push({
          nazwa: row['nazwa'] || (matched ? matched.nazwa : ''),
          ean: row['ean'] || (matched ? matched.ean : ''),
          ranking: row['ranking'] || (matched ? matched.ranking : ''),
          cena: row['cena'] || (matched ? matched.cena : ''),
          indeks: indeks.toString(),
          img: uploadedImages[indeks.toString()] || (matched ? matched.img : null),
          barcode: barcodeImg,
          producent: row['producent'] || (matched ? matched.producent : '')
        });
      }
    });
    console.log("Nowe produkty:", newProducts);
    if (newProducts.length) {
      products = newProducts;
      productEdits = {};
      pageEdits = {};
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
      doc.setFillColor(240, 248, 255); // AliceBlue
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(0, 105, 192); // DeepSkyBlue
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "green") {
      doc.setFillColor(245, 255, 245); // Honeydew
      doc.rect(0, 0, pageWidth, pageHeight * 0.6, 'F');
      doc.setFillColor(46, 139, 87); // SeaGreen
      doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
    } else if (gradientType === "gray") {
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
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
              document.getElementById('debug').innerText = "Błąd dodawania obrazka";
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
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${currencySymbol} ${p.cena}`, x + boxWidth / 2, textY, { align: "center" });
            textY += sectionCols === 1 ? 22 : 18;
          }
          if (showLogo && layout === "4" && logoSrc) {
            try {
              const logoImg = new Image();
              logoImg.src = logoSrc;
              await Promise.race([
                new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout ładowania loga')), 5000))
              ]);
              const logoW = 120;
              const logoH = 60;
              const logoX = x + (boxWidth - logoW) / 2;
              const logoY = textY;
              doc.addImage(logoSrc, logoSrc.includes('image/png') ? "PNG" : "JPEG", logoX, logoY, logoW, logoH, undefined, save ? "SLOW" : "FAST");
              textY += logoH + 5;
            } catch (e) {
              console.error('Błąd dodawania loga:', e);
              document.getElementById('debug').innerText = "Błąd dodawania loga";
            }
          }
          if (showEan && p.ean && p.barcode) {
            try {
              const bw = sectionCols === 1 ? 180 : 140;
              const bh = sectionCols === 1 ? 50 : 40;
              const bx = x + (boxWidth - bw) / 2;
              const by = y + boxHeight - bh - 5;
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
              doc.addImage(imgSrc, imgSrc.includes('image/png') ? "PNG" : "JPEG", imgX, imgY, w, h, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania obrazka:', e);
              document.getElementById('debug').innerText = "Błąd dodawania obrazka";
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
            doc.text(`${showPriceLabel ? `${priceLabel}: ` : ''}${currencySymbol} ${p.cena}`, x + 105, textY, { maxWidth: 150 });
            textY += 16;
          }
          if (showEan && p.ean && p.barcode) {
            try {
              const bw = 85;
              const bh = 32;
              const bx = x + boxWidth - bw - 10;
              const by = y + boxHeight - bh - 5;
              doc.addImage(p.barcode, "PNG", bx, by, bw, bh, undefined, save ? "SLOW" : "FAST");
            } catch (e) {
              console.error('Błąd dodawania kodu kreskowego:', e);
              document.getElementById('debug').innerText = "Błąd dodawania kodu kreskowego";
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
  try {
    fabric.Image.fromURL(uploadedImages[product.indeks] || product.img, (img) => {
      img.scaleToWidth(300);
      canvas.add(img);
    }, { crossOrigin: 'anonymous' });
  } catch (e) {
    console.error('Błąd ładowania obrazu produktu w podglądzie:', e);
    document.getElementById('debug').innerText = "Błąd ładowania obrazu produktu w podglądzie";
  }
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
    document.getElementById('editPanel').style.display = 'block';
    document.getElementById('fontSelect').value = obj.fontFamily || 'Arial';
    document.getElementById('colorSelect').value = obj.fill || '#000000';
    document.getElementById('sizeSelect').value = obj.fontSize === 16 ? 'small' : obj.fontSize === 20 ? 'medium' : 'large';
    document.getElementById('borderStyleSelect').value = edit.borderStyle || 'solid';
    document.getElementById('borderColorSelect').value = edit.borderColor || '#000000';
    document.getElementById('backgroundOpacitySelect').value = edit.backgroundOpacity || 1.0;
    window.applyTextEdit = function() {
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
