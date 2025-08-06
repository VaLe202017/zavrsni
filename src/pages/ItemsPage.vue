<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6">Pretraživanje artikala</div>
      </div>

      <q-input
        v-model="searchQuery"
        label="Unesite pojam za pretragu"
        outlined
        clearable
        class="q-mb-md"
        @input="performSearch"
        @keyup.enter="performSearch"
      />

      <q-table
        :rows="filteredArtikli"
        :columns="columns"
        row-key="naziv_artikla"
        title="Artikli"
        class="q-mt-md"
        flat
        bordered
        ><template v-slot:body-cell-akcije="props">
          <q-td :props="props">
            <q-btn
              color="primary"
              label="Dodaj u košaricu"
              dense
              @click="dodajUKosaricu(props.row)"
            />
          </q-td> </template
      ></q-table>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'

export default {
  setup() {
    const $q = useQuasar()
    const notify = $q.notify

    const searchQuery = ref('')
    const artikli = ref([])
    const filteredArtikli = ref([])

    const columns = [
      { name: 'naziv_artikla', label: 'Naziv artikla', field: 'naziv_artikla', align: 'left' },
      {
        name: 'dostupna_kolicina',
        label: 'Dostupna količina',
        field: 'dostupna_kolicina',
        align: 'center',
      },
      { name: 'cijena_dan', label: 'Cijena po danu (€)', field: 'cijena_dan', align: 'center' },
      { name: 'naziv_lokacije', label: 'Lokacija', field: 'naziv_lokacije', align: 'center' },
      { name: 'adresa_lokacije', label: 'Adresa', field: 'adresa_lokacije', align: 'center' },
      { name: 'akcije', label: '', field: 'akcije', align: 'center' },
    ]

    const loadAllArtikli = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/artikli')
        artikli.value = res.data
        filteredArtikli.value = res.data
      } catch (err) {
        console.error('Greška kod dohvaćanja artikala:', err)
      }
    }

    const performSearch = () => {
      const query = searchQuery.value.toLowerCase()
      if (!query) {
        filteredArtikli.value = artikli.value
        return
      }

      filteredArtikli.value = artikli.value.filter((a) =>
        a.naziv_artikla.toLowerCase().includes(query),
      )
    }

    watch(searchQuery, (value) => {
      if (!value) {
        filteredArtikli.value = artikli.value
      }
    })

    const dodajUKosaricu = (artikl) => {
      const kosarica = JSON.parse(localStorage.getItem('kosarica')) || []

      const postoji = kosarica.find((item) => item.naziv_artikla === artikl.naziv_artikla)
      if (postoji) {
        postoji.kolicina += 1
      } else {
        kosarica.push({
          naziv_artikla: artikl.naziv_artikla,
          cijena_dan: artikl.cijena_dan,
          kolicina: 1,
          sifra_lokacije: artikl.sifra_lokacije,
          naziv_lokacije: artikl.naziv_lokacije,
          adresa_lokacije: artikl.adresa_lokacije,
        })
      }

      localStorage.setItem('kosarica', JSON.stringify(kosarica))

      notify({ type: 'positive', message: 'Dodano u košaricu' })
    }

    onMounted(() => {
      loadAllArtikli()
    })

    return {
      searchQuery,
      filteredArtikli,
      columns,
      performSearch,
      dodajUKosaricu,
    }
  },
}
</script>
