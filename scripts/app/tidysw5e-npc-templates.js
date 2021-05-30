/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */

export const preloadTidySW5eHandlebarsTemplates = async function () {
  // Define template paths to load
  const tidysw5etemplatePaths = [
    // Actor Sheet Partials
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-npc-force-powerbook.html",
    "modules/tidysw5e-sheet/templates/actors/parts/tidysw5e-npc-tech-powerbook.html"
  ];

  // Load the template parts
  return loadTemplates(tidysw5etemplatePaths);
};
