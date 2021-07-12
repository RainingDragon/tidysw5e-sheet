/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */

export const preloadTidy5eHandlebarsTemplates = async function () {
  // Define template paths to load
  const tidy5etemplatePaths = [
    // Actor Sheet Partials
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-npc-force-powerbook.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidy5e-npc-tech-powerbook.html"
  ];

  // Load the template parts
  return loadTemplates(tidy5etemplatePaths);
};
