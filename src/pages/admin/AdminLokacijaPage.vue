<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija lokacija</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajLokacije" />
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj lokaciju" />
      <q-tab name="edit" label="Uredi lokaciju" />
      <q-tab name="delete" label="Brisanje lokacije" />
    </q-tabs>

    <!-- ====== DODAJ ====== -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input filled v-model="novo.naziv_lokacije" label="Naziv lokacije" />
        </div>
        <div class="col-12 col-md-4">
          <q-input filled v-model="novo.adresa_lokacije" label="Adresa" />
        </div>
        <div class="col-6 col-md-2">
          <q-input filled v-model="novo.grad" label="Grad" />
        </div>
        <div class="col-6 col-md-2">
          <q-input filled v-model="novo.drzava" label="Država" />
        </div>
      </div>
      <q-btn color="primary" icon="add" label="Dodaj" @click="dodaj" />
    </div>

    <!-- ====== UREDI ====== -->
    <div v-if="tab === 'edit'">
      <q-input
        dense
        outlined
        v-model="filter"
        label="Filtriraj (naziv, adresa, grad, država…)"
        class="q-mb-sm"
        clearable
      />
      <q-table
        title="Lokacije"
        :rows="filtriraneLokacije"
        :columns="columns"
        row-key="sifra_lokacije"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
        @row-click="(_, row) => odaberi(row)"
      >
        <template #body-cell-adresa="props">
          <q-td :props="props">
            {{ props.row.adresa_lokacije }}
            <div class="text-caption text-grey-7">{{ props.row.grad }}, {{ props.row.drzava }}</div>
          </q-td>
        </template>
      </q-table>

      <!-- Forma ispod tablice -->
      <div v-if="uredi.sifra_lokacije" class="q-gutter-md q-mt-md">
        <div class="text-subtitle1">Uredi lokaciju #{{ uredi.sifra_lokacije }}</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-2">
            <q-input filled v-model="uredi.sifra_lokacije" label="ID" readonly />
          </div>
          <div class="col-12 col-md-4">
            <q-input filled v-model="uredi.naziv_lokacije" label="Naziv lokacije" />
          </div>
          <div class="col-12 col-md-4">
            <q-input filled v-model="uredi.adresa_lokacije" label="Adresa" />
          </div>
          <div class="col-6 col-md-2">
            <q-input filled v-model="uredi.grad" label="Grad" />
          </div>
          <div class="col-6 col-md-2">
            <q-input filled v-model="uredi.drzava" label="Država" />
          </div>
        </div>
        <q-btn color="secondary" icon="save" label="Spremi promjene" @click="spremi" />
      </div>

      <div v-else class="text-grey-7 q-mt-md">Klikni redak u tablici za uređivanje.</div>
    </div>

    <!-- ====== BRIŠI ====== -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <q-input
        dense
        outlined
        v-model="filter"
        label="Filtriraj (naziv, adresa, grad, država…)"
        class="q-mb-sm"
        clearable
      />
      <q-list bordered separator>
        <q-item
          v-for="l in filtriraneLokacije"
          :key="l.sifra_lokacije"
          clickable
          @click="obrisiUpit(l)"
        >
          <q-item-section>
            <div class="text-body2">#{{ l.sifra_lokacije }} — {{ l.naziv_lokacije }}</div>
            <div class="text-caption">{{ l.adresa_lokacije }} • {{ l.grad }}, {{ l.drzava }}</div>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat color="negative" icon="delete" @click.stop="obrisiUpit(l)" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'AdminLokacijePage',
  setup() {
    const tab = ref('edit')
    const lokacije = ref([])
    const filter = ref('')

    const novo = ref({
      naziv_lokacije: '',
      adresa_lokacije: '',
      grad: '',
      drzava: '',
    })

    const uredi = ref({})

    const columns = [
      { name: 'sifra_lokacije', label: 'ID', field: 'sifra_lokacije', align: 'left' },
      { name: 'naziv_lokacije', label: 'Naziv', field: 'naziv_lokacije', align: 'left' },
      { name: 'adresa', label: 'Adresa', field: 'adresa_lokacije', align: 'left' },
      { name: 'grad', label: 'Grad', field: 'grad', align: 'left' },
      { name: 'drzava', label: 'Država', field: 'drzava', align: 'left' },
    ]

    const ucitajLokacije = async () => {
      try {
        const r = await axios.get('http://localhost:3000/api/sve-lokacije', {
          withCredentials: true,
        })
        lokacije.value = r.data
      } catch (e) {
        console.error(e)
        alert('Greška pri dohvaćanju lokacija')
      }
    }

    const filtriraneLokacije = computed(() => {
      const q = (filter.value || '').toLowerCase().trim()
      if (!q) return lokacije.value
      return lokacije.value.filter((l) =>
        [l.naziv_lokacije, l.adresa_lokacije, l.grad, l.drzava, String(l.sifra_lokacije)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    })

    const odaberi = (row) => {
      uredi.value = { ...row }
    }

    const dodaj = async () => {
      try {
        if (
          !novo.value.naziv_lokacije ||
          !novo.value.adresa_lokacije ||
          !novo.value.grad ||
          !novo.value.drzava
        ) {
          alert('Sva polja su obavezna')
          return
        }
        await axios.post(
          'http://localhost:3000/api/lokacija',
          { ...novo.value },
          { withCredentials: true },
        )
        alert('Lokacija dodana')
        novo.value = { naziv_lokacije: '', adresa_lokacije: '', grad: '', drzava: '' }
        await ucitajLokacije()
        tab.value = 'edit'
      } catch (e) {
        console.error(e)
        alert('Greška pri dodavanju lokacije')
      }
    }

    const spremi = async () => {
      try {
        const id = uredi.value.sifra_lokacije
        if (!id) return
        if (
          !uredi.value.naziv_lokacije ||
          !uredi.value.adresa_lokacije ||
          !uredi.value.grad ||
          !uredi.value.drzava
        ) {
          alert('Sva polja su obavezna')
          return
        }
        await axios.put(
          `http://localhost:3000/api/lokacija/${id}`,
          {
            naziv_lokacije: uredi.value.naziv_lokacije,
            adresa_lokacije: uredi.value.adresa_lokacije,
            grad: uredi.value.grad,
            drzava: uredi.value.drzava,
          },
          { withCredentials: true },
        )
        alert('Lokacija ažurirana')
        await ucitajLokacije()
      } catch (e) {
        console.error(e)
        alert('Greška pri ažuriranju lokacije')
      }
    }

    const obrisiUpit = async (l) => {
      if (!confirm(`Obrisati lokaciju "${l.naziv_lokacije}" (#${l.sifra_lokacije})?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/lokacija/${l.sifra_lokacije}`, {
          withCredentials: true,
        })
        alert('Lokacija obrisana')
        if (uredi.value.sifra_lokacije === l.sifra_lokacije) uredi.value = {}
        await ucitajLokacije()
      } catch (e) {
        console.error(e)
        const msg =
          e?.response?.data?.error ||
          'Greška pri brisanju lokacije (možda je povezana s artiklima).'
        alert(msg)
      }
    }

    onMounted(ucitajLokacije)

    return {
      tab,
      lokacije,
      filter,
      columns,
      novo,
      uredi,
      filtriraneLokacije,
      ucitajLokacije,
      odaberi,
      dodaj,
      spremi,
      obrisiUpit,
    }
  },
}
</script>
