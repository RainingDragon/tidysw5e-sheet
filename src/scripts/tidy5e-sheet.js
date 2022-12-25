import { SW5E } from "../../../systems/sw5e/module/config.js";
import ActorSheet5e from "../../../systems/sw5e/module/actor/sheets/newSheet/base.js";
import ActorSheet5eCharacter from "../../../systems/sw5e/module/applications/actor/character-sheet.mjs";
// import { tidy5eSettings } from "./app/settings.js";
import { Tidy5eUserSettings } from './app/settings.js';

import { preloadTidy5eHandlebarsTemplates } from "./app/tidy5e-templates.js";
import { tidy5eListeners } from "./app/listeners.js";
import { tidy5eContextMenu } from "./app/context-menu.js";
import { tidy5eSearchFilter } from "./app/search-filter.js";
import { addFavorites } from "./app/tidy5e-favorites.js";
import { tidy5eClassicControls } from "./app/classic-controls.js";
import { tidy5eShowActorArt } from "./app/show-actor-art.js";
import { tidy5eItemCard } from "./app/itemcard.js";
import { tidy5eAmmoSwitch } from "./app/ammo-switch.js";

let position = 0;


export class Tidy5eSheet extends sw5e.applications.actor.ActorSheet5eCharacter {
	
	get template() {
		if ( !game.user.isGM && this.actor.limited && !game.settings.get("tidysw5e-sheet", "expandedSheetEnabled") ) return "modules/tidysw5e-sheet/templates/actors/tidy5e-sheet-ltd.html";
		return "modules/tidysw5e-sheet/templates/actors/tidy5e-sheet.html";
	}
	
	static get defaultOptions() {
		let defaultTab = game.settings.get("tidysw5e-sheet", "defaultActionsTab") != 'default' ? 'attributes' : 'actions';
		if (!game.modules.get('character-actions-list-5e')?.active) defaultTab = 'description';

	  return mergeObject(super.defaultOptions, {
			classes: ["tidy5e", "sheet", "actor", "character"],
			blockFavTab: true,
			width: game.settings.get("tidysw5e-sheet", "playerSheetWidth") ?? 740,
			height: 840,
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: defaultTab}]
		});
	}


	/**
   * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
   */
	async getData() {
		const context = await super.getData();

    Object.keys(context.system.abilities).forEach(id => {
    	// let Id = id.charAt(0).toLowerCase() + id.slice(1);
    	let Id = id.charAt(0).toUpperCase() + id.slice(1);
      //data.data.abilities[id].abbr = CONFIG.SW5E.abilityAbbreviations[Id];
	  	context.system.abilities[id].abbr = CONFIG.SW5E.abilityAbbreviations[id];

		});

		context.appId = this.appId;

    return context;
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

		tidy5eListeners(html, actor);
		tidy5eContextMenu(html);
		tidy5eSearchFilter(html, actor);
		tidy5eShowActorArt(html, actor);
		tidy5eItemCard(html, actor);
		tidy5eAmmoSwitch(html, actor);

		// store Scroll Pos
		const attributesTab = html.find('.tab.attributes');
		attributesTab.scroll(function(){
			position = this.scrollPos = {top: attributesTab.scrollTop()};
		});
		let tabNav = html.find('a.item:not([data-tab="attributes"])');
		tabNav.click(function(){
			this.scrollPos = {top: 0};
			attributesTab.scrollTop(0);
		});

		// toggle inventory layout
		html.find('.toggle-layout.inventory-layout').click(async (event) => {
			event.preventDefault();
			
			if( $(event.currentTarget).hasClass('powerbook-layout')){
				if(actor.getFlag('tidysw5e-sheet', 'powerbook-grid')){
					await actor.unsetFlag('tidysw5e-sheet', 'powerbook-grid');
				} else {
					await actor.setFlag('tidysw5e-sheet', 'powerbook-grid', true);
				}
			} else {
				if(actor.getFlag('tidysw5e-sheet', 'inventory-grid')){
					await actor.unsetFlag('tidysw5e-sheet', 'inventory-grid');
				} else {
					await actor.setFlag('tidysw5e-sheet', 'inventory-grid', true);
				}
			}
 		});

		// toggle traits
 		html.find('.traits-toggle').click(async (event) => {
			event.preventDefault();
			
			if(actor.getFlag('tidysw5e-sheet', 'traits-compressed')){
				await actor.unsetFlag('tidysw5e-sheet', 'traits-compressed');
			} else {
				await actor.setFlag('tidysw5e-sheet', 'traits-compressed', true);
			}
 		});

		// set exhaustion level with portrait icon
		html.find('.exhaust-level li').click(async (event) => {
			event.preventDefault();
			let target = event.currentTarget;
			let value = Number(target.dataset.elvl);
			await actor.update({"system.attributes.exhaustion": value});
 		});

 		// changing item qty and charges values (removing if both value and max are 0)
    html.find('.item:not(.items-header) input').change(event => {
    	let value = event.target.value;
      let itemId = $(event.target).parents('.item')[0].dataset.itemId;
      let path = event.target.dataset.path;
      let data = {};
      data[path] = Number(event.target.value);
      actor.items.get(itemId).update(data);
    });

    // creating charges for the item
    html.find('.inventory-list .item .addCharges').click(event => {
      let itemId = $(event.target).parents('.item')[0].dataset.itemId;
      let item = actor.items.get(itemId);

      item.system.uses = { value: 1, max: 1 };
      let data = {};
      data['system.uses.value'] = 1;
      data['system.uses.max'] = 1;

      actor.items.get(itemId).update(data);
    });

    // toggle empty traits visibility in the traits list
    html.find('.traits .toggle-traits').click( async (event) => {
      if(actor.getFlag('tidysw5e-sheet', 'traitsExpanded')){
        await actor.unsetFlag('tidysw5e-sheet', 'traitsExpanded');
      } else {
        await actor.setFlag('tidysw5e-sheet', 'traitsExpanded', true);
      }
    });

		// update item attunement
		
		html.find('.item-control.item-attunement').click( async (event) => {
	    event.preventDefault();
 			let li = $(event.currentTarget).closest('.item'),
					 item = actor.items.get(li.data("item-id")),
					 count = actor.system.attributes.attunement.value;

 			if(item.system.attunement == 2) {
 				actor.items.get(li.data("item-id")).update({'system.attunement': 1});
 			} else {
 				if(count >= actor.system.attributes.attunement.max) {
			  	ui.notifications.warn(`${game.i18n.format("TIDY5E.AttunementWarning", {number: count})}`);
			  } else {
 					actor.items.get(li.data("item-id")).update({'system.attunement': 2});
			  }
 			}
 		});
		
	}
	
   async _onItemSummary(event) {
	   event.preventDefault();
	   const li = $(event.currentTarget).parents(".item");
	   const item = this.actor.items.get(li.data("item-id"));
	   const chatData = await item.getChatData({secrets: this.actor.isOwner});

	   // Toggle summary
	   if (li.hasClass("expanded")) {
		   let summary = li.children(".item-summary");
		   summary.slideUp(200, () => summary.remove());
	   } else {
		   let div = $(`<div class="item-summary">${chatData.description.value}</div>`);
		   let props = $('<div class="item-properties"></div>');
		   chatData.properties.forEach((p) => props.append(`<span class="tag">${p}</span>`));
		   div.append(props);
		   li.append(div.hide());
		   div.slideDown(200);
	   }
	   li.toggleClass("expanded");
   }

	// add actions module
	async _renderInner(...args) {
		const html = await super._renderInner(...args);
		const actionsListApi = game.modules.get('character-actions-list-5e')?.api;
		let injectCharacterSheet;
		if(game.modules.get('character-actions-list-5e')?.active) injectCharacterSheet = game.settings.get('character-actions-list-5e', 'inject-characters');
		
		try {
			if(game.modules.get('character-actions-list-5e')?.active && injectCharacterSheet){
				// Update the nav menu
				const actionsTabButton = $('<a class="item" data-tab="actions">' + game.i18n.localize(`SW5E.ActionPl`) + '</a>');
				const tabs = html.find('.tabs[data-group="primary"]');
				tabs.prepend(actionsTabButton);

				// Create the tab
				const sheetBody = html.find('.sheet-body');
				const actionsTab = $(`<div class="tab actions" data-group="primary" data-tab="actions"></div>`);
				const actionsLayout = $(`<div class="list-layout"></div>`);
				actionsTab.append(actionsLayout);
				sheetBody.prepend(actionsTab);

				// const actionsTab = html.find('.actions-target');
				
				const actionsTabHtml = $(await actionsListApi.renderActionsList(this.actor));
				actionsLayout.html(actionsTabHtml);
			}
			} catch (e) {
				// log(true, e);
			}
			
			return html;
	}
}

// count inventory items
async function countInventoryItems(app, html, data){
	if(game.user.isGM) {
		html.find('.attuned-items-counter').addClass('isGM');
	}
  html.find('.tab.inventory .item-list').each(function(){
  	let itemlist = this;
  	let items = $(itemlist).find('li');
  	let itemCount = items.length - 1;
  	$(itemlist).prev('.items-header').find('.item-name').append(' ('+itemCount+')');
  });
}

// count attuned items
async function countAttunedItems(app, html, data){
	const actor = app.actor;
	const	count = actor.system.attributes.attunement.value;
	if(actor.system.attributes.attunement.value > actor.system.attributes.attunement.max) {
		html.find('.attuned-items-counter').addClass('overattuned');
		ui.notifications.warn(`${game.i18n.format("TIDY5E.AttunementWarning", {number: count})}`);
	}
}

// handle traits list display
async function toggleTraitsList(app, html, data){
  html.find('.traits:not(.always-visible):not(.expanded) .form-group.inactive').remove();
}

// Check Death Save Status
async function checkDeathSaveStatus(app, html, data){
	if(data.editable){
		// var actor = game.actors.entities.find(a => a.data._id === data.actor._id);
		let actor = app.actor;
		var currentHealth = actor.system.attributes.hp.value;
		var deathSaveSuccess = actor.system.attributes.death.success;
		var deathSaveFailure = actor.system.attributes.death.failure;
		
  	// console.log(`current HP: ${currentHealth}, success: ${deathSaveSuccess}, failure: ${deathSaveFailure}`);
		if (currentHealth <=0){
			$('.tidy5e-sheet .profile').addClass('dead');
		}

		if(currentHealth > 0 && deathSaveSuccess != 0 || currentHealth > 0 && deathSaveFailure != 0){
				await actor.update({"system.attributes.death.success": 0});
				await actor.update({"system.attributes.death.failure": 0});
		}
	}
}

// Edit Protection - Hide empty Inventory Sections, Effects aswell as add and delete-buttons
async function editProtection(app, html, data) {
  let actor = app.actor;
  if(game.user.isGM && game.settings.get("tidysw5e-sheet", "editGmAlwaysEnabled")) {
		html.find(".classic-controls").addClass('gmEdit');
  } else if(!actor.getFlag('tidysw5e-sheet', 'allow-edit')){
		
		if(game.settings.get("tidysw5e-sheet", "editTotalLockEnabled")){
			html.find(".skill input").prop('disabled', true);
			html.find(".skill .config-button").remove();
			// html.find(".skill .proficiency-toggle").remove();
			html.find(".skill .proficiency-toggle").removeClass('proficiency-toggle');
			html.find(".ability-score").prop('disabled', true);
			html.find(".ac-display input").prop('disabled', true);
			html.find(".initiative input").prop('disabled', true);
			html.find(".hp-max").prop('disabled', true);
			html.find(".resource-name input").prop('disabled', true);
			html.find(".res-max").prop('disabled', true);
			html.find(".res-options").remove();
			html.find(".ability-modifiers .proficiency-toggle").remove();
			html.find(".ability .config-button").remove();
			html.find(".traits .config-button,.traits .trait-selector,.traits .proficiency-selector").remove();
			html.find('[contenteditable]').prop('contenteditable', false);
			html.find(".powerbook .slot-max-override").remove();
			html.find(".powercasting-attribute select").prop('disabled', true);
			const powerbook = html.find(".powerbook .inventory-list .item-list").length;
			if (powerbook == 0) html.find(".item[data-tab='powerbook']").remove();
		}

		let resourcesUsed = 0;
		html.find('.resources input[type="text"]').each( function(){
			if( $(this).val() != ''){
				resourcesUsed++
			}
		});
		if (resourcesUsed == 0) html.find('.resources').hide();
    
		let itemContainer = html.find('.inventory-list.items-list, .effects-list.items-list');
    html.find('.inventory-list .items-header:not(.powerbook-header), .effects-list .items-header').each(function(){
      if(($(this).next('.item-list').find('li').length - $(this).next('.item-list').find('li.items-footer').length) == 0){
        $(this).next('.item-list').addClass('hidden').hide();
				$(this).addClass('hidden').hide();
      }
    });

    html.find('.inventory-list .items-footer').addClass('hidden').hide();
		html.find('.inventory-list .item-control.item-delete').remove();

		if (game.settings.get('tidysw5e-sheet', "editEffectsGmOnlyEnabled") && !game.user.isGM ) {
			html.find('.effects-list .items-footer, .effects-list .effect-controls').remove();
		}	else {
			html.find('.effects-list .items-footer, .effects-list .effect-control.effect-delete').remove();
		}

    itemContainer.each(function(){
			let hiddenSections = $(this).find('> .hidden').length;
			let totalSections = $(this).children().not('.notice').length;
			// console.log('hidden: '+ hiddenSections + '/ total: '+totalSections);
		  if(hiddenSections >= totalSections){
				if( $(this).hasClass('effects-list') && !game.user.isGM && game.settings.get('tidysw5e-sheet', 'editEffectsGmOnlyEnabled')){
					$(this).prepend(`<span class="notice">${game.i18n.localize("TIDY5E.GmOnlyEdit")}</span>`);
				} else {
					$(this).append(`<span class="notice">${game.i18n.localize("TIDY5E.EmptySection")}</span>`);
				}
			}
    });
  } else if (!game.user.isGM && actor.getFlag('tidysw5e-sheet', 'allow-edit') && game.settings.get('tidysw5e-sheet', 'editEffectsGmOnlyEnabled')){
			let itemContainer = html.find('.effects-list.items-list');

			itemContainer.prepend(`<span class="notice">${game.i18n.localize("TIDY5E.GmOnlyEdit")}</span>`);
			html.find('.effects-list .items-footer, .effects-list .effect-controls').remove();

			html.find('.effects-list .items-header').each(function(){
				if($(this).next('.item-list').find('li').length < 1){
					$(this).next('.item-list').addClass('hidden').hide();
					$(this).addClass('hidden').hide();
				}
			});
	}
}

// Add Character Class List
async function addClassList(app, html, data) {
	if(data.editable){
		if (!game.settings.get("tidysw5e-sheet", "classListDisabled")) {
			// let actor = game.actors.entities.find(a => a.data._id === data.actor._id);
			let actor = app.actor;
			let classList = [];
			let items = data.actor.items;
			for (let item of items) {
				if (item.type === "class") {
					let levels = (item.system.levels) ? `<span class="levels-info">${item.system.levels}</span>` : ``;
					classList.push(item.name + levels);
				} 
				if (item.type === "archetype") {
					classList.push(item.name);
				}
			}
			classList = "<ul class='class-list'><li class='class-item'>" + classList.join("</li><li class='class-item'>") + "</li></ul>";
			mergeObject(actor, {"flags.tidysw5e-sheet.classlist": classList});
			let classListTarget = html.find('.bonus-information');
			classListTarget.append(classList);
		}
	}
}

// Calculate Power Attack modifier
async function powerAttackMod(app,html,data){
// CYR: Commented out as it is not used
// 	if(data.editable){
// 		// let actor = game.actors.entities.find(a => a.data._id === data.actor._id),
// 		let actor = app.actor,
// 				prof = actor.data.data.attributes.prof,
// 				powerAbility = html.find('.powercasting-attribute select option:selected').val(),
// 				abilityMod = powerAbility != '' ? actor.data.data.abilities[powerAbility].mod : 0,
// 				powerBonus = parseInt(actor.data.data.bonuses.rpak.attack || 0),
// 				powerAttackMod = prof + abilityMod + powerBonus,
// 				text = powerAttackMod > 0 ? '+'+powerAttackMod : powerAttackMod;
// 		// console.log('Prof: '+prof+ '/ Power Ability: '+powerAbility+ '/ ability Mod: '+abilityMod+'/ Power Attack Mod:'+powerAttackMod);
// 		html.find('.power-mod .power-attack-mod').html(text);
// 	}
}

// Abbreviate Currency
async function abbreviateCurrency(app,html,data) {
	html.find('.currency .currency-item label').each(function(){
		let currency = $(this).data('denom').toUpperCase();
		// console.log('Currency Abbr: '+CONFIG.DND5E.currencies[currency].abbreviation);
		// let abbr = CONFIG.DND5E.currencies[currency].abbreviation;
		// if(abbr == CONFIG.DND5E.currencies[currency].abbreviation){
		// 	abbr = currency;
		// }
		let abbr = game.i18n.localize(`TIDY5E.CurrencyAbbr${currency}`);
		if(abbr == `TIDY5E.CurrencyAbbr${currency}`){
			abbr = currency;
		}

		$(this).html(abbr);
	});
}

// transform DAE formulas for maxPreparesPowers
async function tidyCustomEffect(actor, change) {
  if (change.key !== "system.details.maxPreparedPowers") return;
  if (change.value?.length > 0) {
    let oldValue =  getProperty(actor.data, change.key) || 0;
    let changeText = change.value.trim();
    let op = "none";
    if (["+","-","/","*","="].includes(changeText[0])) {
      op = changeText[0];
      changeText = changeText.slice(1);
    }
		const rollData = actor.getRollData();
		Object.keys(rollData.abilities).forEach(abl => {
			rollData.abilities[abl].mod = Math.floor((rollData.abilities[abl].value - 10) /2);
		});
		// const value = new Roll(changeText, rollData).roll().total;
		const roll_value = await new Roll(changeText, rollData).roll();
		const value = roll_value.total;
    oldValue = Number.isNumeric(oldValue) ? parseInt(oldValue) : 0;
    switch (op) {
      case "+": return setProperty(actor.system, change.key, oldValue + value);
      case "-": return setProperty(actor.system, change.key, oldValue - value);
      case "*": return setProperty(actor.system, change.key, oldValue * value);
      case "/": return setProperty(actor.system, change.key, oldValue / value);
      case "=": return setProperty(actor.system, change.key, value);
      default:  return setProperty(actor.system, change.key, value);
    }
  }
}

// add active effects marker
function markActiveEffects(app, html, data){
	if (game.settings.get("tidysw5e-sheet", "activeEffectsMarker")) {
		let actor = app.actor;
		let items = system.actor.items;
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
		html.find('.tidy5e-sheet #playerName').remove();
	}
	if (game.settings.get("tidysw5e-sheet", "journalTabDisabled")) {
		html.find('.tidy5e-sheet .tidy5e-navigation a[data-tab="journal"]').remove();
	}
	if (game.settings.get("tidysw5e-sheet", "rightClickDisabled")) {
		if(game.settings.get("tidysw5e-sheet", "classicControlsEnabled")){
			html.find('.tidy5e-sheet .grid-layout .items-list').addClass('alt-context');
		} else {
			html.find('.tidy5e-sheet .items-list').addClass('alt-context');
		}
	}
	if (game.settings.get("tidysw5e-sheet", "classicControlsEnabled")) {
		tidy5eClassicControls(html);
	}
	if (game.settings.get("tidysw5e-sheet", "portraitStyle") == "pc" || game.settings.get("tidysw5e-sheet", "portraitStyle") == "all") {
		html.find('.tidy5e-sheet .profile').addClass('roundPortrait');
	}
	if (game.settings.get("tidysw5e-sheet", "hpOverlayDisabled")) {
		html.find('.tidy5e-sheet .profile').addClass('disable-hp-overlay');
	}
	if (game.settings.get("tidysw5e-sheet", "hpBarDisabled")) {
		html.find('.tidy5e-sheet .profile').addClass('disable-hp-bar');
	}
	if (game.settings.get("tidysw5e-sheet", "inspirationDisabled")) {
		html.find('.tidy5e-sheet .profile .inspiration').remove();
	}
	if (game.settings.get("tidysw5e-sheet", "inspirationAnimationDisabled")) {
		html.find('.tidy5e-sheet .profile .inspiration label i').addClass('disable-animation');
	}
	if (game.settings.get("tidysw5e-sheet", "hpOverlayBorder") > 0) {
		$('.system-sw5e').get(0).style.setProperty('--pc-border', game.settings.get("tidysw5e-sheet", "hpOverlayBorder")+'px');
	} else {
		$('.system-sw5e').get(0).style.removeProperty('--pc-border');
	}
	if(game.settings.get("tidysw5e-sheet", "hideIfZero")) {
		html.find('.tidy5e-sheet .profile').addClass('autohide');
	}
	if (game.settings.get("tidysw5e-sheet", "exhaustionDisabled")) {
		html.find('.tidy5e-sheet .profile .exhaustion-container').remove();
	}
	if (game.settings.get("tidysw5e-sheet", "exhaustionOnHover")) {
		html.find('.tidy5e-sheet .profile').addClass('exhaustionOnHover');
	}
	
	if (game.settings.get("tidysw5e-sheet", "inspirationOnHover")) {
		html.find('.tidy5e-sheet .profile').addClass('inspirationOnHover');
	}
	if (game.settings.get("tidysw5e-sheet", "traitsMovedBelowResource")) {
		let altPos = html.find('.alt-trait-pos');
		let traits = html.find('.traits');
		altPos.append(traits);
	}
	if (!game.settings.get("tidysw5e-sheet", "traitsTogglePc")) {
		html.find('.tidy5e-sheet .traits').addClass('always-visible');
	}
	if (game.settings.get("tidysw5e-sheet", "traitLabelsEnabled")) {
		html.find('.tidy5e-sheet .traits').addClass('show-labels');
	}
	if(game.user.isGM){
		html.find('.tidy5e-sheet').addClass('isGM');
	}
	if (game.settings.get("tidysw5e-sheet", "hiddenDeathSavesEnabled") && !game.user.isGM) {
		html.find('.tidy5e-sheet .death-saves').addClass('gmOnly');
	}
	if (game.settings.get("tidysw5e-sheet", "quantityAlwaysShownEnabled")) {
		html.find('.item').addClass('quantityAlwaysShownEnabled');
	}
	$('.info-card-hint .key').html(game.settings.get('tidysw5e-sheet', 'itemCardsFixKey'));
}

// Preload tidy5e Handlebars Templates
Hooks.once("init", () => {
	preloadTidy5eHandlebarsTemplates();
	Hooks.on("applyActiveEffect", tidyCustomEffect);

	// init user settings menu
	Tidy5eUserSettings.init();
});

// Register Tidy5e Sheet and make default character sheet
Actors.registerSheet("sw5e", Tidy5eSheet, {
	types: ["character"],
	makeDefault: true
});
const buttons = document.querySelectorAll('.item');

buttons.forEach(button => {
  button.addEventListener('click', event => {
    // Get the target section id
    const targetId = event.target.dataset.target;
    // Select the target section element
    const targetSection = document.getElementById(targetId);
    // Hidden class removed from target section
    targetSection.classList.remove('hidden');
    // Select all the other section elements
    const otherSections = document.querySelectorAll('section:not(#' + targetId + ')');
    // Hidden class added to other sections
    otherSections.forEach(section => {
      section.classList.add('hidden');
    });
  });
});

Hooks.on("renderTidy5eSheet", (app, html, data) => {
	setSheetClasses(app, html, data);
	editProtection(app, html, data);
	addClassList(app, html, data);
	toggleTraitsList(app, html, data)
	checkDeathSaveStatus(app, html, data);
	abbreviateCurrency(app,html,data);
	powerAttackMod(app,html,data);
	addFavorites(app, html, data, position);
	countAttunedItems(app, html, data);
	countInventoryItems(app,html,data);
	markActiveEffects(app,html,data);
	// console.log(data.actor);
	// console.log("Tidy5e Sheet rendered!");
});

Hooks.once("ready", (app, html, data) => {
	// console.log("Tidy5e Sheet is ready!");
});
