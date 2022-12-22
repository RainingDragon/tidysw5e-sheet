/*
* This file and its functions are 
* adapted for the Tidy5eSheet from 
* FavTab Module version 0.5.4 
* by Felix M�ller aka syl3r96 
* (Felix#6196 on Discord).
*
* It is licensed under a 
* Creative Commons Attribution 4.0 International License 
* and can be found at https://github.com/syl3r86/favtab.
*/

import { tidy5eContextMenu } from "./context-menu.js";

export const addFavorites = async function(app, html, data, position) {

  // creating the favourite tab and loading favourited items
  let favMarker = $('<i class="fas fa-bookmark"></i>');

  let favItems = [];
  let favFeats = [];
  let favPowersPrepMode = {
    'atwill': {
      isAtWill: true,
      powers: []
    }, 'innate': {
      isInnate: true,
      powers: []
    }
  };
  let favPowers = { 
    0: {
      isCantrip: true,
      powers: []
    }, 1: {
      powers: [],
      value: data.actor.data.powers.power1.value,
      max: data.actor.data.powers.power1.max
    }, 2: {
      powers: [],
      value: data.actor.data.powers.power2.value,
      max: data.actor.data.powers.power2.max
    }, 3: {
      powers: [],
      value: data.actor.data.powers.power3.value,
      max: data.actor.data.powers.power3.max
    }, 4: {
      powers: [],
      value: data.actor.data.powers.power4.value,
      max: data.actor.data.powers.power4.max
    }, 5: {
      powers: [],
      value: data.actor.data.powers.power5.value,
      max: data.actor.data.powers.power5.max
    }, 6: {
      powers: [],
      value: data.actor.data.powers.power6.value,
      max: data.actor.data.powers.power6.max
    }, 7: {
      powers: [],
      value: data.actor.data.powers.power7.value,
      max: data.actor.data.powers.power7.max
    }, 8: {
      powers: [],
      value: data.actor.data.powers.power8.value,
      max: data.actor.data.powers.power8.max
    }, 9: {
      powers: [],
      value: data.actor.data.powers.power9.value,
      max: data.actor.data.powers.power9.max
    }
  }
  

  let powerCount = 0
  let powerPrepModeCount = 0
  let items = data.items;

  let renderFavTab = false;


  // processing all items and put them in their respective lists if they're favorited
  for (let item of items) {

      item.owner = app.actor.isOwner;
      
      // do not add the fav button for class items
      if (item.type == "class") continue;

      item.notFeat = true;
      if (item.type == "feat"){
        item.notFeat = false;
      }

      // making sure the flag to set favorites exists
      if (item.flags.favtab === undefined || item.flags.favtab.isFavorite === undefined) {
        item.flags.favtab = { isFavorite: false };
          // DO NOT SAVE AT THIS POINT! saving for each and every item creates unneeded data and hogs the system
          //app.actor.updateOwnedItem(item, true);
        }
        let isFav = item.flags.favtab.isFavorite;

      // add button to toggle favorite of the item in their native tab
      if (app.options.editable) {
        let favBtn = $(`<a class="item-control item-fav ${isFav ? 'active' : ''}" title="${isFav ? game.i18n.localize("TIDY5E.RemoveFav") : game.i18n.localize("TIDY5E.AddFav")}" data-fav="${isFav}"><i class="${isFav ? "fas fa-bookmark" : "fas fa-bookmark inactive"}"></i> <span class="control-label">${isFav ? game.i18n.localize("TIDY5E.RemoveFav") : game.i18n.localize("TIDY5E.AddFav")}</span></a>`);
        favBtn.click(ev => {
          app.actor.items.get(item._id).update({ "flags.favtab.isFavorite": !item.flags.favtab.isFavorite });
        });
        html.find(`.item[data-item-id="${item._id}"]`).find('.item-controls .item-edit').before(favBtn);
        if(item.flags.favtab.isFavorite){
          html.find(`.item[data-item-id="${item._id}"]`).addClass('isFav');
        }
      }

      if (isFav) {
        renderFavTab = true;

          // creating specific labels to be displayed
          let labels = {};
          let translation = {
              none : game.i18n.localize("SW5E.None"),
              action : game.i18n.localize("SW5E.Action"),
              bonus : game.i18n.localize("SW5E.BonusAction"),
              reaction : game.i18n.localize("SW5E.Reaction"),
              legendary : game.i18n.localize("SW5E.LegAct"),
              lair : game.i18n.localize("SW5E.LairAct"),
              special : game.i18n.localize("SW5E.Special"),
              day : game.i18n.localize("SW5E.TimeDay"),
              hour : game.i18n.localize("SW5E.TimeHour"),
              minute : game.i18n.localize("SW5E.TimeMinute"),
              reactiondamage : game.i18n.localize("midi-qol.reactionDamaged"),
              reactionmanual : game.i18n.localize("midi-qol.reactionManual")
          }

          function translateLabels (key){
            let string = String(key);
            return translation[string];
          }
          if (item.data.activation && item.data.activation.type) {
            let key = item.data.activation.type;
            // item.data.activation.type.capitalize()
            labels.activation = `${item.data.activation.cost ? item.data.activation.cost+' ':''}${translateLabels(key)}`;
          }

          // adding info that damage and attacks are possible
          if (['mwak', 'rwak', 'mpak', 'rpak'].indexOf(item.data.actionType) !== -1) {
            item.hasAttack = true;
          }
          if (item.data.damage && item.data.damage.parts.length > 0) {
            item.hasDamage = true;
          }

          // is item chargeable and on Cooldown
          item.isOnCooldown = false;
          if( item.data.recharge && item.data.recharge.value && item.data.recharge.charged === false){
            item.isOnCooldown = true;
            item.labels = {recharge : game.i18n.localize("SW5E.FeatureRechargeOn")+" ["+item.data.recharge.value+"+]", rechargeValue : "["+item.data.recharge.value+"+]"};
          }

          // adding info if item has quantity more than one
          item.isStack = false;
          if (item.data.quantity && item.data.quantity > 1) {
            item.isStack = true;
          }

          // adding attunement info
          item.canAttune = false;

          if (item.data.attunement) {
            if( item.data.attunement == 1 || item.data.attunement == 2) {
              item.canAttune = true;
            }
          }

          // check magic item
          item.isMagic = false;
          if (item.flags.magicitems && item.flags.magicitems.enabled || item.data.properties  && item.data.properties.mgc){
            item.isMagic = true;
          }

          let attr = item.type === "power" ? "preparation.prepared" : "equipped";
          let isActive = getProperty(item.data, attr);
          item.toggleClass = isActive ? "active" : "";
          if (item.type === "power") {
            if(item.data.preparation.mode == 'always'){
              item.toggleTitle = game.i18n.localize("SW5E.PowerPrepAlways");
            } else {
              item.toggleTitle = game.i18n.localize(isActive ? "SW5E.PowerPrepared" : "SW5E.PowerUnprepared");
            }
          } else {
            item.toggleTitle = game.i18n.localize(isActive ? "SW5E.Equipped" : "SW5E.Unequipped");
          }




          item.powerComps = "";
          if (item.type === "power" && item.data.components) {
            let comps = item.data.components;

            let c = (comps.concentration) ? true : false;


            item.powerCon = c;

          }

          item.favLabels = labels;
          
          item.editable = app.options.editable;
          switch (item.type) {
            case 'feat':
            if (item.flags.favtab.sort === undefined) {
              item.flags.favtab.sort = (favFeats.count + 1) * 100000; // initial sort key if not present
            }
            item.isFeat = true;
            favFeats.push(item);
            break;
            case 'power':
            if (item.data.preparation.mode && item.data.preparation.mode !== 'prepared') {

              if(item.data.preparation.mode == 'always') {
                // favPowersPrepMode['always'].powers.push(item);
                item.canPrep = true;
                item.alwaysPrep = true;
              } else 
              if(item.data.preparation.mode == 'atwill') {
                favPowersPrepMode['atwill'].powers.push(item);
              } else if(item.data.preparation.mode == 'innate') {
                favPowersPrepMode['innate'].powers.push(item);
              }
              powerPrepModeCount++;
            } else {
              item.canPrep = true;
            }
            if (item.canPrep && item.data.level) {
              favPowers[item.data.level].powers.push(item);
            } else if (item.canPrep) {
              favPowers[0].powers.push(item);
            }
            powerCount++;
            break;
            default:
            if (item.flags.favtab.sort === undefined) {
              item.flags.favtab.sort = (favItems.count + 1) * 100000; // initial sort key if not present
            }
            item.isItem = true;
            favItems.push(item);
            break;
          }
        }
      }

      // sorting favPowers alphabetically
      /*
      const favPowersArray = Object.keys(favPowers);
      for (let key of favPowersArray){
        favPowers[key].powers.sort(function(a, b){
         var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
         if (nameA < nameB) //sort string ascending
          return -1;
         if (nameA > nameB)
          return 1;
         return 0; //default return value (no sorting)
        });
      }
      */

      // sorting favPowersPrepMode alphabetically
      /*
      const favPowersPrepModeArray = Object.keys(favPowersPrepMode);
      for (let key of favPowersPrepModeArray){
        favPowersPrepMode[key].powers.sort(function(a, b){
         var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
         if (nameA < nameB) //sort string ascending
          return -1;
         if (nameA > nameB)
          return 1;
         return 0; //default return value (no sorting)
        });
      }
      */

      let attributesTab = html.find('.item[data-tab="attributes"]');
      let favContainer = html.find('.favorites-wrap');
      let favContent = html.find('.favorites-target');
      let favoritesTab = html.find('.tab.attributes');
      if (renderFavTab) {

      // rendering of the favtab
      let data = {};
      data.favItems = favItems.length > 0 ? favItems.sort((a, b) => (a.flags.favtab.sort) - (b.flags.favtab.sort)) : false;
      data.favFeats = favFeats.length > 0 ? favFeats.sort((a, b) => (a.flags.favtab.sort) - (b.flags.favtab.sort)) : false;
      data.favPowersPrepMode = powerPrepModeCount > 0 ? favPowersPrepMode : false;
      data.favPowers = powerCount > 0 ? favPowers : false;
      data.editable = app.options.editable;

      await loadTemplates(['modules/tidysw5e-sheet/templates/favorites/item.hbs']);
      let favHtml = $(await renderTemplate('modules/tidysw5e-sheet/templates/favorites/template.hbs', data));

      // Activating favorite-list events

      // showing item summary
      favHtml.find('.item-name h4').click((event) => app._onItemSummary(event));

      tidy5eContextMenu(favHtml);

      // the rest is only needed if the sheet is editable
      if (app.options.editable) {
          // rolling the item
          favHtml.find('.item-image').click(ev => app._onItemRoll(ev));

          // Item Dragging
          let handler = async ev => app._onDragStart(ev);
          favHtml.find('.item').each((i, li) => {
            if (li.classList.contains("items-header")) return;
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
          });

          // editing the item
          favHtml.find('.item-control.item-edit').click(ev => {
            let itemId = $(ev.target).parents('.item')[0].dataset.itemId;
            app.actor.items.get(itemId).sheet.render(true);
          });

          // toggle item icon
          favHtml.find('.item-control.item-toggle').click(ev => {
            ev.preventDefault();
            let itemId = ev.currentTarget.closest(".item").dataset.itemId;
            let item = app.actor.items.get(itemId);
            let attr = item.data.type === "power" ? "data.preparation.prepared" : "data.equipped";
            return item.update({ [attr]: !getProperty(item.data, attr) });
          });

          // update item attunement
          favHtml.find('.item-control.item-attunement').click( async (ev) => {
            ev.preventDefault();
            let itemId = ev.currentTarget.closest(".item").dataset.itemId;
            let item = app.actor.items.get(itemId);

            if(item.data.data.attunement == 2) {
              app.actor.items.get(itemId).update({'data.attunement': 1});
            } else {

              if(app.actor.data.data.details.attunedItemsCount >= app.actor.data.data.details.attunedItemsMax) {
                let count = actor.data.data.details.attunedItemsCount;
                ui.notifications.warn(`${game.i18n.format("TIDY5E.AttunementWarning", {number: count})}`);
              } else {
                app.actor.items.get(itemId).update({'data.attunement': 2});
              }
            }
          });

          // removing item from favorite list
          favHtml.find('.item-fav').click(ev => {
            let itemId = $(ev.target).parents('.item')[0].dataset.itemId;
            let val = !app.actor.items.get(itemId).data.flags.favtab.isFavorite
            app.actor.items.get(itemId).update({ "flags.favtab.isFavorite": val });
          });

          // changing the charges values (removing if both value and max are 0)
          favHtml.find('.item input').change(ev => {
            let itemId = $(ev.target).parents('.item')[0].dataset.itemId;
            let path = ev.target.dataset.path;
            let data = {};
            data[path] = Number(ev.target.value);
            app.actor.items.get(itemId).update(data);
            // app.activateFavs = true;
          });

          // changing the power slot values and overrides
          favHtml.find('.power-slots input').change(ev => {
            let path =  ev.target.dataset.target;
            let data = Number(ev.target.value);
            app.actor.update({[path]: data});
          });

          // creating charges for the item
          favHtml.find('.addCharges').click(ev => {
            let itemId = $(ev.target).parents('.item')[0].dataset.itemId;
            let item = app.actor.items.get(itemId);

            item.data.uses = { value: 1, max: 1 };
            let data = {};
            data['data.uses.value'] = 1;
            data['data.uses.max'] = 1;

            app.actor.items.get(itemId).update(data);
          });

          // charging features
          favHtml.find('.item-recharge').click(ev => {
            ev.preventDefault();
            let itemId = $(ev.target).parents('.item')[0].dataset.itemId;
            let item = app.actor.items.get(itemId);
            return item.rollRecharge();
          });

          // custom sorting
          favHtml.find('.item').on('drop', ev => {
            ev.preventDefault();
            // ev.stopPropagation();

            let dropData = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));

            if (dropData.actorId !== app.actor.id) {
                  // only do sorting if the item is from the same actor (not dropped from outside)
                  return;
                }

                let list = null;
                if (dropData.data.type === 'feat') {
                  list = favFeats;
                } else if(dropData.data.type === 'power') {
                  list = favPowers[dropData.data.data.level].powers;
                } else {
                  list = favItems;
                }

                let dragSource = list.find(i => i._id === dropData.data._id);
                let siblings = list.filter(i=> i._id !== dropData.data._id);
                let targetId = ev.target.closest('.item').dataset.itemId;
                let dragTarget = siblings.find(s => s._id === targetId);

                // console.log(`dragSource: ${dragSource} // siblings: ${siblings} // targetID: ${targetId} // dragTarget: ${dragTarget}`)

                if (dragTarget === undefined) {
                  // catch trying to drag from one list to the other, which is not supported
                  // console.log("folder not supported")
                  return;
                }

              // Perform the sort
              const sortUpdates = SortingHelpers.performIntegerSort(dragSource, { target: dragTarget, siblings: siblings, sortKey:'flags.favtab.sort'});
              const updateData = sortUpdates.map(u => {
                const update = u.update;
                update._id = u.target._id;
                return update;
              });

              app.actor.updateEmbeddedDocuments("Item", updateData);
            });
        }

        // better rolls support
        if (window.BetterRolls) {
          BetterRolls.addItemContent(app.object, favHtml, ".item .item-name h4", ".item-properties", ".item-image");
        }

      // adding the html to the appropiate containers
      favContainer.addClass('hasFavs');
      favContent.append(favHtml);
      // attributesTab.prepend(favMarker);
      html.find('.tab.attributes').scrollTop(position.top);
      if(game.settings.get("tidysw5e-sheet", "rightClickDisabled")){
        favContent.find('.items-list').addClass('alt-context');
      }
    }

    // Hooks.callAll("renderedTidy5eSheet", app, html, data);
  }
