"use strict";

const fetch = require("node-fetch");
const express = require("express");
const $ = require("cheerio");
const { scrapeCard } = require("./lib")

const BASE_URL = "https://limitlesstcg.com";

const deckCache = new Map();
const cardCache = new Map();

const scrapeCards = async (cardList) => {
  const cards = [];

  for (const { count, url } of cardList) {
    let cardData = cardCache.get(url);
    if (!cardData) {
      cardData = await scrapeCard(BASE_URL + url);
      cardCache.set(url, cardData);
    }
    cards.push({
      amount: count,
      card: cardData
    });
  }
}

const scrapeDeck = async (url, place) => {
  const html = await fetch(url).then((res) => res.text());
  const cardList = [];
  const title = $(".decklist-top-title", html)[0].children[0].data;

  $(
    `.decklist-column:not(.energy-column-mobile) p[id^='deck']`,
    $(`.below-filter-panel .decklist`, html)[place - 1]
  ).each((index, e) => {
    const cardAmount = parseInt($(".decklist-card-count", e).text(), 10);
    const cardUrl = $("a", e).attr("href");
    cardList.push({
      count: cardAmount,
      url: cardUrl,
    });
  });

  const cards = await scrapeCards(cardList)

  return {
    title,
    cards,
    totalCardAmount: cards.reduce((current, card) => current + card.amount, 0),
  };
};

const buildTournamentCacheKey = (id, place) => `${id}_${place}`;

const app = express();

const buildTournamentScrapeUrl = (id) =>
  `https://limitlesstcg.com/tournaments/?id=${id}&show=lists&lang=de&mode=default&view=regular`;

app.get("/tournament/:id/:place", (req, res) => {
  const id = req.params.id;
  const place = parseInt(req.params.place, 10);
  const cacheKey = buildTournamentCacheKey(id, place);

  return (deckCache.has(cacheKey)
    ? Promise.resolve(deckCache.get(cacheKey))
    : scrapeDeck(buildTournamentScrapeUrl(id), place).then((deckList) => {
        deckCache.set(cacheKey, deckList);
        return deckList;
      })
  )
    .then((deckList) => {
      res.json({
        data: {
          deckList,
        },
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        data: null,
        error: {
          code: "UNEXPECTED_ERROR",
        },
      });
    });
});

const scrapeDeckList = async (url) => {
  const html = await fetch(url).then((res) => res.text());
  const $tree = $(html);
  const title = $(".decklist-top-title", $tree)[0].children[0].data;
  const cardList = [];

  $(`.decklist-column:not(.energy-column-mobile) p[id^='deck0']`, $tree).each(
    (i, element) => {
      const cardAmount = parseInt(
        $(".decklist-card-count", element).text(),
        10
      );
      const cardUrl = $("a", element).attr("href");
      cardList.push({
        count: cardAmount,
        url: cardUrl,
      });
    }
  );

  const cards = await scrapeCards(cardList)

  return {
    title,
    cards,
    totalCardAmount: cards.reduce((current, card) => current + card.amount, 0),
  };
};

const buildDeckListCacheKey = (id) => `deck-list_${id}`;
const buildDeckListScrapeUrl = (id) =>
  `https://limitlesstcg.com/decks/?list=${id}&lang=de`;

app.get("/deck-list/:id", (req, res) => {
  const id = req.params.id;
  const cacheKey = buildDeckListCacheKey(id);
  const url = buildDeckListScrapeUrl(id);

  return (deckCache.has(cacheKey)
    ? Promise.resolve(deckCache.get(cacheKey))
    : scrapeDeckList(url).then((deckList) => {
        deckCache.set(cacheKey, deckList);
        return deckList;
      })
  )
    .then((deckList) => {
      res.json({
        data: {
          deckList,
        },
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        data: null,
        error: {
          code: "UNEXPECTED_ERROR",
        },
      });
    });
});

const PORT = parseInt(process.env.PORT || "7777", 10);

const server = app.listen(PORT, () => {
  console.log(`listening on 0.0.0.0:${PORT}`);
});

process.on("SIGINT", () => {
  console.log(`shutting down`);
  server.close();
});
