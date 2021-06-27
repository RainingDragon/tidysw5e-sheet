/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */

export const preloadTidySW5eHandlebarsTemplates = async function () {
  // Define template paths to load
  const tidysw5etemplatePaths = [
    // Actor Sheet Partials
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-traits.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-inventory.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-inventory-grid.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-inventory-header.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-inventory-footer.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-features.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-force-powerbook.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-force-powerbook-grid.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-force-powerbook-header.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-force-powerbook-footer.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-tech-powerbook.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-tech-powerbook-grid.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-tech-powerbook-header.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-tech-powerbook-footer.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-effects.html"
  ];

  // Load the template parts
  return loadTemplates(tidysw5etemplatePaths);
};
