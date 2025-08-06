<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Vaša košarica</div>
    </div>

    <q-table
      :rows="kosarica"
      :columns="columns"
      row-key="naziv_artikla"
      flat
      bordered
      v-if="kosarica.length"
      class="q-mb-md"
    >
      <template v-slot:body-cell-ukloni="props">
        <q-td :props="props">
          <q-btn
            dense
            flat
            color="negative"
            icon="delete"
            @click="ukloniArtikl(props.row.naziv_artikla)"
          />
        </q-td>
      </template>
    </q-table>

    <div v-else class="text-subtitle1 q-mt-md">Košarica je prazna.</div>

    <div v-if="kosarica.length" class="text-h6">Ukupno: {{ ukupnaCijena }} €</div>

    <q-btn
      v-if="kosarica.length && !prikaziDatum"
      label="Potvrdi narudžbu"
      color="primary"
      class="q-mt-md"
      @click="prikaziDatum = true"
    />

    <q-slide-transition>
      <div v-show="prikaziDatum" class="q-mt-md column q-gutter-md">
        <q-input
          filled
          v-model="datumIznajmljivanja"
          label="Datum početka iznajmljivanja"
          mask="####-##-##"
          readonly
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="datumIznajmljivanja" :min="minDatum" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-input filled v-model="datumVracanja" label="Datum vraćanja" mask="####-##-##" readonly>
          <template v-slot:append>
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

    const ukupnaCijena = computed(() => {
      return kosarica.value
        .reduce((ukupno, artikal) => ukupno + artikal.cijena_dan * artikal.kolicina, 0)
        .toFixed(2)
    })

    const loadKosarica = () => {
      const spremljeno = localStorage.getItem('kosarica')
      kosarica.value = spremljeno ? JSON.parse(spremljeno) : []
    }

    const ukloniArtikl = (naziv) => {
      kosarica.value = kosarica.value.filter((item) => item.naziv_artikla !== naziv)
      localStorage.setItem('kosarica', JSON.stringify(kosarica.value))
      alert('Artikl uklonjen iz košarice')
    }

    const lokacijaNarudzbe = computed(() => {
      if (kosarica.value.length === 0) return null
      const prva = kosarica.value[0].naziv_lokacije
      const sveIste = kosarica.value.every((item) => item.naziv_lokacije === prva)
      return sveIste ? prva : null
    })

    const sifraLok = computed(() => {
      if (kosarica.value.length === 0) return null
      const sifra = kosarica.value[0].sifra_lokacije
      return sifra
    })

    const pokreniPlacanje = async (nacin) => {
      try {
        const userRes = await axios.get('http://localhost:3000/api/check', {
          withCredentials: true,
        })
        if (!lokacijaNarudzbe.value) {
          alert('Svi artikli u košarici moraju biti s iste lokacije.')
          return
        }
        if (userRes.data.loggedIn == false) {
          alert('Morate biti prijavljeni za narudžbu')
          router.push('/main/login')
          return
        }

        await axios.post(
          'http://localhost:3000/api/narudzba',
          {
            stavke: kosarica.value,
            nacinPlacanja: odabirPlacanja.value,
            datumIznajmljivanja: datumIznajmljivanja.value,
            datumVracanja: datumVracanja.value,
            lokacija: lokacijaNarudzbe.value,
            sifraLokacije: sifraLok.value,
            ukupnaCijena: ukupnaCijena.value,
          },
          { withCredentials: true },
        )

        localStorage.removeItem('kosarica')
        kosarica.value = []

        if (nacin === 'Kartica') {
          alert('Biti ćete preusmjereni na stranicu banke!')
          router.push('/dashboard')
        } else if (nacin === 'Gotovina') {
          alert('Naplata će se izvršiti na lokaciji!')
          router.push('/dashboard')
        }
      } catch (err) {
        console.error(err)
        alert('Greška pri slanju narudžbe')
      }
    }

    onMounted(() => {
      loadKosarica()
    })

    return {
      kosarica,
      columns,
      ukupnaCijena,
      ukloniArtikl,
      prikaziPlacanje,
      odabirPlacanja,
      pokreniPlacanje,
      minDatum,
      datumVracanja,
      prikaziDatum,
      datumIznajmljivanja,
    }
  },
}
</script>
