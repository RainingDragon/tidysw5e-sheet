import { settingsList } from "./settingsList.js";

export class TidySW5eUserSettings extends FormApplication {
  static init() {
    game.settings.registerMenu("tidysw5e-sheet", "userMenu", {
      name: "",
      label: game.i18n.localize("TIDYSW5E.Settings.SheetMenu.label"),
      icon: "fas fa-cog",
      type: TidySW5eUserSettings,
      restricted: false
    });

    settingsList();
  }

  // settings template
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      template: "modules/tidysw5e-sheet/templates/settings.html",
      height: 500,
      title: game.i18n.localize("TIDYSW5E.Settings.SheetMenu.title"),
      width: 600,
      classes: ["tidysw5e", "settings"],
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: "form",
          initial: "Players"
        }
      ],
      submitOnClose: true
    };
  }

  constructor(object = {}, options) {
    super(object, options);
  }

  _getHeaderButtons() {
    let btns = super._getHeaderButtons();
    btns[0].label = "Close";
    return btns;
  }

  getSettingsData() {
    // console.log(game.settings.get('tidysw5e-sheet'))
    const settings = [
      "itemCardsForAllItems",
      "itemCardsAreFloating",
      "itemCardsDelay",
      "itemCardsFixKey",

      "rightClickDisabled",
      "contextRollButtons",

      "traitLabelsEnabled",
      "traitsMovedBelowResource",
      "traitsMovedBelowResourceNpc",
      "traitsTogglePc",
      "traitsAlwaysShownNpc",

      "skillsAlwaysShownNpc",

      "activeEffectsMarker",
      "quantityAlwaysShownEnabled",
      "exhaustionDisabled",
      "hpBarDisabled",
      "hpBarDisabledNpc",
      "hpBarDisabledVehicle",
      "hpOverlayDisabledNpc",
      "hpOverlayDisabled",
      "hpOverlayDisabledVehicle",
      "hpOverlayBorderNpc",
      "hpOverlayBorder",
      "hpOverlayBorderVehicle",

      "inspirationOnHover",
      "inspirationAnimationDisabled",
      "inspirationDisabled",

      "exhaustionEffectsEnabled",
      "exhaustionEffectIcon",
      "exhaustionEffectCustom",
      "exhaustionEffectCustomTiers",
      "exhaustionOnHover",

      "editEffectsGmOnlyEnabled",
      "editGmAlwaysEnabled",

      "playerNameEnabled",
      "classListDisabled",
      "hideIfZero",
      "linkMarkerNpc",
      "restingForNpcsEnabled",
      "restingForNpcsChatDisabled",
      "editTotalLockEnabled",
      "portraitStyle",
      "expandedSheetEnabled"
    ];

    // return game.settings.get('tidysw5e-sheet', 'user-settings');
    let data = {};
    settings.forEach((setting) => {
      data[setting] = { value: game.settings.get("tidysw5e-sheet", setting) };
      // console.log(data[setting]);
    });
    return data;
  }

  getData() {
    let data = super.getData();
    data.settings = this.getSettingsData();
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    // console.log('Listeners Active!')
    // console.log(html)

    let exhaustionEffectSelect = html.find("select#exhaustionEffectsEnabled");
    let exhaustionSelected = $(exhaustionEffectSelect).val();
    // console.log(exhaustionSelected)
    switch (exhaustionSelected) {
      case "default":
        html.find("input#exhaustionEffectIcon").closest(".setting").hide();
        html.find("input#exhaustionEffectCustom").closest(".setting").hide();
        break;
      case "tidysw5e":
        html.find("input#exhaustionEffectCustom").closest(".setting").hide();
        break;
      case "custom":
        html.find("input#exhaustionEffectIcon").closest(".setting").hide();
        break;
    }

    exhaustionEffectSelect.on("change", function (e) {
      html.find("input#exhaustionEffectIcon").closest(".setting").hide();
      html.find("input#exhaustionEffectCustom").closest(".setting").hide();

      let value = e.target.value;
      if (value == "tidysw5e") {
        html.find("input#exhaustionEffectIcon").closest(".setting").show();
      } else if (value == "custom") {
        html.find("input#exhaustionEffectCustom").closest(".setting").show();
      }
    });

    html.find("input#exhaustionEffectIcon").on("change", function (e) {
      // console.log(e.target.value)
      if (e.target.value == "" || e.target.value == null) {
        e.target.value = "modules/tidysw5e-sheet/images/exhaustion.svg";
      }
    });
  }

  redrawOpenSheets() {
    game.actors.entities.filter((a) => a.sheet.rendered).forEach((a) => a.sheet.render(true));
  }

  _updateObject(ev, formData) {
    const data = expandObject(formData);
    let settingsUpdated = false;
    // console.log(formData);
    // console.log(settingOptions);
    for (let key in data) {
      // console.log(`Key: ${key} with value: ${data[key]}`);
      let oldSetting = game.settings.get("tidysw5e-sheet", key);
      let newSetting = data[key];
      if (oldSetting == newSetting) continue;
      // console.log(`${key} changed to "${data[key]}"`);
      game.settings.set("tidysw5e-sheet", key, data[key]);
      settingsUpdated = true;
    }

    if (settingsUpdated) {
      this.redrawOpenSheets();
    }
  }
}

Hooks.on("renderTidySW5eUserSettings", () => {
  if (!game.user.isGM) {
    document.querySelectorAll(".tidysw5e.settings .gm-only").forEach(function (el) {
      el.remove();
    });
  }
});
