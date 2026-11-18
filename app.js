import {
  scaleIngredients,
  nutritionTotals,
  macroSplit,
  suggestAdjustment,
  validateTarget,
} from './logic.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'ricette-bilancio-v1';

const ESEMPIO = {
  nome: 'Pasta al pollo (esempio)',
  porzioni: 2,
  ingredienti: [
    { name: 'Pasta', grams: 100, kcal: 350, protein: 12, fat: 1.5, carbs: 72, pricePerKg: 2 },
    { name: 'Petto di pollo', grams: 150, kcal: 110, protein: 23, fat: 1.5, carbs: 0, pricePerKg: 12 },
    { name: 'Olio EVO', grams: 10, kcal: 884, protein: 0, fat: 100, carbs: 0, pricePerKg: 8 },
  ],
};

// ---------- Righe ingredienti ----------
function nuovaRiga(ing = {}) {
  const div = document.createElement('div');
  div.className = 'riga';
  div.innerHTML = `
    <div class="nome"><label>Nome</label><input data-k="name" value="${ing.name ?? ''}" /></div>
    <div><label>Grammi</label><input data-k="grams" type="number" min="0" step="1" value="${ing.grams ?? ''}" /></div>
    <div><label>kcal/100g</label><input data-k="kcal" type="number" min="0" step="1" value="${ing.kcal ?? ''}" /></div>
    <div><label>Prot/100g</label><input data-k="protein" type="number" min="0" step="0.1" value="${ing.protein ?? ''}" /></div>
    <div><label>Grassi/100g</label><input data-k="fat" type="number" min="0" step="0.1" value="${ing.fat ?? ''}" /></div>
    <div><label>Carb/100g</label><input data-k="carbs" type="number" min="0" step="0.1" value="${ing.carbs ?? ''}" /></div>
    <button class="btn piccolo" title="Rimuovi">✕</button>
  `;
  div.querySelector('button').onclick = () => div.remove();
  $('righe').appendChild(div);
}

function leggiIngredienti() {
  return [...document.querySelectorAll('#righe .riga')].map((r) => {
    const v = (k) => r.querySelector(`[data-k="${k}"]`).value;
    return {
      name: v('name') || 'Ingrediente',
      grams: Number(v('grams')) || 0,
      kcal: Number(v('kcal')) || 0,
      protein: Number(v('protein')) || 0,
      fat: Number(v('fat')) || 0,
      carbs: Number(v('carbs')) || 0,
      pricePerKg: undefined,
    };
  });
}

function caricaIngredienti(ingredienti) {
  $('righe').innerHTML = '';
  ingredienti.forEach(nuovaRiga);
}

function leggiTarget() {
  const t = {
    protein: Number($('tP').value) || 0,
    carbs: Number($('tC').value) || 0,
    fat: Number($('tF').value) || 0,
  };
  return validateTarget(t);
}

// ---------- Output ----------
const f1 = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const eur = (n) => '€ ' + n.toFixed(2).replace('.', ',');

function mostraErrore(msg) {
  $('esito').innerHTML = `<p class="errore">${msg}</p>`;
}

function mostraRisultati(ingredienti, porzioniBase, porzioniNuove) {
  const totali = nutritionTotals(ingredienti);
  const split = macroSplit(totali);
  const perPorzione = (x) => x / porzioniBase;
  const scala = porzioniNuove && porzioniNuove !== porzioniBase
    ? nutritionTotals(scaleIngredients(ingredienti, porzioniBase, porzioniNuove))
    : null;

  let html = `
    <div class="grid2" style="margin-top:12px">
      <div class="kpi">Kcal totali<b>${f1(totali.kcal)}</b><small>${f1(perPorzione(totali.kcal))} kcal a porzione</small></div>
      <div class="kpi">Ripartizione kcal<b>P ${f1(split.protein)}% · C ${f1(split.carbs)}% · G ${f1(split.fat)}%</b></div>
    </div>`;
  if (scala) {
    html += `<p>A ${f1(porzioniNuove)} porzioni: ${f1(scala.kcal)} kcal totali.</p>`;
  }
  return html;
}

function ricettaCorrente() {
  return {
    nome: $('titolo').value.trim(),
    porzioni: Number($('porzioni').value),
    ingredienti: leggiIngredienti(),
  };
}

// ---------- Azioni ----------
$('aggiungi').onclick = () => nuovaRiga();

$('calcola').onclick = () => {
  const r = ricettaCorrente();
  if (!(r.porzioni > 0)) return mostraErrore('Inserisci un numero di porzioni valido.');
  const nuove = Number($('scalaPorzioni').value) || r.porzioni;
  $('esito').innerHTML = mostraRisultati(r.ingredienti, r.porzioni, nuove);
};

$('bilancia').onclick = () => {
  try {
    const r = ricettaCorrente();
    const target = leggiTarget();
    const res = suggestAdjustment(r.ingredienti, {
      protein: target.protein,
      carbs: target.carbs,
      fat: target.fat,
    });
    let html = mostraRisultati(r.ingredienti, r.porzioni, Number($('scalaPorzioni').value) || r.porzioni);
    if (res.improved) {
      html += `<div class="suggerimento">Per avvicinarti al target, prova a portare <b>${res.name}</b> da ${f1(res.from)} g a <b>${f1(res.to)} g</b>. Lo scostamento passa da ${f1(res.baseError)} a ${f1(res.error)} punti.</div>`;
    } else {
      html += `<div class="suggerimento">Nessuna modifica di un singolo ingrediente migliora la ripartizione. Puoi cambiare il target o aggiungere un ingrediente.</div>`;
    }
    $('esito').innerHTML = html;
  } catch (e) {
    mostraErrore(e.message);
  }
};

// ---------- Salvataggio locale ----------
function leggiArchivio() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
}
function scriviArchivio(a) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); return true; } catch { return false; }
}
function aggiornaElenco() {
  const a = leggiArchivio();
  $('elenco').innerHTML = Object.keys(a).map((n) => `<option value="${n}">${n}</option>`).join('');
}

$('salva').onclick = () => {
  const r = ricettaCorrente();
  if (!r.nome) return mostraErrore('Dai un nome alla ricetta prima di salvarla.');
  const a = leggiArchivio();
  a[r.nome] = r;
  scriviArchivio(a) ? (aggiornaElenco(), $('elenco').value = r.nome, $('esito').innerHTML = '<p>Ricetta salvata.</p>')
    : mostraErrore('Impossibile salvare su questo dispositivo.');
};

$('carica').onclick = () => {
  const r = leggiArchivio()[$('elenco').value];
  if (!r) return;
  $('titolo').value = r.nome;
  $('porzioni').value = r.porzioni;
  caricaIngredienti(r.ingredienti);
};

$('elimina').onclick = () => {
  const nome = $('elenco').value;
  if (!nome) return;
  const a = leggiArchivio();
  delete a[nome];
  scriviArchivio(a);
  aggiornaElenco();
};

// ---------- Avvio ----------
caricaIngredienti(ESEMPIO.ingredienti);
$('titolo').value = ESEMPIO.nome;
$('porzioni').value = ESEMPIO.porzioni;
aggiornaElenco();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
