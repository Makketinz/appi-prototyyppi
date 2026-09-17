import { Ruutu } from "@/ui/Ruutu";
import { Tyhja } from "@/ui/Tyhja";

export default function Etusivu() {
  return (
    <Ruutu otsikko="Etusivu">
      <Tyhja
        otsikko="Ei vielä vaatteita"
        teksti="Haku, suodattimet ja tilakortit lukumäärineen tulevat vaiheessa 8. Lisää ensimmäinen vaate + -napista, kun lisäys on valmis (vaihe 5)."
      />
    </Ruutu>
  );
}
