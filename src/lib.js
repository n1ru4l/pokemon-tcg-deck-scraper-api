"use strict";

const $ = require("cheerio");
const fetch = require("node-fetch");

const scrapeCard = fetch => async (url) => {
  const html = await fetch(url).then((res) => res.text());
  const $root = $(html);
  const imageUrl = $("img.card-picture.card-image-img", $root).attr("src");
  const name = $(".card-text-name", $root).text();
  const type = $(".card-text-type", $root).text();

  const abilities = [];
  $(".card-text-ability", $root).each((index, element) => {
    const title = $(".card-text-ability-info", element).text().trim();
    const effect = $(".card-text-ability-effect", element).text().trim();
    abilities.push({ title, effect })
  });

  const attacks = [];
  $(".card-text-attack", $root).each((index, element) => {
    const rawInfo = $(".card-text-attack-info", element).text().trim();
    const costs = $(".ptcg-symbol", element).text().trim();
    const info = rawInfo.startsWith(costs) ? rawInfo.replace(costs, "").trim() : rawInfo;
    const effect = $(".card-text-attack-effect", element).text();
    attacks.push({ info, costs: costs.split(""), effect });
  });

  const effects = [];
  if (type.startsWith("Trainer")) {
    const effect = $(".card-text > .card-text-section:nth-child(2)", $root).text().trim()
    effects.push(effect)
  }

  return ({ imageUrl, name, type, abilities, attacks, effects })
};

module.exports = { scrapeCard };
scrapeCard(fetch)("https://limitlesstcg.com/cards/teu/88/").then(console.log)
