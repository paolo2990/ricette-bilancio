import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scaleIngredients,
  nutritionTotals,
  macroSplit,
  suggestAdjustment,
  validateTarget,
} from '../logic.js';

const pasta = { name: 'Pasta', grams: 100, kcal: 350, protein: 12, fat: 1.5, carbs: 72, pricePerKg: 2 };
const pollo = { name: 'Petto di pollo', grams: 150, kcal: 110, protein: 23, fat: 1.5, carbs: 0, pricePerKg: 12 };
const olio = { name: 'Olio EVO', grams: 10, kcal: 884, protein: 0, fat: 100, carbs: 0, pricePerKg: 8 };

test('scala le grammature in proporzione alle porzioni', () => {
  const scaled = scaleIngredients([pasta], 2, 4);
  assert.equal(scaled[0].grams, 200);
});

test('rifiuta porzioni non valide', () => {
  assert.throws(() => scaleIngredients([pasta], 0, 2));
});

test('calcola totali nutrizionali e costo', () => {
  const t = nutritionTotals([pasta, pollo]);
  assert.equal(Math.round(t.kcal), Math.round(350 + 110 * 1.5));
  assert.equal(Math.round(t.protein * 10) / 10, 12 + 23 * 1.5);
  assert.ok(Math.abs(t.cost - (0.2 + 1.8)) < 1e-9);
});

test('la ripartizione calorica somma a 100', () => {
  const s = macroSplit(nutritionTotals([pasta, pollo, olio]));
  assert.ok(Math.abs(s.protein + s.carbs + s.fat - 100) < 1e-9);
});

test('il target deve sommare a 100', () => {
  assert.throws(() => validateTarget({ protein: 30, carbs: 30, fat: 30 }));
  assert.doesNotThrow(() => validateTarget({ protein: 30, carbs: 50, fat: 20 }));
});

test('suggerisce una modifica che migliora lo scostamento dal target', () => {
  const target = { protein: 30, carbs: 50, fat: 20 };
  const res = suggestAdjustment([pasta, pollo, olio], target);
  assert.equal(res.improved, true);
  assert.ok(res.error < res.baseError);
  assert.ok(['Pasta', 'Petto di pollo', 'Olio EVO'].includes(res.name));
});

test('non propone nulla se il piatto è già sul target', () => {
  // Ricetta con ripartizione vicina a 100/0/0 non migliorabile con il solo ingrediente dato
  const onlyPollo = [{ name: 'Solo pollo', grams: 100, kcal: 100, protein: 25, fat: 0, carbs: 0 }];
  const res = suggestAdjustment(onlyPollo, { protein: 100, carbs: 0, fat: 0 });
  assert.equal(res.improved, false);
});
