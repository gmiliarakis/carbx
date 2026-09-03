# CarbX

A diabetes/renal exchange-list calculator. Enter a food's nutrition panel (by
hand, pasted text, photo OCR, or an Open Food Facts search), set a portion,
and it decomposes the food into carb/protein/fat exchanges, flags sodium,
potassium, phosphorus, sugar and fibre, and scans the ingredients list for
phosphate and potassium additives.

Runs entirely client-side. No account, no server, no API keys. Label
reading (paste or photo) uses local OCR and a regex parser, nothing is sent
anywhere.

## How it works

The core exchange logic lives in `src/lib/exchange.js`, covered by unit
tests in `src/lib/*.test.js` (run with `npm test`). `src/App.jsx` is the UI
layer on top (styles included, injected as a `<style>` tag). Four parts of
the logic worth knowing about if you're reading the code:

- **`decompose()`** implements the exchange-list algorithm: draws carbohydrate
  down to whole exchanges first, then protein, then fat, each stage working
  on whatever the previous stage left over.
- **`parseNutritionText()`** is the offline label reader: keyword-plus-nearest-
  number regex matching across five languages, used for both pasted text and
  OCR output. It's approximate by nature, always double-check the values it
  fills in.
- **`scanIngredients()`** flags phosphate, potassium, sodium and added-sugar
  additives in a pasted ingredients list, matched by E-number or name.
- **`gramsPerExchange()`** converts one exchange into grams of the specific
  food entered, independent of the portion size you typed in.

Each function has a comment above it explaining the reasoning; nothing is
narrated line by line.

## Run it locally

```
npm install
npm run dev
```

Open the printed `localhost` URL.

## Build for hosting

```
npm run build
```

Output goes to `dist/`, a static site deployable anywhere.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys automatically
on every push to `main`. One-time setup:

1. Push this repo to GitHub.
2. In the repo's Settings → Pages, set Source to "GitHub Actions".
3. Push to `main` (or re-run the workflow from the Actions tab). The site
   deploys to `https://<your-github-username>.github.io/<repo-name>/` by
   default.

### Custom domain

`public/CNAME` is already set to `carbx.gmiliarakis.com`. To actually use
it: add a DNS `CNAME` record for `exchange` pointing to
`<your-github-username>.github.io` at your domain's DNS provider, then enter
the same domain under Settings → Pages → Custom domain and enable "Enforce
HTTPS" once it verifies. Rename or remove `public/CNAME` first if you'd
rather use a different subdomain or the default github.io URL.

## License

MIT — see [LICENSE](LICENSE).

Built with the help of Claude (Anthropic).
