import assert from "node:assert/strict";
import test from "node:test";
import { expensePaceHint, scoreFor, scoreLabel, signedWholePercent } from "./health-utils";

test("el +187% de las tarjetas se lee casi 3 veces más", () => {
  const previous = 100;
  const current = 287;
  const changePercent = ((current - previous) / previous) * 100;
  assert.equal(Math.round(changePercent), 187);
  assert.equal(signedWholePercent(changePercent), "+187%");
  assert.equal(expensePaceHint(current, previous), "casi 3 veces más");
});

test("la pista no inventa un porcentaje cuando no hay mes anterior", () => {
  assert.equal(expensePaceHint(80_000, 0), "Mes calendario");
  assert.equal(signedWholePercent(0), "0%");
  assert.equal(expensePaceHint(200, 100), "2 veces más");
  assert.equal(expensePaceHint(100, 100), "igual que el mes anterior");
  assert.equal(expensePaceHint(80, 100), "menos que el mes anterior");
});

test("65% del sueldo sigue siendo salud 70, Buena", () => {
  assert.equal(scoreFor(65), 70);
  assert.equal(scoreLabel(70), "Buena");
  assert.equal(scoreLabel(scoreFor(100)), "Crítica");
  assert.equal(scoreLabel(scoreFor(0)), "Excelente");
});
