<template>
  <q-page class="q-pa-md">
    <!-- Gornji red: lista narudžbi + filter -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija narudžbi</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajSve" />
    </div>

    <q-input
      dense
      outlined
      v-model="filterNarudzbe"
      label="Filtriraj narudžbe (kupac, email, lokacija...)"
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
      class="q-mb-xl"
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
    </q-table>

    <!-- ====== UREĐIVANJE ODABRANE NARUDŽBE (ispod tablice) ====== -->
    <q-card v-if="uredi.sifra_narudzbe" flat bordered class="q-pa-md q-mb-xl">
      <div class="row items-center justify-between q-mb-md">
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
            :rules="[(v) => !!v || 'Obavezno']"
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
            :rules="[(v) => !!v || 'Obavezno']"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            v-model="uredi.datum_iznajmljivanja"
            label="Datum početka iznajmljivanja"
            mask="####-##-##"
            readonly
            :rules="[(v) => !!v || 'Obavezno']"
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
            label="Datum vraćanja"
            mask="####-##-##"
            readonly
            :rules="[(v) => !!v || 'Obavezno']"
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
            :rules="[(v) => !!v || 'Obavezno']"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            label="Ukupan iznos (€)"
            :model-value="ukupanIznosIzracun"
            readonly
            hint="Izračun: zbroj cijena stavki × broj dana"
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
        class="q-mb-md"
      >
        <template #body-cell-cijena_dan="props">
          <q-td :props="props">{{ Number(props.row.cijena_dan).toFixed(2) }} €</q-td>
        </template>
        <template #body-cell-ukloni="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              color="negative"
              icon="delete"
              @click="obrisiStavku(props.row)"
              title="Obriši stavku (1 kom)"
            />
          </q-td>
        </template>
      </q-table>

      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-8">
          <q-select
            filled
            v-model="novaStavka.sifra_artikla"
            :options="artiklOpcije"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Dodaj artikl"
            :rules="[(v) => !!v || 'Obavezno']"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            filled
            type="number"
            min="1"
            v-model.number="novaStavka.kolicina"
            label="Količina"
            :rules="[(v) => v > 0 || 'Min 1']"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-btn color="primary" icon="add" label="Dodaj" @click="dodajStavke" />
        </div>
      </div>
    </q-card>

    <!-- ====== NOVA NARUDŽBA (ručni unos) ====== -->
    <q-card flat bordered class="q-pa-md">
      <div class="text-subtitle1 q-mb-md">Nova narudžba</div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select
            filled
            v-model="addForm.sifra_korisnika"
            :options="korisnikOpcije"
            emit-value
            map-options
            label="Korisnik"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            filled
            v-model="addForm.sifra_lokacije"
            :options="lokacijaOpcije"
            emit-value
            map-options
            label="Lokacija"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            v-model="addForm.datum_iznajmljivanja"
            label="Datum početka iznajmljivanja"
            mask="####-##-##"
            readonly
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="addForm.datum_iznajmljivanja" :min="minDatum" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            v-model="addForm.datum_vracanja"
            label="Datum vraćanja"
            mask="####-##-##"
            readonly
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="addForm.datum_vracanja"
                    :min="addForm.datum_iznajmljivanja || minDatum"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-6">
          <q-select
            filled
            v-model="addForm.nacin_placanja"
            :options="['Gotovina', 'Kartica']"
            label="Način plaćanja"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-input
            filled
            label="Ukupan iznos (€)"
            :model-value="ukupanIznosAdd"
            readonly
            hint="Izračun: zbroj (cijena × količina) × broj dana"
          />
          <div class="text-caption text-grey-7">
            Broj dana: <b>{{ brojDanaAdd }}</b>
          </div>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="text-subtitle2">Stavke (nova narudžba)</div>
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-8">
          <q-select
            filled
            v-model="addStavka.sifra_artikla"
            :options="artiklOpcije"
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
            v-model.number="addStavka.kolicina"
            label="Količina"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-btn color="primary" icon="add" label="Dodaj" @click="dodajStavkuAdd" />
        </div>
      </div>

      <q-table
        v-if="addForm.stavke.length"
        :rows="addForm.stavke"
        :columns="stavkeAddCols"
        row-key="sifra_artikla"
        flat
        bordered
        dense
        class="q-mt-md"
      >
        <template #body-cell-cijena_dan="p">
          <q-td :props="p">{{ Number(p.row.cijena_dan).toFixed(2) }} €</q-td>
        </template>
        <template #body-cell-ukloni="p">
          <q-td :props="p">
            <q-btn dense flat color="negative" icon="delete" @click="ukloniStavkuAdd(p.row)" />
          </q-td>
        </template>
      </q-table>

      <q-btn
        color="orange"
        class="q-mt-md"
        icon="save"
        label="Spremi novu narudžbu"
        @click="spremiNovuNarudzbu"
      />
    </q-card>
  </q-page>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'

export default {
  name: 'AdminNarudzbePage',
  setup() {
    // liste
    const narudzbe = ref([])
    const stavkeNarudzbe = ref([])
    const korisnici = ref([])
    const lokacije = ref([])
    const artikli = ref([])

    // UI
    const filterNarudzbe = ref('')
    const uredi = ref({}) // aktivna narudžba
    const novaStavka = ref({ sifra_artikla: null, kolicina: 1 })

    // NOVA narudžba
    const addForm = ref({
      sifra_korisnika: null,
      sifra_lokacije: null,
      datum_iznajmljivanja: '',
      datum_vracanja: '',
      nacin_placanja: 'Gotovina',
      stavke: [], // { sifra_artikla, naziv_artikla, cijena_dan, kolicina }
    })
    const addStavka = ref({ sifra_artikla: null, kolicina: 1 })

    const minDatum = computed(() => new Date().toISOString().split('T')[0])

    // kolone
    const narColumns = [
      { name: 'sifra_narudzbe', label: 'ID', field: 'sifra_narudzbe', align: 'left' },
      {
        name: 'kupac',
        label: 'Kupac',
        field: (row) => `${row.ime_korisnika} ${row.prezime_korisnika}`,
        align: 'left',
      },
      { name: 'email_korisnika', label: 'Email', field: 'email_korisnika', align: 'left' },
      { name: 'lokacija', label: 'Lokacija', field: (row) => row.naziv_lokacije, align: 'left' },
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
        field: (row) => Number(row.ukupan_iznos).toFixed(2),
        align: 'right',
      },
      { name: 'nacin_placanja', label: 'Način', field: 'nacin_placanja', align: 'left' },
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

    const stavkeAddCols = [
      { name: 'sifra_artikla', label: 'Šifra', field: 'sifra_artikla', align: 'left' },
      { name: 'naziv_artikla', label: 'Naziv', field: 'naziv_artikla', align: 'left' },
      { name: 'cijena_dan', label: 'Cijena/dan (€)', field: 'cijena_dan', align: 'right' },
      { name: 'kolicina', label: 'Količina', field: 'kolicina', align: 'center' },
      { name: 'ukloni', label: '', align: 'center' },
    ]

    // opcije za selecte
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

    // filter
    const filtriraneNarudzbe = computed(() => {
      const q = (filterNarudzbe.value || '').toLowerCase().trim()
      if (!q) return narudzbe.value
      return narudzbe.value.filter(
        (n) =>
          `${n.ime_korisnika} ${n.prezime_korisnika}`.toLowerCase().includes(q) ||
          (n.email_korisnika || '').toLowerCase().includes(q) ||
          (n.naziv_lokacije || '').toLowerCase().includes(q) ||
          String(n.sifra_narudzbe).includes(q),
      )
    })

    // broj dana i iznosi
    function diffDani(start, end) {
      if (!start || !end) return 1
      const s = new Date(start + 'T00:00:00')
      const e = new Date(end + 'T00:00:00')
      const d = Math.round((e - s) / (1000 * 60 * 60 * 24))
      return Math.max(1, d)
    }
    const brojDana = computed(() =>
      diffDani(uredi.value.datum_iznajmljivanja, uredi.value.datum_vracanja),
    )
    const ukupanIznosIzracun = computed(() => {
      const suma = stavkeNarudzbe.value.reduce((acc, s) => acc + Number(s.cijena_dan || 0), 0)
      return (suma * brojDana.value).toFixed(2)
    })
    watch(
      () => [stavkeNarudzbe.value, brojDana.value],
      () => {
        if (uredi.value && uredi.value.sifra_narudzbe) {
          uredi.value.ukupan_iznos = Number(ukupanIznosIzracun.value)
        }
      },
      { deep: true },
    )

    const brojDanaAdd = computed(() =>
      diffDani(addForm.value.datum_iznajmljivanja, addForm.value.datum_vracanja),
    )
    const ukupanIznosAdd = computed(() => {
      const suma = addForm.value.stavke.reduce(
        (acc, s) => acc + Number(s.cijena_dan) * Number(s.kolicina || 1),
        0,
      )
      return (suma * brojDanaAdd.value).toFixed(2)
    })

    // API dohvat
    const ucitajNarudzbe = async () => {
      const r = await axios.get('http://localhost:3000/api/narudzbe', { withCredentials: true })
      narudzbe.value = r.data
    }
    const ucitajKorisnike = async () => {
      const r = await axios.get('http://localhost:3000/api/svi-korisnici', {
        withCredentials: true,
      })
      korisnici.value = r.data
    }
    const ucitajLokacije = async () => {
      const r = await axios.get('http://localhost:3000/api/lokacije', { withCredentials: true })
      lokacije.value = r.data
    }
    const ucitajArtikle = async () => {
      const r = await axios.get('http://localhost:3000/api/svi-artikli', { withCredentials: true })
      artikli.value = r.data
    }
    const ucitajStavke = async (sifraNar) => {
      const r = await axios.get(`http://localhost:3000/api/stavke-narudzbe/${sifraNar}`, {
        withCredentials: true,
      })
      stavkeNarudzbe.value = r.data
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

    const azurirajCijenu = async () => {
      await axios.put(
        `http://localhost:3000/api/cijena-narudzbe/${uredi.value.sifra_narudzbe}`,
        {
          ukupan_iznos: Number(ukupanIznosIzracun.value),
        },
        { withCredentials: true },
      )
    }

    // odabir za edit
    const odaberiNarudzbu = async (nar) => {
      uredi.value = {
        sifra_narudzbe: nar.sifra_narudzbe,
        sifra_korisnika: nar.sifra_korisnika,
        sifra_lokacije: nar.sifra_lokacije,
        datum_iznajmljivanja: nar.datum_iznajmljivanja?.substring(0, 10) || '',
        datum_vracanja: nar.datum_vracanja?.substring(0, 10) || '',
        nacin_placanja: nar.nacin_placanja || 'Gotovina',
      }
      await ucitajStavke(nar.sifra_narudzbe)
    }

    // spremi izmjene narudžbe
    const spremiNarudzbu = async () => {
      try {
        if (!uredi.value.sifra_narudzbe) return
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

    // brisanje narudžbe
    const obrisiNarudzbu = async () => {
      try {
        if (!uredi.value.sifra_narudzbe) return
        if (!confirm(`Obrisati narudžbu #${uredi.value.sifra_narudzbe}?`)) return
        await axios.delete(`http://localhost:3000/api/narudzba/${uredi.value.sifra_narudzbe}`, {
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

    // dodavanje stavki u postojeću narudžbu
    const dodajStavke = async () => {
      try {
        if (!uredi.value.sifra_narudzbe) return
        if (!novaStavka.value.sifra_artikla || !(novaStavka.value.kolicina > 0)) {
          alert('Odaberite artikl i količinu.')
          return
        }
        await axios.post(
          'http://localhost:3000/api/stavke-narudzbe-dodaj',
          {
            sifra_narudzbe: uredi.value.sifra_narudzbe,
            stavke: [
              {
                sifra_artikla: Number(novaStavka.value.sifra_artikla),
                kolicina: Number(novaStavka.value.kolicina || 1),
              },
            ],
          },
          { withCredentials: true },
        )
        alert('Stavke dodane')
        novaStavka.value = { sifra_artikla: null, kolicina: 1 }
        await ucitajStavke(uredi.value.sifra_narudzbe)
        await azurirajCijenu()
      } catch (e) {
        console.error(e)
        const msg = e?.response?.data?.error || 'Greška pri dodavanju stavki'
        alert(msg)
      }
    }

    // brisanje pojedine stavke (treba backend DELETE /api/stavka-narudzbe/:id)
    const obrisiStavku = async (stavka) => {
      try {
        if (
          !confirm(
            `Obrisati stavku "${stavka.naziv_artikla}" (ID ${stavka.sifra_artikla_narudzbe})?`,
          )
        )
          return
        await axios.delete(
          `http://localhost:3000/api/stavka-narudzbe/${stavka.sifra_artikla_narudzbe}`,
          { withCredentials: true },
        )
        alert('Stavka obrisana')
        await ucitajStavke(uredi.value.sifra_narudzbe)
        await azurirajCijenu()
      } catch (e) {
        console.error(e)
        const msg = e?.response?.data?.error || 'Greška pri brisanju stavke'
        alert(msg)
      }
    }

    const dodajStavkuAdd = () => {
      const id = Number(addStavka.value.sifra_artikla)
      const kol = Number(addStavka.value.kolicina || 1)
      if (!Number.isFinite(id) || kol < 1) {
        alert('Odaberi artikl i količinu ≥ 1')
        return
      }
      const a = artikli.value.find((x) => Number(x.sifra_artikla) === id)
      if (!a) {
        alert('Artikl nije pronađen')
        return
      }
      addForm.value.stavke.push({
        sifra_artikla: a.sifra_artikla,
        naziv_artikla: a.naziv_artikla,
        cijena_dan: Number(a.cijena_dan),
        kolicina: kol,
      })
      addStavka.value = { sifra_artikla: null, kolicina: 1 }
    }
    const ukloniStavkuAdd = (row) => {
      addForm.value.stavke = addForm.value.stavke.filter(
        (s) => !(s.sifra_artikla === row.sifra_artikla && s.kolicina === row.kolicina),
      )
    }

    // spremi novu narudžbu (2 koraka)
    const spremiNovuNarudzbu = async () => {
      try {
        const f = addForm.value
        if (
          !f.sifra_korisnika ||
          !f.sifra_lokacije ||
          !f.datum_iznajmljivanja ||
          !f.datum_vracanja ||
          !f.stavke.length
        ) {
          alert('Popunite sva polja i dodajte barem jednu stavku.')
          return
        }

        // 1) kreiraj narudžbu
        const res = await axios.post(
          'http://localhost:3000/api/narudzba',
          {
            sifra_korisnika: f.sifra_korisnika,
            sifra_lokacije: f.sifra_lokacije,
            datum_iznajmljivanja: f.datum_iznajmljivanja,
            datum_vracanja: f.datum_vracanja,
            ukupan_iznos: Number(ukupanIznosAdd.value),
            nacin_placanja: f.nacin_placanja,
          },
          { withCredentials: true },
        )

        const sifraNar = res?.data?.sifra_narudzbe || res?.data?.narudzbaId
        if (!sifraNar) {
          alert('Greška: nema ID-a narudžbe iz backenda')
          return
        }

        // 2) dodaj stavke
        const stavkePayload = f.stavke.map((s) => ({
          sifra_artikla: Number(s.sifra_artikla),
          kolicina: Number(s.kolicina || 1),
        }))
        await axios.post(
          'http://localhost:3000/api/stavke-narudzbe',
          {
            sifra_narudzbe: Number(sifraNar),
            stavke: stavkePayload,
          },
          { withCredentials: true },
        )

        alert('Nova narudžba spremljena')
        // reset
        addForm.value = {
          sifra_korisnika: null,
          sifra_lokacije: null,
          datum_iznajmljivanja: '',
          datum_vracanja: '',
          nacin_placanja: 'Gotovina',
          stavke: [],
        }
        await ucitajNarudzbe()
      } catch (e) {
        console.error(e)
        const msg = e?.response?.data?.error || 'Greška pri spremanju nove narudžbe'
        alert(msg)
      }
    }
    /*
    const ucitajSve = async () => {
      await Promise.all([ucitajNarudzbe(), ucitajKorisnike(), ucitajLokacije(), ucitajArtikle()])
    }*/

    onMounted(ucitajSve)

    return {
      // data
      narudzbe,
      stavkeNarudzbe,
      korisnici,
      lokacije,
      artikli,
      filterNarudzbe,
      uredi,
      novaStavka,
      addForm,
      addStavka,

      // selects
      korisnikOpcije,
      lokacijaOpcije,
      artiklOpcije,

      // columns
      narColumns,
      stavkeColumns,
      stavkeAddCols,

      // computed
      minDatum,
      filtriraneNarudzbe,
      brojDana,
      ukupanIznosIzracun,
      brojDanaAdd,
      ukupanIznosAdd,

      // actions
      ucitajSve,
      odaberiNarudzbu,
      spremiNarudzbu,
      obrisiNarudzbu,
      dodajStavke,
      obrisiStavku,
      dodajStavkuAdd,
      ukloniStavkuAdd,
      spremiNovuNarudzbu,
      azurirajCijenu,
    }
  },
}
</script>
