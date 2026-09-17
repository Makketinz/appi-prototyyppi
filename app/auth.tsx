import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { kirjaudu, rekisteroidy } from "@/data/AuthProvider";
import { Ilmoitus } from "@/ui/Ilmoitus";
import { Kentta } from "@/ui/Kentta";
import { Nappi } from "@/ui/Nappi";
import { Ruutu } from "@/ui/Ruutu";
import { valit, varit } from "@/ui/teema";

type Tila = "kirjaudu" | "luo";

export default function Kirjautuminen() {
  const [tila, asetaTila] = useState<Tila>("kirjaudu");
  const [sahkoposti, asetaSahkoposti] = useState("");
  const [salasana, asetaSalasana] = useState("");
  const [virhe, asetaVirhe] = useState<string | null>(null);
  const [tieto, asetaTieto] = useState<string | null>(null);
  const [odottaa, asetaOdottaa] = useState(false);

  const luomassa = tila === "luo";

  function vaihdaTila(uusi: Tila) {
    asetaTila(uusi);
    asetaVirhe(null);
    asetaTieto(null);
  }

  function tarkista(): string | null {
    if (!sahkoposti.trim().includes("@")) return "Anna sähköpostiosoite.";
    if (salasana.length < 6) return "Salasanan pitää olla vähintään 6 merkkiä.";
    return null;
  }

  async function laheta() {
    const puute = tarkista();
    if (puute) {
      asetaVirhe(puute);
      return;
    }
    asetaVirhe(null);
    asetaTieto(null);
    asetaOdottaa(true);
    try {
      if (luomassa) {
        const tulos = await rekisteroidy(sahkoposti, salasana);
        if ("virhe" in tulos) {
          asetaVirhe(tulos.virhe);
        } else if (tulos.vahvistusTarvitaan) {
          asetaTieto(
            `Lähetimme vahvistuslinkin osoitteeseen ${sahkoposti.trim()}. Avaa linkki ja kirjaudu sen jälkeen sisään.`,
          );
          asetaTila("kirjaudu");
        }
        // Jos sessio syntyi heti, AuthProvider ohjaa eteenpäin.
      } else {
        const v = await kirjaudu(sahkoposti, salasana);
        if (v) asetaVirhe(v);
      }
    } finally {
      asetaOdottaa(false);
    }
  }

  return (
    <Ruutu otsikko="Lastenvaatteet">
      <Text style={tyylit.kuvaus}>
        Digitaalinen vaatevarasto: mitä on käytössä, mitä jemmassa ja missä laatikossa.
      </Text>

      <View style={tyylit.valitsin}>
        <Nappi teksti="Kirjaudu" toissijainen={luomassa} onPress={() => vaihdaTila("kirjaudu")} />
        <Nappi teksti="Luo tili" toissijainen={!luomassa} onPress={() => vaihdaTila("luo")} />
      </View>

      <Kentta
        otsikko="Sähköposti"
        value={sahkoposti}
        onChangeText={asetaSahkoposti}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="nimi@esimerkki.fi"
      />
      <Kentta
        otsikko="Salasana"
        value={salasana}
        onChangeText={asetaSalasana}
        secureTextEntry
        autoComplete={luomassa ? "new-password" : "current-password"}
        textContentType={luomassa ? "newPassword" : "password"}
        placeholder="vähintään 6 merkkiä"
        onSubmitEditing={laheta}
      />

      {virhe ? <Ilmoitus teksti={virhe} /> : null}
      {tieto ? <Ilmoitus teksti={tieto} tyyppi="tieto" /> : null}

      <Nappi teksti={luomassa ? "Luo tili" : "Kirjaudu sisään"} onPress={laheta} odottaa={odottaa} />

      {luomassa ? (
        <Text style={tyylit.pienteksti}>
          Tilin luonti perustaa perheen, johon lapsi ja vaatteet kuuluvat. Seuraavaksi kysytään lapsen nimi.
        </Text>
      ) : null}
    </Ruutu>
  );
}

const tyylit = StyleSheet.create({
  kuvaus: {
    fontSize: 15,
    lineHeight: 22,
    color: varit.tekstiHimmea,
  },
  valitsin: {
    flexDirection: "row",
    gap: valit.s,
  },
  pienteksti: {
    fontSize: 13,
    lineHeight: 18,
    color: varit.tekstiHimmea,
  },
});
