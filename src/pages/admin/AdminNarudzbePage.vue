<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija narudžbi</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajSve" />
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj narudžbu" />
      <q-tab name="edit" label="Uredi narudžbu" />
      <q-tab name="delete" label="Brisanje narudžbe" />
    </q-tabs>

    <!-- =============== DODAJ =============== -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select
            filled
            v-model="nova.sifra_korisnika"
            :options="korisnikOpcije"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Korisnik"
            :rules="[(v) => !!v || 'Obavezno']"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            filled
            v-model="nova.sifra_lokacije"
            :options="lokacijaOpcije"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Lokacija"
            :rules="[(v) => !!v || 'Obavezno']"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            v-model="nova.datum_iznajmljivanja"
            label="Datum početka"
            mask="####-##-##"
            readonly
            :rules="[(v) => !!v || 'Obavezno']"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="nova.datum_iznajmljivanja" :min="minDatum" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            v-model="nova.datum_vracanja"
            label="Datum vraćanja"
            mask="####-##-##"
            readonly
            :rules="[(v) => !!v || 'Obavezno']"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="nova.datum_vracanja"
                    :min="nova.datum_iznajmljivanja || minDatum"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-6">
          <q-select
            filled
            v-model="nova.nacin_placanja"
            :options="['Gotovina', 'Kartica']"
            label="Način plaćanja"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            type="number"
            min="0"
            step="0.01"
            v-model.number="nova.ukupan_iznos"
            label="Ukupan iznos (€) – po potrebi ručno"
          />
        </div>

        <div class="col-12">
          <q-btn color="primary" icon="add" label="Kreiraj narudžbu" @click="dodajNarudzbu" />
        </div>
      </div>
    </div>

    <!-- =============== UREDI =============== -->
    <div v-if="tab === 'edit'">
      <q-input
        dense
        outlined
        v-model="filter"
        label="Filtriraj (kupac, email, lokacija...)"
        class="q-mb-sm"
        clearable
      />
      <q-table
        title="Narudžbe"
        :rows="filtriraneNarudzbe"
        :columns="narColumns"
        row-key="sifra_narudzbe"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
        @row-click="(_, row) => odaberiNarudzbu(row)"
      >
        <template #body-cell-kupac="props">
          <q-td :props="props">
            {{ props.row.ime_korisnika }} {{ props.row.prezime_korisnika }}
            <div class="text-caption text-grey-7">{{ props.row.email_korisnika }}</div>
          </q-td>
        </template>
        <template #body-cell-lokacija="props">
          <q-td :props="props">
            {{ props.row.naziv_lokacije }}
            <div class="text-caption text-grey-7">{{ props.row.adresa_lokacije }}</div>
          </q-td>
        </template>
        <template #body-cell-ukupan_iznos="props">
          <q-td :props="props">{{ Number(props.row.ukupan_iznos || 0).toFixed(2) }} €</q-td>
        </template>
      </q-table>

      <!-- FORM ispod tablice -->
      <div v-if="uredi.sifra_narudzbe" class="q-gutter-md q-mt-md">
        <div class="row items-center justify-between">
          <div class="text-subtitle1">Uređivanje narudžbe #{{ uredi.sifra_narudzbe }}</div>
          <div>
            <q-btn
              color="secondary"
              icon="save"
              label="Spremi promjene"
              class="q-mr-sm"
              @click="spremiNarudzbu"
            />
            <q-btn color="negative" icon="delete" label="Obriši" flat @click="obrisiNarudzbu" />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              filled
              v-model="uredi.sifra_korisnika"
              :options="korisnikOpcije"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Korisnik"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              filled
              v-model="uredi.sifra_lokacije"
              :options="lokacijaOpcije"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Lokacija"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              filled
              v-model="uredi.datum_iznajmljivanja"
              label="Početak"
              mask="####-##-##"
              readonly
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="uredi.datum_iznajmljivanja" :min="minDatum" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              filled
              v-model="uredi.datum_vracanja"
              label="Vraćanje"
              mask="####-##-##"
              readonly
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="uredi.datum_vracanja"
                      :min="uredi.datum_iznajmljivanja || minDatum"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              filled
              v-model="uredi.nacin_placanja"
              :options="['Gotovina', 'Kartica']"
              label="Način plaćanja"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              filled
              label="Ukupan iznos (€)"
              :model-value="ukupanIznosIzracun"
              readonly
              hint="Zbroj cijena stavki × broj dana"
            />
            <div class="text-caption text-grey-7">
              Broj dana: <b>{{ brojDana }}</b>
            </div>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <div class="text-subtitle2 q-mb-sm">Stavke narudžbe</div>

        <q-table
          :rows="stavkeNarudzbe"
          :columns="stavkeColumns"
          row-key="sifra_artikla_narudzbe"
          flat
          bordered
          dense
        >
          <template #body-cell-cijena_dan="props">
            <q-td :props="props">{{ Number(props.row.cijena_dan).toFixed(2) }} €</q-td>
          </template>
          <template #body-cell-ukloni="props">
            <q-td :props="props">
              <q-btn dense flat color="negative" icon="delete" @click="obrisiStavku(props.row)" />
            </q-td>
          </template>
        </q-table>

        <div class="row q-col-gutter-md q-mt-md items-end">
          <div class="col-12 col-md-8">
            <q-select
              filled
              v-model="novaStavka.sifra_artikla"
              :options="artiklOpcije"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Odaberi artikl"
            />
          </div>
          <div class="col-6 col-md-2">
            <q-input
              filled
              type="number"
              min="1"
              v-model.number="novaStavka.kolicina"
              label="Količina"
            />
          </div>
          <div class="col-6 col-md-2">
            <q-btn color="primary" icon="add" label="Dodaj" @click="dodajStavke" />
          </div>
        </div>
      </div>

      <div v-else class="text-grey-7 q-mt-md">Odaberite narudžbu za uređivanje.</div>
    </div>

    <!-- =============== BRIŠI =============== -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <q-input dense outlined v-model="filter" label="Filtriraj..." class="q-mb-sm" clearable />
      <q-list bordered separator>
        <q-item
          v-for="n in filtriraneNarudzbe"
          :key="n.sifra_narudzbe"
          clickable
          @click="potvrdiBrisanje(n)"
        >
          <q-item-section>
            <div class="text-body2">
              #{{ n.sifra_narudzbe }} — {{ n.ime_korisnika }} {{ n.prezime_korisnika }}
              <span class="text-caption text-grey-7"> ({{ n.email_korisnika }})</span>
            </div>
            <div class="text-caption">
              {{ n.naziv_lokacije }} • {{ Number(n.ukupan_iznos || 0).toFixed(2) }} €
            </div>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat color="negative" icon="delete" @click.stop="potvrdiBrisanje(n)" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

export default {
  name: 'AdminNarudzbePage',
  setup() {
    const tab = ref('edit')

    const narudzbe = ref([])
    const stavkeNarudzbe = ref([])
    const korisnici = ref([])
    const lokacije = ref([])
    const artikli = ref([])

    const filter = ref('')

    const uredi = ref({})
    const nova = ref({
      sifra_korisnika: null,
      sifra_lokacije: null,
      datum_iznajmljivanja: '',
      datum_vracanja: '',
      nacin_placanja: 'Gotovina',
      ukupan_iznos: 0,
    })
    const novaStavka = ref({ sifra_artikla: null, kolicina: 1 })

    const minDatum = computed(() => new Date().toISOString().split('T')[0])

    const narColumns = [
      { name: 'sifra_narudzbe', label: 'ID', field: 'sifra_narudzbe', align: 'left' },
      {
        name: 'kupac',
        label: 'Kupac',
        field: (r) => `${r.ime_korisnika} ${r.prezime_korisnika}`,
        align: 'left',
      },
      {
        name: 'email_korisnika',
        label: 'Email',
        field: 'email_korisnika',
        align: 'left',
        classes: 'text-caption',
      },
      { name: 'lokacija', label: 'Lokacija', field: (r) => r.naziv_lokacije, align: 'left' },
      {
        name: 'datum_iznajmljivanja',
        label: 'Početak',
        field: 'datum_iznajmljivanja',
        align: 'left',
      },
      { name: 'datum_vracanja', label: 'Vraćanje', field: 'datum_vracanja', align: 'left' },
      {
        name: 'ukupan_iznos',
        label: 'Iznos (€)',
        field: (r) => Number(r.ukupan_iznos || 0).toFixed(2),
        align: 'right',
      },
    ]

    const stavkeColumns = [
      {
        name: 'sifra_artikla_narudzbe',
        label: 'ID stavke',
        field: 'sifra_artikla_narudzbe',
        align: 'left',
      },
      { name: 'sifra_artikla', label: 'Šifra artikla', field: 'sifra_artikla', align: 'left' },
      { name: 'naziv_artikla', label: 'Naziv', field: 'naziv_artikla', align: 'left' },
      { name: 'cijena_dan', label: 'Cijena/dan (€)', field: 'cijena_dan', align: 'right' },
      { name: 'ukloni', label: '', align: 'center' },
    ]

    const korisnikOpcije = computed(() =>
      korisnici.value.map((k) => ({
        value: k.sifra_korisnika,
        label: `${k.ime_korisnika} ${k.prezime_korisnika} (${k.email_korisnika})`,
      })),
    )
    const lokacijaOpcije = computed(() =>
      lokacije.value.map((l) => ({
        value: l.sifra_lokacije,
        label: `${l.naziv_lokacije} (${l.adresa_lokacije})`,
      })),
    )
    const artiklOpcije = computed(() =>
      artikli.value.map((a) => ({
        value: a.sifra_artikla,
        label: `${a.naziv_artikla} — ${Number(a.cijena_dan).toFixed(2)} €`,
      })),
    )

    const filtriraneNarudzbe = computed(() => {
      const q = (filter.value || '').toLowerCase().trim()
      if (!q) return narudzbe.value
      return narudzbe.value.filter(
        (n) =>
          `${n.ime_korisnika} ${n.prezime_korisnika}`.toLowerCase().includes(q) ||
          (n.email_korisnika || '').toLowerCase().includes(q) ||
          (n.naziv_lokacije || '').toLowerCase().includes(q) ||
          String(n.sifra_narudzbe).includes(q),
      )
    })

    const brojDana = computed(() => {
      if (!uredi.value.datum_iznajmljivanja || !uredi.value.datum_vracanja) return 1
      const s = new Date(uredi.value.datum_iznajmljivanja + 'T00:00:00')
      const e = new Date(uredi.value.datum_vracanja + 'T00:00:00')
      const diff = e - s
      if (diff < 0) return 1
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)))
    })
    const ukupanIznosIzracun = computed(() => {
      const suma = stavkeNarudzbe.value.reduce((acc, s) => acc + Number(s.cijena_dan || 0), 0)
      return (suma * brojDana.value).toFixed(2)
    })

    // API
    const ucitajNarudzbe = async () => {
      const res = await axios.get('http://localhost:3000/api/narudzbe', { withCredentials: true })
      narudzbe.value = res.data
    }
    const ucitajKorisnike = async () => {
      const res = await axios.get('http://localhost:3000/api/svi-korisnici', {
        withCredentials: true,
      })
      korisnici.value = res.data
    }
    const ucitajLokacije = async () => {
      const res = await axios.get('http://localhost:3000/api/lokacije', { withCredentials: true })
      lokacije.value = res.data
    }
    const ucitajArtikle = async () => {
      const res = await axios.get('http://localhost:3000/api/svi-artikli', {
        withCredentials: true,
      })
      artikli.value = res.data
    }
    const ucitajStavke = async (sifraNar) => {
      const res = await axios.get(`http://localhost:3000/api/stavke-narudzbe/${sifraNar}`, {
        withCredentials: true,
      })
      stavkeNarudzbe.value = res.data
    }
    const ucitajSve = async () => {
      try {
        await Promise.all([ucitajNarudzbe(), ucitajKorisnike(), ucitajLokacije(), ucitajArtikle()])
        if (uredi.value.sifra_narudzbe) await ucitajStavke(uredi.value.sifra_narudzbe)
      } catch (e) {
        console.error(e)
        alert('Greška pri dohvaćanju podataka')
      }
    }

    const dodajNarudzbu = async () => {
      try {
        const payload = {
          sifra_korisnika: nova.value.sifra_korisnika,
          sifra_lokacije: nova.value.sifra_lokacije,
          datum_iznajmljivanja: nova.value.datum_iznajmljivanja,
          datum_vracanja: nova.value.datum_vracanja,
          ukupan_iznos: Number(nova.value.ukupan_iznos || 0),
          nacin_placanja: nova.value.nacin_placanja,
        }
        const res = await axios.post('http://localhost:3000/api/narudzba', payload, {
          withCredentials: true,
        })
        alert('Narudžba dodana')
        await ucitajNarudzbe()
        // auto-prebaci na Uredi i selektiraj novu
        const id = res.data?.sifra_narudzbe
        tab.value = 'edit'
        const row = narudzbe.value.find((n) => n.sifra_narudzbe === id) || narudzbe.value[0]
        if (row) await odaberiNarudzbu(row)
        // reset ADD
        nova.value = {
          sifra_korisnika: null,
          sifra_lokacije: null,
          datum_iznajmljivanja: '',
          datum_vracanja: '',
          nacin_placanja: 'Gotovina',
          ukupan_iznos: 0,
        }
      } catch (e) {
        console.error(e)
        alert(e?.response?.data?.error || 'Greška pri dodavanju narudžbe')
      }
    }

    const odaberiNarudzbu = async (nar) => {
      uredi.value = {
        sifra_narudzbe: nar.sifra_narudzbe,
        sifra_korisnika: nar.sifra_korisnika,
        sifra_lokacije: nar.sifra_lokacije,
        datum_iznajmljivanja: (nar.datum_iznajmljivanja || '').substring(0, 10),
        datum_vracanja: (nar.datum_vracanja || '').substring(0, 10),
        nacin_placanja: nar.nacin_placanja || 'Gotovina',
      }
      await ucitajStavke(nar.sifra_narudzbe)
    }

    const spremiNarudzbu = async () => {
      try {
        const payload = {
          sifra_korisnika: uredi.value.sifra_korisnika,
          sifra_lokacije: uredi.value.sifra_lokacije,
          datum_iznajmljivanja: uredi.value.datum_iznajmljivanja,
          datum_vracanja: uredi.value.datum_vracanja,
          ukupan_iznos: Number(ukupanIznosIzracun.value),
          nacin_placanja: uredi.value.nacin_placanja,
        }
        await axios.put(
          `http://localhost:3000/api/narudzba/${uredi.value.sifra_narudzbe}`,
          payload,
          { withCredentials: true },
        )
        alert('Narudžba spremljena')
        await ucitajNarudzbe()
      } catch (e) {
        console.error(e)
        alert('Greška pri spremanju narudžbe')
      }
    }

    const dodajStavke = async () => {
      try {
        if (!uredi.value.sifra_narudzbe || !novaStavka.value.sifra_artikla) {
          alert('Odaberi artikl i količinu')
          return
        }
        await axios.post(
          `http://localhost:3000/api/narudzba/${uredi.value.sifra_narudzbe}/stavke`,
          {
            stavke: [
              {
                sifra_artikla: Number(novaStavka.value.sifra_artikla),
                kolicina: Number(novaStavka.value.kolicina || 1),
              },
            ],
          },
          { withCredentials: true },
        )
        await ucitajStavke(uredi.value.sifra_narudzbe)
        // nakon svake promjene stavki – spremi novi izračun u DB
        novaStavka.value = { sifra_artikla: null, kolicina: 1 }
        alert('Stavke dodane')
      } catch (e) {
        console.error(e)
        alert(e?.response?.data?.error || 'Greška pri dodavanju stavki')
      }
    }

    const obrisiStavku = async (stavka) => {
      try {
        if (!confirm(`Obrisati stavku "${stavka.naziv_artikla}"?`)) return
        await axios.delete(
          `http://localhost:3000/api/stavka-narudzbe/${stavka.sifra_artikla_narudzbe}`,
          { withCredentials: true },
        )
        await ucitajStavke(uredi.value.sifra_narudzbe)
        await spremiNarudzbu()
      } catch (e) {
        console.error(e)
        alert(e?.response?.data?.error || 'Greška pri brisanju stavke')
      }
    }

    const potvrdiBrisanje = async (nar) => {
      if (!confirm(`Obrisati narudžbu #${nar.sifra_narudzbe}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/narudzba/${nar.sifra_narudzbe}`, {
          withCredentials: true,
        })
        alert('Narudžba obrisana')
        uredi.value = {}
        stavkeNarudzbe.value = []
        await ucitajNarudzbe()
      } catch (e) {
        console.error(e)
        alert('Greška pri brisanju narudžbe')
      }
    }

    onMounted(ucitajSve)

    return {
      tab,
      // lists
      narudzbe,
      stavkeNarudzbe,
      korisnici,
      lokacije,
      artikli,
      // ui
      filter,
      uredi,
      nova,
      novaStavka,
      // selects
      korisnikOpcije,
      lokacijaOpcije,
      artiklOpcije,
      // columns
      narColumns,
      stavkeColumns,
      // computed
      minDatum,
      filtriraneNarudzbe,
      brojDana,
      ukupanIznosIzracun,
      // actions
      ucitajSve,
      odaberiNarudzbu,
      dodajNarudzbu,
      spremiNarudzbu,
      dodajStavke,
      obrisiStavku,
      potvrdiBrisanje,
    }
  },
}
</script>
