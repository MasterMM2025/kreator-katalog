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
    priceFontSize: 'medium'
  };
  const showRanking = document.getElementById('showRanking')?.checked || false;
  const showCena = document.getElementById('showCena')?.checked || false;
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
    <button onclick="saveEdit(${productIndex})" class="btn-primary">Zapisz</button>
  `;
  document.getElementById('editModal').style.display = 'block';
}

function hideEditModal() {
  document.getElementById('editModal').style.display = 'none';
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
    priceFontSize: document.getElementById('editCenaFontSize')?.value || 'medium'
  };
  console.log('Saved Edit for Product Index:', productIndex, productEdits[productIndex]); // Debug
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
  // Oblicz rzeczywistą liczbę stron na podstawie układu
  const layout = document.getElementById('layoutSelect').value || "16";
  let itemsPerPage;
  if (layout === "1") itemsPerPage = 1;
  else if (layout === "2") itemsPerPage = 2;
  else if (layout === "4") itemsPerPage = 4;
  else if (layout === "8") itemsPerPage = 8;
  else if (layout === "16") itemsPerPage = 16;
  else if (layout === "4-2-4") itemsPerPage = 10; // Przybliżona liczba dla 4-2-4 (4+2+4)
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
  console.log('Saved Page Edit for Page Index:', newPageIndex, pageEdits[newPageIndex]); // Debug
  renderCatalog();
  hideEditModal();
}

function hideEditModal() {
  document.getElementById('editModal').style.display = 'none';
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

  // Dodanie przycisku "Edytuj stronę PDF" nad listą produktów
  const panel = document.querySelector('.improved-panel');
  const pageEditButton = document.createElement('button');
  pageEditButton.className = 'btn-secondary';
  pageEditButton.innerHTML = '<i class="fas fa-file-alt"></i> Edytuj stronę PDF';
  pageEditButton.onclick = () => showPageEditModal(0); // Domyślnie pierwsza strona
  panel.appendChild(pageEditButton);
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
  const layout = document.getElementById('layoutSelect')?.value || "16";
  const showCena = document.getElementById('showCena')?.checked || false;
  const priceLabel = globalLanguage === 'en' ? 'Price' : 'Cena';
  let itemsPerPage;
  if (layout === "1") itemsPerPage = 1;
  else if (layout === "2") itemsPerPage = 2;
  else if (layout === "4") itemsPerPage = 4;
  else if (layout === "8") itemsPerPage = 8;
  else if (layout === "16") itemsPerPage = 16;
  else if (layout === "4-2-4") itemsPerPage = 10; // Przybliżona liczba dla 4-2-4 (4+2+4)
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
    details.innerHTML = `<b>${p.nazwa || 'Brak nazwy'}</b><br>Indeks: ${p.indeks || 'Brak indeksu'}`;
    if (showCena && p.cena) {
      const edit = productEdits[i] || {};
      const pageEdit = pageEdits[Math.floor(i / itemsPerPage)] || {};
      const finalEdit = { ...pageEdit, ...edit }; // Priorytet edycji produktu nad edycją strony
      const currency = finalEdit.priceCurrency || globalCurrency;
      const currencySymbol = currency === 'EUR' ? '€' : '£';
      const showPriceLabel = finalEdit.showPriceLabel !== undefined ? finalEdit.showPriceLabel : true;
      console.log('RenderCatalog - Product Index:', i, 'Final Edit:', finalEdit); // Debug
      details.innerHTML += `<br>${showPriceLabel ? `${priceLabel}: ` : ''}${p.cena} ${currencySymbol}`;
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
          barcode: barcodeImg
        });
      }
    });
    console.log("Nowe produkty:", newProducts);
    if (newProducts.length) {
      products = newProducts;
      productEdits = {};
      pageEdits = {}; // Resetowanie edycji stron po imporcie
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
