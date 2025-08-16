<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija uplata</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajSve" />
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj uplatu" />
      <q-tab name="edit" label="Uredi uplatu" />
      <q-tab name="delete" label="Brisanje uplate" />
    </q-tabs>

    <!-- ====== DODAJ ====== -->
    <div v-if="tab === 'add'" class="q-gutter-md">
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
            use-input
            input-debounce="0"
            behavior="menu"
            :rules="[(v) => !!v || 'Obavezno']"
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
        <div class="col-12 col-md-2">
          <q-checkbox v-model="nova.status_placanja_bool" label="Plaćeno" />
        </div>
        <div class="col-12 col-md-1">
          <q-btn color="primary" icon="add" label="Dodaj" @click="dodajUplatu" />
        </div>
      </div>
    </div>

    <!-- ====== UREDI ====== -->
    <div v-if="tab === 'edit'">
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
        @row-click="(_, row) => odaberiZaUredi(row)"
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
            <q-badge
              :color="Number(props.row.status_placanja.data) == 49 ? 'positive' : 'negative'"
            >
              {{ Number(props.row.status_placanja.data) == 49 ? 'Plaćeno' : 'Nije plaćeno' }}
            </q-badge>
          </q-td>
        </template>
      </q-table>

      <!-- Forma za uređivanje ispod tablice -->
      <div v-if="uredi.sifra_narudzbe" class="q-gutter-md q-mt-md">
        <div class="text-subtitle1">Uredi uplatu — narudžba #{{ uredi.sifra_narudzbe }}</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input filled v-model="uredi.sifra_narudzbe" label="Šifra narudžbe" readonly />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              filled
              :model-value="Number(uredi.ukupan_iznos || 0).toFixed(2) + ' €'"
              label="Ukupan iznos"
              readonly
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              filled
              v-model="uredi.nacin_placanja"
              :options="['Gotovina', 'Kartica']"
              label="Način plaćanja"
              :rules="[(v) => !!v || 'Obavezno']"
            />
          </div>
          <div class="col-12">
            <q-checkbox v-model="uredi.status_placanja_bool" label="Plaćeno" />
          </div>
        </div>

        <div>
          <q-btn color="secondary" icon="save" label="Spremi promjene" @click="spremiUplatu" />
        </div>
      </div>

      <div v-else class="text-grey-7 q-mt-md">Kliknite na redak iz tablice za uređivanje.</div>
    </div>

    <!-- ====== BRIŠI ====== -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <q-input
        dense
        outlined
        v-model="filter"
        label="Filtriraj uplate (kupac, email, način...)"
        class="q-mb-sm"
        clearable
      />
      <q-list bordered separator>
        <q-item
          v-for="u in filtriraneUplate"
          :key="u.sifra_narudzbe"
          clickable
          @click="potvrdiBrisanje(u)"
        >
          <q-item-section>
            <div class="text-body2">
              #{{ u.sifra_narudzbe }} — {{ u.ime_korisnika }} {{ u.prezime_korisnika }}
              <span class="text-caption text-grey-7"> ({{ u.email_korisnika }})</span>
            </div>
            <div class="text-caption">
              {{ u.nacin_placanja }} • {{ Number(u.ukupan_iznos || 0).toFixed(2) }} € • Status:
              <b> {{ u.status_placanja.data == 49 ? 'Plaćeno' : 'Nije plaćeno' }}</b>
            </div>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat color="negative" icon="delete" @click.stop="potvrdiBrisanje(u)" />
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
  name: 'AdminUplatePage',
  setup() {
    const tab = ref('edit')

    const uplate = ref([])
    const narudzbe = ref([])
    const filter = ref('')

    // Dodaj
    const nova = ref({
      sifra_narudzbe: null,
      nacin_placanja: 'Gotovina',
      status_placanja_bool: false,
    })

    // Uredi
    const uredi = ref({
      sifra_narudzbe: null,
      nacin_placanja: 'Gotovina',
      ukupan_iznos: 0,
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
      {
        name: 'iznos',
        label: 'Iznos (€)',
        field: (row) => Number(row.ukupan_iznos || 0).toFixed(2),
        align: 'right',
      },
      { name: 'status', label: 'Status', field: 'status_placanja', align: 'left' },
    ]

    const statusLabel = (v) => (Number(v) === 1 ? 'Plaćeno' : 'Nije plaćeno')

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

    // API
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

    const odaberiZaUredi = (row) => {
      uredi.value = {
        sifra_narudzbe: row.sifra_narudzbe,
        nacin_placanja: row.nacin_placanja || 'Gotovina',
        ukupan_iznos: row.ukupan_iznos,
        status_placanja_bool: !!Number(row.status_placanja || 0),
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

    const potvrdiBrisanje = async (u) => {
      if (!confirm(`Obrisati uplatu za narudžbu #${u.sifra_narudzbe}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/uplata/${u.sifra_narudzbe}`, {
          withCredentials: true,
        })
        alert('Uplata obrisana')
        if (uredi.value.sifra_narudzbe === u.sifra_narudzbe) {
          uredi.value = {
            sifra_narudzbe: null,
            nacin_placanja: 'Gotovina',
            ukupan_iznos: 0,
            status_placanja_bool: false,
          }
        }
        await ucitajUplate()
      } catch (e) {
        console.error(e)
        const msg = e?.response?.data?.error || 'Greška pri brisanju uplate'
        alert(msg)
      }
    }

    onMounted(ucitajSve)

    return {
      tab,
      statusLabel,
      // data
      uplate,
      narudzbe,
      filter,
      nova,
      uredi,
      // table + selects
      columns,
      filtriraneUplate,
      narudzbaOpcije,
      // actions
      ucitajSve,
      odaberiZaUredi,
      dodajUplatu,
      spremiUplatu,
      potvrdiBrisanje,
    }
  },
}
</script>
