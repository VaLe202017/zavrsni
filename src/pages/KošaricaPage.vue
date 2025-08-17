<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Vaša košarica</div>
    </div>

    <q-table
      v-if="kosarica.length"
      :rows="kosarica"
      :columns="columns"
      row-key="sifra_artikla"
      flat
      bordered
      class="q-mb-md"
    >
      <template #body-cell-ukloni="props">
        <q-td :props="props">
          <q-btn
            dense
            flat
            color="negative"
            icon="delete"
            @click="ukloniArtikl(props.row.sifra_artikla)"
          />
        </q-td>
      </template>
    </q-table>

    <div v-else class="text-subtitle1 q-mt-md">Košarica je prazna.</div>

    <div v-if="kosarica.length" class="q-mt-sm">
      <div class="text-subtitle2">
        Trajanje: <b>{{ brojDana }}</b> dan(a)
      </div>
      <div class="text-h6">
        Ukupno: <b>{{ ukupnaCijenaZaPeriod }} €</b>
      </div>
    </div>

    <q-btn
      v-if="kosarica.length && !prikaziDatum"
      label="Potvrdi narudžbu"
      color="primary"
      class="q-mt-md"
      @click="prikaziDatum = true"
    />

    <!-- KORAK 1: Datumi -->
    <q-slide-transition>
      <div v-show="prikaziDatum" class="q-mt-md column q-gutter-md">
        <q-input
          filled
          v-model="datumIznajmljivanja"
          label="Datum početka iznajmljivanja"
          mask="####-##-##"
          readonly
          :rules="[(v) => !!v || 'Obavezno']"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="datumIznajmljivanja" :min="minDatum" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-input
          filled
          v-model="datumVracanja"
          label="Datum vraćanja"
          mask="####-##-##"
          readonly
          :rules="[(v) => !!v || 'Obavezno']"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="datumVracanja" :min="datumIznajmljivanja || minDatum" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-btn
          label="Nastavi na plaćanje"
          color="secondary"
          class="q-mt-sm"
          :disable="!datumIznajmljivanja || !datumVracanja"
          @click="prikaziPlacanje = true"
        />
      </div>
    </q-slide-transition>

    <!-- KORAK 2: Plaćanje -->
    <q-slide-transition>
      <div v-show="prikaziPlacanje" class="q-mt-md">
        <q-select
          filled
          v-model="odabirPlacanja"
          label="Odaberite način plaćanja"
          :options="['Gotovina', 'Kartica']"
          @update:model-value="pokreniPlacanje"
        />
      </div>
    </q-slide-transition>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'KosaricaPage',
  setup() {
    const router = useRouter()

    const kosarica = ref([])
    const prikaziDatum = ref(false)
    const prikaziPlacanje = ref(false)
    const odabirPlacanja = ref(null)
    const datumVracanja = ref('')
    const datumIznajmljivanja = ref('')

    const minDatum = computed(() => {
      const today = new Date()
      return today.toISOString().split('T')[0]
    })

    const columns = [
      { name: 'naziv_artikla', label: 'Naziv artikla', field: 'naziv_artikla', align: 'left' },
      { name: 'kolicina', label: 'Količina', field: 'kolicina', align: 'center' },
      { name: 'cijena_dan', label: 'Cijena po danu (€)', field: 'cijena_dan', align: 'center' },
      { name: 'naziv_lokacije', label: 'Lokacija', field: 'naziv_lokacije', align: 'center' },
      { name: 'adresa_lokacije', label: 'Adresa', field: 'adresa_lokacije', align: 'center' },
      { name: 'ukloni', label: '', align: 'center' },
    ]

    const brojDana = computed(() => {
      if (!datumIznajmljivanja.value || !datumVracanja.value) return 1
      const start = new Date(datumIznajmljivanja.value + 'T00:00:00')
      const end = new Date(datumVracanja.value + 'T00:00:00')
      const diffMs = end - start
      if (diffMs < 0) return 1
      const d = Math.round(diffMs / (1000 * 60 * 60 * 24))
      return Math.max(1, d) // isti dan = 1
    })

    const ukupnaCijena = computed(() => {
      return kosarica.value.reduce(
        (ukupno, a) => ukupno + Number(a.cijena_dan) * Number(a.kolicina || 1),
        0,
      )
    })

    const ukupnaCijenaZaPeriod = computed(() => (ukupnaCijena.value * brojDana.value).toFixed(2))

    const loadKosarica = () => {
      const spremljeno = localStorage.getItem('kosarica')
      kosarica.value = spremljeno ? JSON.parse(spremljeno) : []
    }

    const ukloniArtikl = (sifraArtikla) => {
      kosarica.value = kosarica.value.filter((item) => item.sifra_artikla !== sifraArtikla)
      localStorage.setItem('kosarica', JSON.stringify(kosarica.value))
      alert('Artikl uklonjen iz košarice')
    }

    const lokacijaNarudzbe = computed(() => {
      if (!kosarica.value.length) return null
      const prva = kosarica.value[0].sifra_lokacije
      const sveIste = kosarica.value.every((item) => item.sifra_lokacije === prva)
      return sveIste ? prva : null
    })

    const sifraLok = computed(() => {
      if (!kosarica.value.length) return null
      return kosarica.value[0].sifra_lokacije ?? null
    })

    const pokreniPlacanje = async () => {
      try {
        // 0) validacije
        if (!lokacijaNarudzbe.value) {
          alert('Svi artikli u košarici moraju biti s iste lokacije.')
          return
        }
        const userRes = await axios.get('http://localhost:3000/api/check', {
          withCredentials: true,
        })
        if (!userRes.data.loggedIn) {
          alert('Morate biti prijavljeni za narudžbu')
          router.push('/main/login')
          return
        }
        if (!datumIznajmljivanja.value || !datumVracanja.value) {
          alert('Molimo odaberite datume iznajmljivanja i vraćanja.')
          return
        }
        if (!odabirPlacanja.value) {
          alert('Molimo odaberite način plaćanja.')
          return
        }

        // 1) pripremi stavke
        const stavkePayload = kosarica.value.map((a) => ({
          sifra_artikla: Number(a.sifra_artikla),
          kolicina: Number(a.kolicina || 1),
        }))
        if (stavkePayload.some((s) => !Number.isFinite(s.sifra_artikla))) {
          alert('Greška: neki artikli nemaju sifra_artikla u košarici.')
          return
        }

        // 2) KREIRAJ NARUDŽBU (vrati narudzbaId)
        const respNar = await axios.post(
          'http://localhost:3000/api/narudzbe',
          {
            // backend ti trenutno traži i stavke u bodyju radi validacije “Košarica je prazna”
            stavke: stavkePayload,

            // pošalji snake_case da sigurno pogodiš backend
            nacin_placanja: odabirPlacanja.value,
            datumIznajmljivanja: datumIznajmljivanja.value,
            datumVracanja: datumVracanja.value,
            sifraLokacije: sifraLok.value,

            // ovo će svakako biti ponovno izračunato nakon dodavanja stavki,
            // ali pošaljemo informativno da prođe validacija ako je koristiš
            ukupnaCijena: Number(ukupnaCijenaZaPeriod.value),
          },
          { withCredentials: true },
        )

        const narudzbaId = respNar.data?.narudzbaId || respNar.data?.sifra_narudzbe
        if (!Number.isFinite(narudzbaId)) {
          alert('Greška: nije vraćen ID narudžbe.')
          return
        }

        // 3) DODAJ STAVKE U POSTOJEĆU NARUDŽBU
        const respSt = await axios.post(
          `http://localhost:3000/api/narudzba/${narudzbaId}/stavke`,
          {
            stavke: stavkePayload,
          },
          { withCredentials: true },
        )

        if (respSt.data?.success) {
          localStorage.removeItem('kosarica')
          kosarica.value = []
          alert('Narudžba uspješno spremljena!')
          router.push('/dashboard')
        } else {
          alert('Nešto je pošlo po zlu pri spremanju stavki narudžbe.')
        }
      } catch (err) {
        console.error(err)
        const msg = err?.response?.data?.error || 'Greška pri slanju narudžbe'
        alert(msg)
      }
    }

    onMounted(loadKosarica)

    return {
      // state
      kosarica,
      prikaziDatum,
      prikaziPlacanje,
      odabirPlacanja,
      datumVracanja,
      datumIznajmljivanja,

      // table
      columns,

      // computed
      minDatum,
      brojDana,
      ukupnaCijenaZaPeriod,

      // methods
      ukloniArtikl,
      pokreniPlacanje,
    }
  },
}
</script>
