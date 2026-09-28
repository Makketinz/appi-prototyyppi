// Yksikkötestit lomakkeiden jäsennykselle ja muotoilulle. Ajo: npm test
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  hintaKentaksi,
  jasennaHinta,
  jasennaKappalemaara,
  jasennaPaiva,
  lukumaara,
  muotoileHinta,
  muotoilePaiva,
  tanaanIso,
  tekstiTaiNull,
} from "../src/data/muotoilu.ts";

// Intl käyttää euron edessä sitovaa välilyöntiä; vertailu tavallisella välilyönnillä.
const tavallinen = (s: string) => s.replace(/\s/g, " ");

describe("hinta", () => {
  test("muotoilu euroiksi", () => {
    assert.equal(tavallinen(muotoileHinta(4.5)), "4,50 €");
    assert.equal(tavallinen(muotoileHinta(0)), "0,00 €");
    assert.equal(muotoileHinta(null), "");
  });

  test("lomakkeen kenttään", () => {
    assert.equal(hintaKentaksi(4.5), "4,50");
    assert.equal(hintaKentaksi(12), "12");
    assert.equal(hintaKentaksi(null), "");
  });

  test("jäsennys hyväksyy pilkun, pisteen, euromerkin ja välilyönnit", () => {
    assert.deepEqual(jasennaHinta("4,50"), { ok: true, arvo: 4.5 });
    assert.deepEqual(jasennaHinta("4.5"), { ok: true, arvo: 4.5 });
    assert.deepEqual(jasennaHinta(" 12 € "), { ok: true, arvo: 12 });
    assert.deepEqual(jasennaHinta("1 200,00"), { ok: true, arvo: 1200 });
    assert.deepEqual(jasennaHinta("0"), { ok: true, arvo: 0 });
  });

  test("tyhjä hinta on null", () => {
    assert.deepEqual(jasennaHinta(""), { ok: true, arvo: null });
    assert.deepEqual(jasennaHinta("   "), { ok: true, arvo: null });
  });

  test("virheelliset hinnat hylätään", () => {
    for (const syote of ["abc", "-5", "4,555", "1,2,3", "123456789"]) {
      assert.equal(jasennaHinta(syote).ok, false, syote);
    }
  });
});

describe("päivämäärä", () => {
  test("muotoilu suomalaiseksi", () => {
    assert.equal(muotoilePaiva("2026-09-07"), "7.9.2026");
    assert.equal(muotoilePaiva(null), "");
  });

  test("jäsennys suomalaisesta ja ISO-muodosta", () => {
    assert.deepEqual(jasennaPaiva("17.9.2026"), { ok: true, arvo: "2026-09-17" });
    assert.deepEqual(jasennaPaiva("07.09.2026"), { ok: true, arvo: "2026-09-07" });
    assert.deepEqual(jasennaPaiva("1.2.26"), { ok: true, arvo: "2026-02-01" });
    assert.deepEqual(jasennaPaiva("2026-09-17"), { ok: true, arvo: "2026-09-17" });
    assert.deepEqual(jasennaPaiva(" 29.2.2028 "), { ok: true, arvo: "2028-02-29" });
  });

  test("tyhjä päivämäärä on null", () => {
    assert.deepEqual(jasennaPaiva(""), { ok: true, arvo: null });
  });

  test("olemattomat ja väärän muotoiset päivät hylätään", () => {
    for (const syote of ["31.2.2026", "29.2.2027", "0.1.2026", "1.13.2026", "17/9/2026", "eilen", "1.1.1850"]) {
      assert.equal(jasennaPaiva(syote).ok, false, syote);
    }
  });

  test("tämä päivä paikallisena päivänä", () => {
    assert.equal(tanaanIso(new Date(2026, 8, 7, 23, 59)), "2026-09-07");
    assert.equal(tanaanIso(new Date(2026, 0, 1, 0, 1)), "2026-01-01");
  });
});

describe("kappalemäärä", () => {
  test("kokonaisluvut 1–999 kelpaavat", () => {
    assert.deepEqual(jasennaKappalemaara("1"), { ok: true, arvo: 1 });
    assert.deepEqual(jasennaKappalemaara(" 12 "), { ok: true, arvo: 12 });
    assert.deepEqual(jasennaKappalemaara("999"), { ok: true, arvo: 999 });
  });

  test("nolla, desimaalit ja tyhjä hylätään", () => {
    for (const syote of ["0", "", "1,5", "-2", "1000", "kaksi"]) {
      assert.equal(jasennaKappalemaara(syote).ok, false, syote);
    }
  });
});

describe("teksti ja lukumäärä", () => {
  test("tyhjä teksti on null, reunat siistitään", () => {
    assert.equal(tekstiTaiNull("  "), null);
    assert.equal(tekstiTaiNull(" Sininen haalari "), "Sininen haalari");
  });

  test("yksikkö ja monikko", () => {
    assert.equal(lukumaara(1, "rivi", "riviä"), "1 rivi");
    assert.equal(lukumaara(3, "rivi", "riviä"), "3 riviä");
    assert.equal(lukumaara(0, "rivi", "riviä"), "0 riviä");
  });
});
