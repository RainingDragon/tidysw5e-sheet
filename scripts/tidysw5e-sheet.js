import { SW5E } from "../../../systems/sw5e/module/config.js";
import ActorSheet5e from "../../../systems/sw5e/module/actor/sheets/newSheet/base.js";
import ActorSheet5eCharacter from "../../../systems/sw5e/module/actor/sheets/newSheet/character.js";
// import { tidysw5eSettings } from "./app/settings.js";
import { TidySW5eUserSettings } from "./app/settings.js";

import { preloadTidySW5eHandlebarsTemplates } from "./app/tidysw5e-templates.js";
import { tidysw5eListeners } from "./app/listeners.js";
import { tidysw5eContextMenu } from "./app/context-menu.js";
import { tidysw5eSearchFilter } from "./app/search-filter.js";
import { addFavorites } from "./app/tidysw5e-favorites.js";
import { tidysw5eClassicControls } from "./app/classic-controls.js";
import { tidysw5eShowActorArt } from "./app/show-actor-art.js";
import { tidysw5eItemCard } from "./app/itemcard.js";

let position = 0;

export class TidySW5eSheet extends ActorSheet5eCharacter {
  get template() {
    if (!game.user.isGM && this.actor.limited && !game.settings.get("tidysw5e-sheet", "expandedSheetEnabled"))
      return "modules/tidysw5e-sheet/templates/actors/tidysw5e-sheet-ltd.html";
    return "modules/tidysw5e-sheet/templates/actors/tidysw5e-sheet.html";
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["tidysw5e", "sheet", "actor", "character"],
      blockFavTab: true,
      width: 740,
      height: 840
    });
  }

  /**
   * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
   */
  getData() {
    const data = super.getData();

    Object.keys(data.data.abilities).forEach((id) => {
      let Id = id.charAt(0).toUpperCase() + id.slice(1);
      data.data.abilities[id].abbr = game.i18n.localize(`SW5E.Ability${Id}Abbr`);
    });

    return data;
  }

  _createEditor(target, editorOptions, initialContent) {
    editorOptions.min_height = 200;
    super._createEditor(target, editorOptions, initialContent);
  }

  // save all simultaneously open editor field when one field is saved
  async _onEditorSave(target, element, content) {
    return this.submit();
  }

  activateListeners(html) {
    super.activateListeners(html);

    let actor = this.actor;

    tidysw5eListeners(html, actor);
    tidysw5eContextMenu(html);
    tidysw5eSearchFilter(html, actor);
    tidysw5eShowActorArt(html, actor);
    tidysw5eItemCard(html, actor);

    // store Scroll Pos
    const attributesTab = html.find(".tab.attributes");
    attributesTab.scroll(function () {
      position = this.scrollPos = { top: attributesTab.scrollTop() };
    });
    let tabNav = html.find('a.item:not([data-tab="attributes"])');
    tabNav.click(function () {
      this.scrollPos = { top: 0 };
      attributesTab.scrollTop(0);
    });

    // toggle inventory layout
    html.find(".toggle-layout.inventory-layout").click(async (event) => {
      event.preventDefault();

      if ($(event.currentTarget).hasClass("powerbook-layout")) {
        if (actor.getFlag("tidysw5e-sheet", "powerbook-grid")) {
          await actor.unsetFlag("tidysw5e-sheet", "powerbook-grid");
        } else {
          await actor.setFlag("tidysw5e-sheet", "powerbook-grid", true);
        }
      } else {
        if (actor.getFlag("tidysw5e-sheet", "inventory-grid")) {
          await actor.unsetFlag("tidysw5e-sheet", "inventory-grid");
        } else {
          await actor.setFlag("tidysw5e-sheet", "inventory-grid", true);
        }
      }
    });

    // toggle traits
    html.find(".traits-toggle").click(async (event) => {
      event.preventDefault();

      if (actor.getFlag("tidysw5e-sheet", "traits-compressed")) {
        await actor.unsetFlag("tidysw5e-sheet", "traits-compressed");
      } else {
        await actor.setFlag("tidysw5e-sheet", "traits-compressed", true);
      }
    });

    // set exhaustion level with portrait icon
    html.find(".exhaust-level li").click(async (event) => {
      event.preventDefault();
      let target = event.currentTarget;
      let value = Number(target.dataset.elvl);
      let effectName = game.settings.get("tidysw5e-sheet", "exhaustionEffectCustom");

      if (game.settings.get("tidysw5e-sheet", "exhaustionEffectsEnabled") != "custom") {
        let data = actor.data.data;
        await actor.update({ "data.attributes.exhaustion": value });
      } else {
        if (value != 0) {
          let effect = `${effectName} ${value}`;
          let id = actor._id;
          let tokens = canvas.tokens.placeables;
          let index = tokens.findIndex((x) => x.data.actorId === id);
          // console.log(index);
          if (index == -1) {
            ui.notifications.warn(`${game.i18n.localize("TIDYSW5E.Settings.CustomExhaustionEffect.warning")}`);
            return;
          }
          let token = tokens[index];
          game.cub.addCondition(effect, [token]);
        } else {
          const levels = game.settings.get("tidysw5e-sheet", "exhaustionEffectCustomTiers");
          for (let i = 1; i <= levels; i++) {
            let tier = `${effectName} ${i}`;
            if (game.cub.hasCondition(tier)) {
              // console.log(tier)
              await game.cub.removeCondition(tier);
            }
          }
        }
      }
    });

    // changing item qty and charges values (removing if both value and max are 0)
    html.find(".item:not(.items-header) input").change((event) => {
      let value = event.target.value;
      let itemId = $(event.target).parents(".item")[0].dataset.itemId;
      let path = event.target.dataset.path;
      let data = {};
      data[path] = Number(event.target.value);
      actor.getOwnedItem(itemId).update(data);
    });

    // creating charges for the item
    html.find(".inventory-list .item .addCharges").click((event) => {
      let itemId = $(event.target).parents(".item")[0].dataset.itemId;
      let item = actor.getOwnedItem(itemId);

      item.data.uses = { value: 1, max: 1 };
      let data = {};
      data["data.uses.value"] = 1;
      data["data.uses.max"] = 1;

      actor.getOwnedItem(itemId).update(data);
    });

    // toggle empty traits visibility in the traits list
    html.find(".traits .toggle-traits").click(async (event) => {
      if (actor.getFlag("tidysw5e-sheet", "traitsExpanded")) {
        await actor.unsetFlag("tidysw5e-sheet", "traitsExpanded");
      } else {
        await actor.setFlag("tidysw5e-sheet", "traitsExpanded", true);
      }
    });

    // update item attunement
    html.find(".item-control.item-attunement").click(async (event) => {
      event.preventDefault();
      let li = $(event.currentTarget).closest(".item"),
        item = actor.getOwnedItem(li.data("item-id")),
        count = actor.data.data.details.attunedItemsCount;

      if (item.data.data.attunement == 2) {
        actor.getOwnedItem(li.data("item-id")).update({ "data.attunement": 1 });
      } else {
        if (count >= actor.data.data.details.attunedItemsMax) {
          ui.notifications.warn(`${game.i18n.format("TIDYSW5E.AttunementWarning", { number: count })}`);
        } else {
          actor.getOwnedItem(li.data("item-id")).update({ "data.attunement": 2 });
        }
      }
    });
  }

  // add actions module
  async _renderInner(...args) {
    const html = await super._renderInner(...args);

    try {
      if (game.modules.get("character-actions-list-5e")?.active) {
        // Update the nav menu
        const actionsTabButton = $(
          '<a class="item" data-tab="actions">' + game.i18n.localize(`SW5E.ActionPl`) + "</a>"
        );
        const tabs = html.find('.tabs[data-group="primary"]');
        tabs.prepend(actionsTabButton);

        // Create the tab
        const sheetBody = html.find(".sheet-body");
        const actionsTab = $(`<div class="tab actions" data-group="primary" data-tab="actions"></div>`);
        const actionsLayout = $(`<div class="list-layout"></div>`);
        actionsTab.append(actionsLayout);
        sheetBody.prepend(actionsTab);

        // const actionsTab = html.find('.actions-target');

        const actionsTabHtml = $(await CAL5E.renderActionsList(this.actor));
        actionsLayout.html(actionsTabHtml);
      }
    } catch (e) {
      // log(true, e);
    }

    return html;
  }
}

// count inventory items
async function countInventoryItems(app, html, data) {
  if (game.user.isGM) {
    html.find(".attuned-items-counter").addClass("isGM");
  }
  html.find(".tab.inventory .item-list").each(function () {
    let itemlist = this;
    let items = $(itemlist).find("li");
    let itemCount = items.length - 1;
    $(itemlist)
      .prev(".items-header")
      .find(".item-name")
      .append(" (" + itemCount + ")");
  });
}

// count attuned items
async function countAttunedItems(app, html, data) {
  let actor = app.actor;
  // let actor = game.actors.entities.find(a => a.data._id === data.actor._id),
  if (data.editable && !actor.compendium) {
    let count = actor.data.data.details.attunedItemsCount;
    // if no items are counted set default value to 3
    if (!actor.data.data.details.attunedItemsMax) {
      await actor.update({ "data.details.attunedItemsMax": 3 });
    }

    if (!count) {
      await actor.update({ "data.details.attunedItemsCount": 0 });
    }

    let items = actor.data.items;
    let attunedItems = 0;

    for (var i = 0; i < items.length; i++) {
      if (items[i].data.attunement == 2) {
        attunedItems++;
      }
    }

    await actor.update({ "data.details.attunedItemsCount": attunedItems });

    // html.find('.attuned-items-counter .attuned-items-current').text(attunedItems);
    if (actor.data.data.details.attunedItemsCount > actor.data.data.details.attunedItemsMax) {
      html.find(".attuned-items-counter").addClass("overattuned");
      ui.notifications.warn(`${game.i18n.format("TIDYSW5E.AttunementWarning", { number: count })}`);
    }
  }
}

// handle traits list display
async function toggleTraitsList(app, html, data) {
  html.find(".traits:not(.always-visible):not(.expanded) .form-group.inactive").addClass("trait-hidden").hide();
  let visibleTraits = html.find(".traits .form-group:not(.trait-hidden)");
  for (let i = 0; i < visibleTraits.length; i++) {
    if (i % 2 != 0) {
      visibleTraits[i].classList.add("even");
    }
  }
}

// Check Death Save Status
async function checkDeathSaveStatus(app, html, data) {
  if (data.editable) {
    // var actor = game.actors.entities.find(a => a.data._id === data.actor._id);
    let actor = app.actor;
    var data = actor.data.data;
    var currentHealth = data.attributes.hp.value;
    var deathSaveSuccess = data.attributes.death.success;
    var deathSaveFailure = data.attributes.death.failure;

    if ((currentHealth > 0 && deathSaveSuccess != 0) || (currentHealth > 0 && deathSaveFailure != 0)) {
      await actor.update({ "data.attributes.death.success": 0 });
      await actor.update({ "data.attributes.death.failure": 0 });
    }
  }
}

// Edit Protection - Hide empty Inventory Sections, Effects aswell as add and delete-buttons
async function editProtection(app, html, data) {
  let actor = app.actor;
  if (game.user.isGM && game.settings.get("tidysw5e-sheet", "editGmAlwaysEnabled")) {
  } else if (!actor.getFlag("tidysw5e-sheet", "allow-edit")) {
    if (game.settings.get("tidysw5e-sheet", "editTotalLockEnabled")) {
      html.find(".skill input").prop("disabled", true);
      html.find(".skill .proficiency-toggle").remove();
      html.find(".ability-score").prop("disabled", true);
      html.find(".ac-display input").prop("disabled", true);
      html.find(".initiative input").prop("disabled", true);
      html.find(".hp-max").prop("disabled", true);
      html.find(".resource-name input").prop("disabled", true);
      html.find(".res-max").prop("disabled", true);
      html.find(".res-options").remove();
      html.find(".ability-modifiers .proficiency-toggle").remove();
      html.find("[contenteditable]").prop("contenteditable", false);
      html.find(".powercasting-attribute select").prop("disabled", true);
    }

    let itemContainer = html.find(".inventory-list.items-list, .effects-list.items-list");
    html.find(".inventory-list .items-header:not(.powerbook-header), .effects-list .items-header").each(function () {
      if (
        $(this).next(".item-list").find("li").length - $(this).next(".item-list").find("li.items-footer").length ==
        0
      ) {
        $(this).next(".item-list").addClass("hidden").hide();
        $(this).addClass("hidden").hide();
      }
    });

    html.find(".inventory-list .items-footer").addClass("hidden").hide();
    html.find(".inventory-list .item-control.item-delete").remove();

    if (game.settings.get("tidysw5e-sheet", "editEffectsGmOnlyEnabled") && !game.user.isGM) {
      html.find(".effects-list .items-footer, .effects-list .effect-controls").remove();
    } else {
      html.find(".effects-list .items-footer, .effects-list .effect-control.effect-delete").remove();
    }

    itemContainer.each(function () {
      let hiddenSections = $(this).find("> .hidden").length;
      let totalSections = $(this).children().not(".notice").length;
      // console.log('hidden: '+ hiddenSections + '/ total: '+totalSections);
      if (hiddenSections >= totalSections) {
        if (
          $(this).hasClass("effects-list") &&
          !game.user.isGM &&
          game.settings.get("tidysw5e-sheet", "editEffectsGmOnlyEnabled")
        ) {
          $(this).prepend(`<span class="notice">${game.i18n.localize("TIDYSW5E.GmOnlyEdit")}</span>`);
        } else {
          $(this).append(`<span class="notice">${game.i18n.localize("TIDYSW5E.EmptySection")}</span>`);
        }
      }
    });
  } else if (
    !game.user.isGM &&
    actor.getFlag("tidysw5e-sheet", "allow-edit") &&
    game.settings.get("tidysw5e-sheet", "editEffectsGmOnlyEnabled")
  ) {
    let itemContainer = html.find(".effects-list.items-list");

    itemContainer.prepend(`<span class="notice">${game.i18n.localize("TIDYSW5E.GmOnlyEdit")}</span>`);
    html.find(".effects-list .items-footer, .effects-list .effect-controls").remove();

    html.find(".effects-list .items-header").each(function () {
      if ($(this).next(".item-list").find("li").length < 1) {
        $(this).next(".item-list").addClass("hidden").hide();
        $(this).addClass("hidden").hide();
      }
    });
  }
}

// Add Character Class List
async function addClassList(app, html, data) {
  if (data.editable) {
    if (!game.settings.get("tidysw5e-sheet", "classListDisabled")) {
      // let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
      let actor = app.actor;
      let classList = [];
      let items = data.actor.items;
      for (let item of items) {
        if (item.type === "class") {
          let levels = item.data.levels ? `<span class="levels-info">${item.data.levels}</span>` : ``;
          let subclass = item.data.subclass ? `<span class="subclass-info">(${item.data.subclass})</span>` : ``;
          classList.push(item.name + levels + subclass);
        }
      }
      classList =
        "<ul class='class-list'><li class='class-item'>" +
        classList.join("</li><li class='class-item'>") +
        "</li></ul>";
      mergeObject(actor, { "data.flags.tidysw5e-sheet.classlist": classList });
      let classListTarget = html.find(".bonus-information");
      classListTarget.append(classList);
    }
  }
}

// Calculate Power Attack modifier
async function powerAttackMod(app, html, data) {
  if (data.editable) {
    // let actor = game.actors.entities.find(a => a.data._id === data.actor._id),
    let actor = app.actor,
      prof = actor.data.data.attributes.prof,
      powerAbility = html.find(".powercasting-attribute select option:selected").val(),
      abilityMod = powerAbility != "" ? actor.data.data.abilities[powerAbility].mod : 0,
      powerAttackMod = prof + abilityMod,
      text = powerAttackMod > 0 ? "+" + powerAttackMod : powerAttackMod;
    // console.log('Prof: '+prof+ '/ Power Ability: '+powerAbility+ '/ ability Mod: '+abilityMod+'/ Power Attack Mod:'+powerAttackMod);
    html.find(".power-mod .power-attack-mod").html(text);
  }
}

// Abbreviate Currency
async function abbreviateCurrency(app, html, data) {
  html.find(".currency .currency-item label").each(function () {
    let currency = $(this).data("denom").toUpperCase();
    let abbr = game.i18n.localize(`TIDYSW5E.CurrencyAbbr${currency}`);
    if (abbr == `TIDYSW5E.CurrencyAbbr${currency}`) {
      abbr = currency;
    }
    $(this).html(abbr);
  });
}

// transform DAE formulas for maxPreparesPowers
function tidyCustomEffect(actor, change) {
  if (change.key !== "data.details.maxPreparedPowers") return;
  if (change.value?.length > 0) {
    let oldValue = getProperty(actor.data, change.key) || 0;
    let changeText = change.value.trim();
    let op = "none";
    if (["+", "-", "/", "*", "="].includes(changeText[0])) {
      op = changeText[0];
      changeText = changeText.slice(1);
    }
    const value = new Roll(changeText, actor.getRollData()).roll().total;
    oldValue = Number.isNumeric(oldValue) ? parseInt(oldValue) : 0;
    switch (op) {
      case "+":
        return setProperty(actor.data, change.key, oldValue + value);
      case "-":
        return setProperty(actor.data, change.key, oldValue - value);
      case "*":
        return setProperty(actor.data, change.key, oldValue * value);
      case "/":
        return setProperty(actor.data, change.key, oldValue / value);
      case "=":
        return setProperty(actor.data, change.key, value);
      default:
        return setProperty(actor.data, change.key, value);
    }
  }
}

// add active effects marker
function markActiveEffects(app, html, data) {
  if (game.settings.get("tidysw5e-sheet", "activeEffectsMarker")) {
    let actor = app.actor;
    let items = data.actor.items;
    let marker = `<span class="ae-marker" title="Item has active effects">Æ</span>`;
    for (let item of items) {
      // console.log(item);
      if (item.effects.length > 0) {
        // console.log(item);
        let id = item._id;
        // console.log(id);
        html.find(`.item[data-item-id="${id}"] .item-name h4`).append(marker);
      }
    }
  }
}

// Manage Sheet Options
async function setSheetClasses(app, html, data) {
  // let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
  let actor = app.actor;
  if (!game.settings.get("tidysw5e-sheet", "playerNameEnabled")) {
    html.find(".tidysw5e-sheet #playerName").remove();
  }
  if (game.settings.get("tidysw5e-sheet", "rightClickDisabled")) {
    if (game.settings.get("tidysw5e-sheet", "classicControlsEnabled")) {
      html.find(".tidysw5e-sheet .grid-layout .items-list").addClass("alt-context");
    } else {
      html.find(".tidysw5e-sheet .items-list").addClass("alt-context");
    }
  }
  if (game.settings.get("tidysw5e-sheet", "classicControlsEnabled")) {
    tidysw5eClassicControls(html);
  }
  if (
    game.settings.get("tidysw5e-sheet", "portraitStyle") == "pc" ||
    game.settings.get("tidysw5e-sheet", "portraitStyle") == "all"
  ) {
    html.find(".tidysw5e-sheet .profile").addClass("roundPortrait");
  }
  if (game.settings.get("tidysw5e-sheet", "hpOverlayDisabled")) {
    html.find(".tidysw5e-sheet .profile").addClass("disable-hp-overlay");
  }
  if (game.settings.get("tidysw5e-sheet", "hpBarDisabled")) {
    html.find(".tidysw5e-sheet .profile").addClass("disable-hp-bar");
  }
  if (game.settings.get("tidysw5e-sheet", "inspirationDisabled")) {
    html.find(".tidysw5e-sheet .profile .inspiration").remove();
  }
  if (game.settings.get("tidysw5e-sheet", "inspirationAnimationDisabled")) {
    html.find(".tidysw5e-sheet .profile .inspiration label i").addClass("disable-animation");
  }
  if (game.settings.get("tidysw5e-sheet", "hpOverlayBorder") > 0) {
    $(".system-sw5e")
      .get(0)
      .style.setProperty("--pc-border", game.settings.get("tidysw5e-sheet", "hpOverlayBorder") + "px");
  } else {
    $(".system-sw5e").get(0).style.removeProperty("--pc-border");
  }
  if (game.settings.get("tidysw5e-sheet", "hideIfZero")) {
    html.find(".tidysw5e-sheet .profile").addClass("autohide");
  }
  if (game.settings.get("tidysw5e-sheet", "exhaustionDisabled")) {
    html.find(".tidysw5e-sheet .profile .exhaustion-container").remove();
  }
  if (game.settings.get("tidysw5e-sheet", "exhaustionOnHover")) {
    html.find(".tidysw5e-sheet .profile").addClass("exhaustionOnHover");
  }

  if (game.settings.get("tidysw5e-sheet", "inspirationOnHover")) {
    html.find(".tidysw5e-sheet .profile").addClass("inspirationOnHover");
  }
  if (game.settings.get("tidysw5e-sheet", "traitsMovedBelowResource")) {
    let altPos = html.find(".alt-trait-pos");
    let traits = html.find(".traits");
    altPos.append(traits);
  }
  if (!game.settings.get("tidysw5e-sheet", "traitsTogglePc")) {
    html.find(".tidysw5e-sheet .traits").addClass("always-visible");
  }
  if (game.settings.get("tidysw5e-sheet", "traitLabelsEnabled")) {
    html.find(".tidysw5e-sheet .traits").addClass("show-labels");
  }
  if (game.user.isGM) {
    html.find(".tidysw5e-sheet").addClass("isGM");
  }
  if (game.settings.get("tidysw5e-sheet", "quantityAlwaysShownEnabled")) {
    html.find(".item").addClass("quantityAlwaysShownEnabled");
  }
  $(".info-card-hint .key").html(game.settings.get("tidysw5e-sheet", "itemCardsFixKey"));
}

// Preload tidysw5e Handlebars Templates
Hooks.once("init", () => {
  preloadTidySW5eHandlebarsTemplates();
  Hooks.on("applyActiveEffect", tidyCustomEffect);

  // init user settings menu
  TidySW5eUserSettings.init();
});

// Register TidySW5e Sheet and make default character sheet
Actors.registerSheet("sw5e", TidySW5eSheet, {
  types: ["character"],
  makeDefault: true
});

Hooks.on("renderTidySW5eSheet", (app, html, data) => {
  setSheetClasses(app, html, data);
  editProtection(app, html, data);
  addClassList(app, html, data);
  toggleTraitsList(app, html, data);
  checkDeathSaveStatus(app, html, data);
  abbreviateCurrency(app, html, data);
  powerAttackMod(app, html, data);
  addFavorites(app, html, data, position);
  countAttunedItems(app, html, data);
  countInventoryItems(app, html, data);
  markActiveEffects(app, html, data);
  // console.log(data.actor);
  // console.log("TidySW5e Sheet rendered!");
});

Hooks.once("ready", (app, html, data) => {
  // console.log("TidySW5e Sheet is ready!");
  // can be removed when 0.7.x is stable
  // if (window.BetterRolls) {
  // 	window.BetterRolls.hooks.addActorSheet("TidySW5eSheet");
  // }
  // load settings
  // tidysw5eSettings();
});
