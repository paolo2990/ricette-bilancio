// Logica pura: nessuna dipendenza dal DOM, testabile con Node.
// Ogni ingrediente: { name, grams, kcal, protein, fat, carbs, pricePerKg? }
// I valori nutrizionali (kcal, protein, fat, carbs) sono per 100 g.

const round1 = (n) => Math.round(n * 10) / 10;

export function scaleIngredients(ingredients, fromServings, toServings) {
  if (!(fromServings > 0) || !(toServings > 0)) {
    throw new Error('Le porzioni devono essere numeri maggiori di zero');
  }
  const factor = toServings / fromServings;
  return ingredients.map((i) => ({ ...i, grams: round1(i.grams * factor) }));
}

export function nutritionTotals(ingredients) {
  return ingredients.reduce(
    (t, i) => {
      const k = i.grams / 100;
      t.kcal += i.kcal * k;
      t.protein += i.protein * k;
      t.fat += i.fat * k;
      t.carbs += i.carbs * k;
      t.cost += ((i.pricePerKg ?? 0) * i.grams) / 1000;
      return t;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0, cost: 0 }
  );
}

// Percentuale di energia (kcal) fornita da proteine, carboidrati e grassi.
// Conversione: proteine 4 kcal/g, carboidrati 4 kcal/g, grassi 9 kcal/g.
export function macroSplit(totals) {
  const p = totals.protein * 4;
  const c = totals.carbs * 4;
  const f = totals.fat * 9;
  const sum = p + c + f;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: (p / sum) * 100,
    carbs: (c / sum) * 100,
    fat: (f / sum) * 100,
  };
}

// Somma degli scostamenti (in punti percentuali) dal target.
export function splitError(split, target) {
  return (
    Math.abs(split.protein - target.protein) +
    Math.abs(split.carbs - target.carbs) +
    Math.abs(split.fat - target.fat)
  );
}

export function validateTarget(target) {
  const sum = target.protein + target.carbs + target.fat;
  if (Math.abs(sum - 100) > 0.5) {
    throw new Error(`Il target deve sommare 100% (ora somma ${sum}%)`);
  }
  return target;
}

// Cerca la singola modifica di grammatura (un ingrediente alla volta)
// che avvicina di più la ripartizione calorica al target.
export function suggestAdjustment(ingredients, target, { maxGrams = 1000, step = 5 } = {}) {
  validateTarget(target);
  const baseError = splitError(macroSplit(nutritionTotals(ingredients)), target);
  let best = null;

  ingredients.forEach((ing, idx) => {
    for (let g = 0; g <= maxGrams; g += step) {
      if (g === ing.grams) continue;
      const trial = ingredients.map((x, j) => (j === idx ? { ...x, grams: g } : x));
      const error = splitError(macroSplit(nutritionTotals(trial)), target);
      if (!best || error < best.error) {
        best = { index: idx, name: ing.name, from: ing.grams, to: g, error };
      }
    }
  });

  if (!best || best.error >= baseError) {
    return { improved: false, baseError, error: baseError };
  }
  return { improved: true, baseError, ...best };
}
