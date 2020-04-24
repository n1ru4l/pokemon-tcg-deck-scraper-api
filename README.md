# JSON Deck Scraper API for https://limitlesstcg.com/

## Why

[Tabletop Simulator](https://store.steampowered.com/app/286160/Tabletop_Simulator/) allows LUA scripting and I wanted to build a script for importing Pokemon Decks from the internet without all the manual work. The LUA engine is not powerful enough for parsing big HTML sites (at least the libraries I tried using).
Because of this, I created this proxy middleware that will return a JSON response that can easily be parsed by Tabletop Simulator.

The script for the Tabletop Simulator can be found here: `tabletop-simulator-script/Global.ttslua`, it uses [Decker](https://github.com/tjakubo2/Decker), which makes generating card decks easier.

## Install

`yarn install`

## Start

`node src/index.js`

## API Endpoints

### `/tournament/:tournamentId/:ranking`: `JSONResponse<DeckList>`

**Sample Deck Link:** `https://limitlesstcg.com/tournaments/?id=261` and `5. Rank`

**Endpoint for retriving deck:** `http://localhost:7777/tournament/261/5`

### `/deck-list/:deckListId`: `JSONResponse<DeckList>`

**Sample Deck Link:** https://limitlesstcg.com/decks/?list=3692

**Endpoint for retriving deck:** `http://localhost:7777/deck-list/3692`

## API Types

```ts
type JSONResponse<Body> =
  | {
      data: null;
      error: {
        code: string;
      };
    }
  | {
      data: Body;
      err: Error;
    };

type Card = {
  imageUrl: string;
  name: string;
  type: string;
  abilities: Array<{
    title: string;
    effect: string;
  }>;
  attacks: Array<{
    in
  }>
}

type DeckList = {
  deckList: {
    title: string;
    cards: Array<{
      amount: number;
      card: Card;
    }>;
  };
};
```
