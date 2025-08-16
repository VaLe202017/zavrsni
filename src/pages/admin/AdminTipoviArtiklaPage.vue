<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija tipova artikala</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitaj" />
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj tip" />
      <q-tab name="edit" label="Uredi tip" />
      <q-tab name="delete" label="Brisanje tipa" />
    </q-tabs>

    <!-- ====== DODAJ ====== -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <q-input filled v-model="novo.tip_artikla" label="Naziv tipa" />
      <q-btn color="primary" icon="add" label="Dodaj" @click="dodaj" />
    </div>

    <!-- ====== UREDI ====== -->
    <div v-if="tab === 'edit'">
      <q-input dense outlined v-model="filter" label="Filtriraj (tip…)" class="q-mb-sm" clearable />
      <q-table
        title="Tipovi"
        :rows="filtrirani"
        :columns="columns"
        row-key="sifra_tipa_artikla"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
        @row-click="(_, row) => odaberi(row)"
      />
      <div v-if="uredi.sifra_tipa_artikla" class="q-gutter-md q-mt-md">
        <div class="text-subtitle1">Uredi tip #{{ uredi.sifra_tipa_artikla }}</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-2">
            <q-input filled v-model="uredi.sifra_tipa_artikla" label="ID" readonly />
          </div>
          <div class="col-12 col-md-6">
            <q-input filled v-model="uredi.tip_artikla" label="Naziv" />
          </div>
        </div>
        <q-btn color="secondary" icon="save" label="Spremi promjene" @click="spremi" />
      </div>
      <div v-else class="text-grey-7 q-mt-md">Klikni redak u tablici za uređivanje.</div>
    </div>

    <!-- ====== BRIŠI ====== -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <q-input dense outlined v-model="filter" label="Filtriraj (tip…)" class="q-mb-sm" clearable />
      <q-list bordered separator>
        <q-item
          v-for="t in filtrirani"
          :key="t.sifra_tipa_artikla"
          clickable
          @click="obrisiUpit(t)"
        >
          <q-item-section>#{{ t.sifra_tipa_artikla }} — {{ t.tip_artikla }}</q-item-section>
          <q-item-section side>
            <q-btn dense flat color="negative" icon="delete" @click.stop="obrisiUpit(t)" />
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
  name: 'AdminTipoviArtikalaPage',
  setup() {
    const tab = ref('edit')
    const tipovi = ref([])
    const filter = ref('')
    const novo = ref({ tip_artikla: '' })
    const uredi = ref({})

    const columns = [
      { name: 'sifra_tipa_artikla', label: 'ID', field: 'sifra_tipa_artikla', align: 'left' },
      { name: 'tip_artikla', label: 'Tip artikla', field: 'tip_artikla', align: 'left' },
    ]

    const ucitaj = async () => {
      const r = await axios.get('http://localhost:3000/api/tipovi-artikla', {
        withCredentials: true,
      })
      tipovi.value = r.data
    }

    const filtrirani = computed(() => {
      const q = (filter.value || '').toLowerCase().trim()
      if (!q) return tipovi.value
      return tipovi.value.filter(
        (t) =>
          (t.tip_artikla || '').toLowerCase().includes(q) ||
          String(t.sifra_tipa_artikla).includes(q),
      )
    })

    const odaberi = (row) => {
      uredi.value = { ...row }
    }

    const dodaj = async () => {
      try {
        await axios.post(
          'http://localhost:3000/api/tip-artikla',
          { ...novo.value },
          { withCredentials: true },
        )
        alert('Tip dodan')
        novo.value = { tip_artikla: '' }
        await ucitaj()
        tab.value = 'edit'
      } catch (e) {
        console.error(e)
        alert('Greška pri dodavanju tipa')
      }
    }

    const spremi = async () => {
      try {
        await axios.put(
          `http://localhost:3000/api/tip-artikla/${uredi.value.sifra_tipa_artikla}`,
          { tip_artikla: uredi.value.tip_artikla },
          { withCredentials: true },
        )
        alert('Tip ažuriran')
        await ucitaj()
      } catch (e) {
        console.error(e)
        alert('Greška pri spremanju tipa')
      }
    }

    const obrisiUpit = async (t) => {
      if (!confirm(`Obrisati tip #${t.sifra_tipa_artikla}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/tip-artikla/${t.sifra_tipa_artikla}`, {
          withCredentials: true,
        })
        alert('Tip obrisan')
        await ucitaj()
      } catch (e) {
        console.error(e)
        alert('Greška pri brisanju (možda postoji artikl s ovim tipom)')
      }
    }

    onMounted(ucitaj)
    return {
      tab,
      tipovi,
      filter,
      columns,
      filtrirani,
      novo,
      uredi,
      ucitaj,
      odaberi,
      dodaj,
      spremi,
      obrisiUpit,
    }
  },
}
</script>
