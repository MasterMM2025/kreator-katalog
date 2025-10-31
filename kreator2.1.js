// === kreator2.1.js ===
// Indywidualne bannery + back cover + STRONY A4 (Z USUWANIEM)

let selectedBackCover = null;
const pageBanners = {};
const pageInserts = {}; // { afterPage: 2, image: { data, format } }

// === IMPORT BACK COVER ===
function importBackCover() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedBackCover = { data: ev.target.result, format: file.type.includes('png') ? 'PNG' : 'JPEG' };
      renderCatalog();
      previewPDF();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// === IMPORT BANNER DLA STRONY ===
function importPageBanner(pageIndex) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      pageBanners[pageIndex] = { data: ev.target.result, format: file.type.includes('png') ? 'PNG' : 'JPEG' };
      renderCatalog();
      previewPDF();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// === IMPORT STRONY A4 (po stronie X) ===
function importInsertPage(afterPage) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      pageInserts[afterPage] = { data: ev.target.result, format: file.type.includes('png') ? 'PNG' : 'JPEG' };
      renderCatalog();
      previewPDF();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// === USUŃ STRONĘ A4 ===
function removeInsertPage(afterPage) {
  if (confirm(`Usunąć stronę A4 po stronie ${afterPage + 1}?`)) {
    delete pageInserts[afterPage];
    renderCatalog();
    previewPDF();
  }
}

// === DODAJ STRONĘ A4 DO PDF ===
function addInsertPage(doc, afterPage, pageWidth, pageHeight) {
  const insert = pageInserts[afterPage];
  if (insert) {
    doc.addPage();
    doc.addImage(insert.data, insert.format, 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }
}

// === DODAJ BANNER DO PDF ===
function addPageBanner(doc, pageIndex, pageWidth, bannerHeight) {
  const banner = pageBanners[pageIndex];
  if (banner) {
    doc.addImage(banner.data, banner.format, 0, 0, pageWidth, bannerHeight, undefined, "FAST");
  }
}

// === DODAJ BACK COVER DO PDF ===
function addBackCover(doc, pageWidth, pageHeight) {
  if (selectedBackCover) {
    doc.addPage();
    doc.addImage(selectedBackCover.data, selectedBackCover.format, 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }
}

// === DODAJ OPCJE DO MODALA (Z USUWANIEM) ===
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

  // === STRONA A4 (Z USUWANIEM) ===
  const insertDiv = document.createElement('div');
  insertDiv.className = 'edit-field';
  insertDiv.dataset.pageEnhance = 'true';

  const insertLabel = document.createElement('label');
  insertLabel.textContent = `Strona A4 po stronie ${pageIndex + 1}:`;
  insertDiv.appendChild(insertLabel);

  const insertButton = document.createElement('button');
  insertButton.type = 'button';
  insertButton.className = 'btn-small';
  insertButton.textContent = pageInserts[pageIndex] ? 'Zmień grafikę' : 'Dodaj grafikę';
  insertButton.onclick = () => importInsertPage(pageIndex);
  insertDiv.appendChild(insertButton);

  if (pageInserts[pageIndex]) {
    const img = document.createElement('img');
    img.src = pageInserts[pageIndex].data;
    img.style = 'max-width:150px; margin-top:5px; display:block;';
    insertDiv.appendChild(img);

    // PRZYCISK USUŃ
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-small btn-danger';
    removeButton.textContent = 'Usuń';
    removeButton.style.marginLeft = '5px';
    removeButton.onclick = () => removeInsertPage(pageIndex);
    insertDiv.appendChild(removeButton);
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

// === OBSERWATOR + ZMIANA STRONY ===
function enhancePageEditModal() {
  const modal = document.getElementById('editModal');
  const select = document.getElementById('editPageSelect');

  if (!modal || !select) return;

  select.addEventListener('change', () => setTimeout(updatePageEnhancements, 50));

  const observer = new MutationObserver(() => {
    if (modal.style.display === 'block') {
      setTimeout(updatePageEnhancements, 50);
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
}

// === PRZELICZANIE STRON ===
function calculateTotalPages() {
  let total = products.length;
  let current = 0;
  let pages = 0;
  while (current < total) {
    const layout = (pageEdits[pages] || {}).layout || "16";
    current += getItemsPerPage(layout);
    pages++;
  }
  return pages;
}

// === INICJALIZACJA ===
document.addEventListener('DOMContentLoaded', () => {
  enhancePageEditModal();

  window.importBackCover = importBackCover;
  window.importPageBanner = importPageBanner;
  window.importInsertPage = importInsertPage;
  window.removeInsertPage = removeInsertPage;
  window.addPageBanner = addPageBanner;
  window.addInsertPage = addInsertPage;
  window.addBackCover = addBackCover;
  window.pageBanners = pageBanners;
  window.pageInserts = pageInserts;
  window.selectedBackCover = selectedBackCover;
  window.calculateTotalPages = calculateTotalPages;
});