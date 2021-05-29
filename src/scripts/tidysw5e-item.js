import ItemSheet5e from "../../../systems/sw5e/module/item/sheet.js";

export class TidySW5eItemSheet extends ItemSheet5e {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["tidysw5e", "sw5ebak", "sheet", "item"]
    });
  }
}

async function addEditorHeadline(app, html, data) {
  html
    .find(".tab[data-tab=description] .editor")
    .prepend(`<h2 class="details-headline">${game.i18n.localize("TIDYSW5E.ItemDetailsHeadline")}</h2>`);
}

// Register TidySW5e Item Sheet and make default
Items.registerSheet("sw5e", TidySW5eItemSheet, { makeDefault: true });

Hooks.once("ready", () => {
  // can be removed when 0.7.x is stable
  // if (window.BetterRolls) {
  //   window.BetterRolls.hooks.addItemSheet("TidySW5eItemSheet");
  // }
});

Hooks.on("renderTidySW5eItemSheet", (app, html, data) => {
  addEditorHeadline(app, html, data);
});
