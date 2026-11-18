# Bilancia Ricette

App per calcolare e bilanciare gli ingredienti di una ricetta: scala le porzioni, mostra kcal e ripartizione proteine/carboidrati/grassi, stima il costo e suggerisce la modifica di grammatura che avvicina la ricetta al tuo obiettivo.

## Contenuto

- `index.html`, `app.js`, `logic.js`: l'app (web app statica, nessun server)
- `manifest.json`, `sw.js`, `icons/`: installazione su Android e funzionamento offline
- `test/logic.test.mjs`: test della logica (`npm test`, richiede Node 18+)

## Come funziona il bilanciamento

- Le kcal per macronutriente usano 4 kcal/g per proteine e carboidrati, 9 kcal/g per i grassi.
- Il suggerimento prova, per ogni ingrediente, grammature da 0 a 1000 g (passo 5 g) e sceglie la modifica che minimizza lo scostamento dal target percentuale.
- Propone una sola modifica alla volta. Per un bilanciamento più fine conviene ripetere il calcolo dopo ogni modifica.

## Pubblicare la PWA (passo 1)

La PWA va pubblicata su un indirizzo HTTPS pubblico. Opzione semplice: GitHub Pages.

1. Crea un repository pubblico su GitHub e carica il contenuto di questa cartella.
2. In Settings > Pages scegli il branch principale come sorgente.
3. Annota l'indirizzo, per esempio `https://tuonome.github.io/ricette-bilancio/`.

## Creare l'APK (passo 2)

Opzione A, senza installare nulla: vai su https://www.pwabuilder.com, incolla l'indirizzo pubblicato, scegli "Android" e scarica il pacchetto. Contiene un file APK firmato pronto da installare.

Opzione B, con Bubblewrap sul tuo computer (richiede Node e Java):

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://tuonome.github.io/ricette-bilancio/manifest.json
bubblewrap build
```

Il comando `build` produce `app-release-signed.apk`.

## Installare sul telefono

Trasferisci l'APK sul telefono e apri il file. Android chiederà di consentire l'installazione da fonti esterne per quel file.

## Limiti noti

- Le ricette sono salvate solo sul dispositivo (localStorage). Per sincronizzarle tra dispositivi serve un backend, che non è incluso.
- I valori nutrizionali vanno inseriti a mano per ciascun ingrediente.
- Il campo prezzo non è ancora esposto nell'interfaccia; la logica lo supporta già.
