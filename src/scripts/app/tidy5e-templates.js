/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 
export const preloadTidy5eHandlebarsTemplates = async function() {

  // Define template paths to load
  const tidy5etemplatePaths = [

    // Actor Sheet Partials
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-traits.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-inventory.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-inventory-grid.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-inventory-header.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-inventory-footer.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-features.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-force-powerbook.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-force-powerbook-grid.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-force-powerbook-header.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-force-powerbook-footer.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-tech-powerbook.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-tech-powerbook-grid.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-tech-powerbook-header.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-tech-powerbook-footer.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-effects.html"
  ];

  // Load the template parts
  return loadTemplates(tidy5etemplatePaths);
};
