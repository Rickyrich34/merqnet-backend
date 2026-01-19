// MerqNet/utils/normalize.js
function normalize(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")                // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9\s]/g, " ")    // elimina signos raros
    .replace(/\s+/g, " ")            // colapsa espacios
    .trim();
}

module.exports = { normalize };
