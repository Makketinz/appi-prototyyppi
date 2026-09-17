// Yhteiset värit ja mitat. Yksi paikka, jotta näkymät pysyvät yhtenäisinä.
export const varit = {
  tausta: "#F6F5F2",
  pinta: "#FFFFFF",
  reuna: "#E2DFD9",
  teksti: "#1F1D1A",
  tekstiHimmea: "#6E6A63",
  korostus: "#2F6F5E",
  korostusTeksti: "#FFFFFF",
  virhe: "#B3261E",
  virheTausta: "#FCEBEA",
} as const;

export const valit = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
} as const;

export const sateet = {
  s: 8,
  m: 12,
  l: 20,
} as const;

// Mobiilinäkymän enimmäisleveys selaimessa, jotta prototyyppi näyttää sovellukselta.
export const RUUDUN_MAX_LEVEYS = 480;
export const ALAPALKIN_KORKEUS = 64;
