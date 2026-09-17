import { useRouter } from "expo-router";

import { Nappi } from "@/ui/Nappi";
import { Ruutu } from "@/ui/Ruutu";
import { Tyhja } from "@/ui/Tyhja";

export default function NopeaLisays() {
  const router = useRouter();
  return (
    <Ruutu otsikko="Nopea lisäys">
      <Tyhja
        otsikko="Tulee vaiheessa 5"
        teksti="Kuva, kategoria, koko, ostohinta, hankintatapa ja tila. Sarjalisäys tulee vaiheessa 9."
      />
      <Nappi teksti="Takaisin" toissijainen onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </Ruutu>
  );
}
