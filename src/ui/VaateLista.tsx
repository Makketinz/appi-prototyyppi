import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { lukumaara } from "@/data/muotoilu";
import { JARJESTYKSET, JARJESTYS_SELITE, type Jarjestys, useVaatteet, type VaateSuodatin } from "@/data/vaatteet";
import { Ilmoitus } from "@/ui/Ilmoitus";
import { Osio } from "@/ui/Osio";
import { SiruValinta, vaihtoehdot } from "@/ui/SiruValinta";
import { valit, varit } from "@/ui/teema";
import { Tyhja } from "@/ui/Tyhja";
import { VaateRivi } from "@/ui/VaateRivi";

type Props = {
  /** Lapsi, jonka vaatteet listataan. Kysely odottaa, kunnes lapsi on ladattu. */
  lapsiId: string | undefined;
  suodatin: VaateSuodatin;
  jarjestys: Jarjestys;
  /** Jos annettu, listan yläpuolella näytetään järjestyksen valinta. */
  onJarjestys?: (jarjestys: Jarjestys) => void;
  tyhja: { otsikko: string; teksti: string };
};

/**
 * Vaatelista: yksi komponentti kaikkiin listoihin (etusivu, tilat, myöhemmin koonnit ja
 * säilytyspaikat). Yhteenveto laskee kappalemäärät yhteen, ei rivejä.
 */
export function VaateLista({ lapsiId, suodatin, jarjestys, onJarjestys, tyhja }: Props) {
  const vaatteet = useVaatteet(lapsiId, suodatin, jarjestys);
  const rivit = vaatteet.data ?? [];
  const kappaleet = rivit.reduce((summa, v) => summa + v.kappalemaara, 0);

  return (
    <View style={tyylit.kehys}>
      {onJarjestys ? (
        <Osio otsikko="Järjestys">
          <SiruValinta
            vaihtoehdot={vaihtoehdot(JARJESTYKSET, JARJESTYS_SELITE)}
            valittu={jarjestys}
            onValitse={(j) => (j ? onJarjestys(j) : undefined)}
            pakollinen
          />
        </Osio>
      ) : null}

      {vaatteet.isPending ? <ActivityIndicator color={varit.korostus} /> : null}
      {vaatteet.isError ? <Ilmoitus teksti={`Vaatteiden haku epäonnistui: ${vaatteet.error.message}`} /> : null}
      {vaatteet.isSuccess && rivit.length === 0 ? <Tyhja otsikko={tyhja.otsikko} teksti={tyhja.teksti} /> : null}

      {rivit.length > 0 ? (
        <>
          <Text style={tyylit.yhteenveto} testID="vaatelista-yhteenveto">
            {`${kappaleet} kpl · ${lukumaara(rivit.length, "rivi", "riviä")}`}
          </Text>
          <View style={tyylit.lista}>
            {rivit.map((vaate) => (
              <VaateRivi key={vaate.id} vaate={vaate} naytaTila={!suodatin.tila} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const tyylit = StyleSheet.create({
  kehys: {
    gap: valit.m,
  },
  yhteenveto: {
    fontSize: 14,
    color: varit.tekstiHimmea,
  },
  lista: {
    gap: valit.s,
  },
});
