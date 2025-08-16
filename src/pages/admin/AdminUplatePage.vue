<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija uplata</div>
      <div class="row items-center q-gutter-sm">
        <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajSve" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Lijevo: tablica uplata + filter -->
      <div class="col-12 col-md-5">
        <q-input
          dense
          outlined
          v-model="filter"
          label="Filtriraj uplate (kupac, email, način...)"
          class="q-mb-sm"
          clearable
        />
        <q-table
          title="Uplate"
          :rows="filtriraneUplate"
          :columns="columns"
          row-key="sifra_narudzbe"
          flat
          bordered
          dense
          :pagination="{ rowsPerPage: 10 }"
          @row-click="(_, row) => odaberiUplatu(row)"
        >
          <template #body-cell-kupac="props">
            <q-td :props="props">
              {{ props.row.ime_korisnika }} {{ props.row.prezime_korisnika }}
              <div class="text-caption text-grey-7">{{ props.row.email_korisnika }}</div>
            </q-td>
          </template>

          <template #body-cell-iznos="props">
            <q-td :props="props">{{ Number(props.row.ukupan_iznos || 0).toFixed(2) }} €</q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.status_placanja ? 'positive' : 'warning'"
                text-color="white"
                dense
              >
                {{ props.row.status_placanja ? 'Plaćeno' : 'Neplaćeno' }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Desno: uređivanje postojeće uplate -->
      <div class="col-12 col-md-7">
        <div v-if="uredi.sifra_narudzbe" class="q-gutter-md">
          <div class="row items-center justify-between">
            <div class="text-subtitle1">Uredi uplatu — narudžba #{{ uredi.sifra_narudzbe }}</div>
            <div>
              <q-btn
                color="secondary"
                icon="save"
                label="Spremi promjene"
                class="q-mr-sm"
                @click="spremiUplatu"
              />
              <q-btn color="negative" icon="delete" label="Obriši" flat @click="obrisiUplatu" />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input filled v-model="uredi.sifra_narudzbe" label="Šifra narudžbe" readonly />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                filled
                :model-value="Number(uredi.ukupan_iznos || 0).toFixed(2) + ' €'"
                label="Ukupan iznos"
                readonly
              />
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
            <div class="col-12 col-md-6 flex items-center">
              <q-checkbox v-model="uredi.status_placanja_bool" label="Plaćeno" />
            </div>
          </div>
        </div>

        <div v-else class="text-grey-7">
          Odaberite uplatu s lijeve strane za uređivanje ili ispod unesite novu uplatu.
        </div>

        <q-separator class="q-my-md" />

        <!-- Dodavanje nove uplate -->
        <div class="q-gutter-md">
          <div class="text-subtitle1">Nova uplata</div>
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-md-6">
              <q-select
                filled
                v-model="nova.sifra_narudzbe"
                :options="narudzbaOpcije"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                label="Odaberite narudžbu"
                :rules="[(v) => !!v || 'Obavezno']"
                use-input
                input-debounce="0"
                behavior="menu"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                filled
                v-model="nova.nacin_placanja"
                :options="['Gotovina', 'Kartica']"
                label="Način plaćanja"
                :rules="[(v) => !!v || 'Obavezno']"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-checkbox v-model="nova.status_placanja_bool" label="Plaćeno" />
            </div>
            <div class="col-12 col-md-2">
              <q-btn color="primary" icon="add" label="Dodaj" @click="dodajUplatu" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

export default {
  name: 'AdminUplatePage',
  setup() {
    const uplate = ref([])
    const narudzbe = ref([])
    const filter = ref('')

    // uređivanje postojeće
    const uredi = ref({
      sifra_narudzbe: null,
      nacin_placanja: 'Gotovina',
      ukupan_iznos: 0,
      status_placanja_bool: false,
    })

    // nova uplata
    const nova = ref({
      sifra_narudzbe: null,
      nacin_placanja: 'Gotovina',
      status_placanja_bool: false,
    })

    const columns = [
      { name: 'sifra_narudzbe', label: 'Narudžba', field: 'sifra_narudzbe', align: 'left' },
      {
        name: 'kupac',
        label: 'Kupac',
        field: (row) => `${row.ime_korisnika} ${row.prezime_korisnika}`,
        align: 'left',
      },
      {
        name: 'email_korisnika',
        label: 'Email',
        field: 'email_korisnika',
        align: 'left',
        classes: 'text-caption',
      },
      { name: 'nacin_placanja', label: 'Način', field: 'nacin_placanja', align: 'left' },
      { name: 'iznos', label: 'Iznos (€)', field: (row) => row.ukupan_iznos, align: 'right' },
      { name: 'status', label: 'Status', field: 'status_placanja', align: 'left' },
    ]

    const narudzbaOpcije = computed(() =>
      narudzbe.value.map((n) => ({
        value: n.sifra_narudzbe,
        label: `#${n.sifra_narudzbe} — ${n.ime_korisnika} ${n.prezime_korisnika} (${n.email_korisnika}) • ${Number(n.ukupan_iznos || 0).toFixed(2)} €`,
      })),
    )

    const filtriraneUplate = computed(() => {
      const q = (filter.value || '').toLowerCase().trim()
      if (!q) return uplate.value
      return uplate.value.filter(
        (u) =>
          `${u.ime_korisnika} ${u.prezime_korisnika}`.toLowerCase().includes(q) ||
          (u.email_korisnika || '').toLowerCase().includes(q) ||
          (u.nacin_placanja || '').toLowerCase().includes(q) ||
          String(u.sifra_narudzbe).includes(q),
      )
    })

    const ucitajUplate = async () => {
      const res = await axios.get('http://localhost:3000/api/uplate', { withCredentials: true })
      uplate.value = res.data
    }
    const ucitajNarudzbe = async () => {
      const res = await axios.get('http://localhost:3000/api/narudzbe', { withCredentials: true })
      narudzbe.value = res.data
    }
    const ucitajSve = async () => {
      try {
        await Promise.all([ucitajUplate(), ucitajNarudzbe()])
      } catch (e) {
        console.error(e)
        alert('Greška pri dohvaćanju podataka')
      }
    }

    const odaberiUplatu = (row) => {
      uredi.value = {
        sifra_narudzbe: row.sifra_narudzbe,
        nacin_placanja: row.nacin_placanja || 'Gotovina',
        ukupan_iznos: row.ukupan_iznos,
        status_placanja_bool: !!Number(row.status_placanja || 0),
      }
    }

    const spremiUplatu = async () => {
      try {
        if (!uredi.value.sifra_narudzbe || !uredi.value.nacin_placanja) {
          alert('Nedostaju podaci')
          return
        }
        await axios.put(
          `http://localhost:3000/api/uplata/${uredi.value.sifra_narudzbe}`,
          {
            nacin_placanja: uredi.value.nacin_placanja,
            status_placanja: Number(uredi.value.status_placanja_bool ? 1 : 0),
          },
          { withCredentials: true },
        )
        alert('Uplata spremljena')
        await ucitajUplate()
      } catch (e) {
        console.error(e)
        alert('Greška pri spremanju uplate')
      }
    }

    const dodajUplatu = async () => {
      try {
        if (!nova.value.sifra_narudzbe || !nova.value.nacin_placanja) {
          alert('Odaberi narudžbu i način plaćanja')
          return
        }
        await axios.post(
          'http://localhost:3000/api/uplata',
          {
            sifra_narudzbe: nova.value.sifra_narudzbe,
            nacin_placanja: nova.value.nacin_placanja,
            status_placanja: Number(nova.value.status_placanja_bool ? 1 : 0),
          },
          { withCredentials: true },
        )
        alert('Uplata dodana')
        nova.value = {
          sifra_narudzbe: null,
          nacin_placanja: 'Gotovina',
          status_placanja_bool: false,
        }
        await ucitajUplate()
      } catch (e) {
        console.error(e)
        const msg = e?.response?.data?.error || 'Greška pri dodavanju uplate'
        alert(msg)
      }
    }

    const obrisiUplatu = async () => {
      try {
        if (!uredi.value.sifra_narudzbe) return
        if (!confirm(`Obrisati uplatu za narudžbu #${uredi.value.sifra_narudzbe}?`)) return
        await axios.delete(`http://localhost:3000/api/uplata/${uredi.value.sifra_narudzbe}`, {
          withCredentials: true,
        })
        alert('Uplata obrisana')
        uredi.value = {
          sifra_narudzbe: null,
          nacin_placanja: 'Gotovina',
          ukupan_iznos: 0,
          status_placanja_bool: false,
        }
        await ucitajUplate()
      } catch (e) {
        console.error(e)
        alert('Greška pri brisanju uplate')
      }
    }

    onMounted(ucitajSve)

    return {
      uplate,
      narudzbe,
      filter,
      uredi,
      nova,
      columns,
      filtriraneUplate,
      narudzbaOpcije,
      ucitajSve,
      odaberiUplatu,
      spremiUplatu,
      dodajUplatu,
      obrisiUplatu,
    }
  },
}
</script>
