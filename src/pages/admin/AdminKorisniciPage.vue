<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija korisnika</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajKorisnike" />
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj korisnika" />
      <q-tab name="edit" label="Uredi korisnika" />
      <q-tab name="delete" label="Brisanje korisnika" />
    </q-tabs>

    <!-- ====== DODAJ ====== -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-3">
          <q-input filled v-model="novo.ime_korisnika" label="Ime" />
        </div>
        <div class="col-12 col-md-3">
          <q-input filled v-model="novo.prezime_korisnika" label="Prezime" />
        </div>
        <div class="col-12 col-md-3">
          <q-input filled v-model="novo.broj_telefona_korisnika" label="Telefon" />
        </div>
        <div class="col-12 col-md-3">
          <q-input filled v-model="novo.email_korisnika" label="Email" />
        </div>
        <div class="col-12 col-md-3">
          <q-input filled type="password" v-model="novo.password" label="Lozinka" />
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
        label="Filtriraj (ime, prezime, email…)"
        class="q-mb-sm"
        clearable
      />
      <q-table
        title="Korisnici"
        :rows="filtrirani"
        :columns="columns"
        row-key="sifra_korisnika"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
        @row-click="(_, row) => odaberi(row)"
      />

      <div v-if="uredi.sifra_korisnika" class="q-gutter-md q-mt-md">
        <div class="text-subtitle1">Uredi korisnika #{{ uredi.sifra_korisnika }}</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-2">
            <q-input filled v-model="uredi.sifra_korisnika" label="ID" readonly />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="uredi.ime_korisnika" label="Ime" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="uredi.prezime_korisnika" label="Prezime" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="uredi.broj_telefona_korisnika" label="Telefon" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="uredi.email_korisnika" label="Email" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled type="password" v-model="uredi.password" label="Lozinka" />
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
        label="Filtriraj (ime, prezime, email…)"
        class="q-mb-sm"
        clearable
      />
      <q-list bordered separator>
        <q-item
          v-for="k in filtrirani"
          :key="k.sifra_korisnika"
          clickable
          @click="potvrdiBrisanje(k)"
        >
          <q-item-section>
            <div class="text-body2">
              #{{ k.sifra_korisnika }} — {{ k.ime_korisnika }} {{ k.prezime_korisnika }}
            </div>
            <div class="text-caption text-grey-7">
              {{ k.email_korisnika }} • {{ k.broj_telefona_korisnika }}
            </div>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat color="negative" icon="delete" @click.stop="potvrdiBrisanje(k)" />
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
  name: 'AdminKorisniciPage',
  setup() {
    const tab = ref('edit')
    const korisnici = ref([])
    const filter = ref('')
    const novo = ref({
      ime_korisnika: '',
      prezime_korisnika: '',
      broj_telefona_korisnika: '',
      email_korisnika: '',
      password: '',
    })
    const uredi = ref({})

    const columns = [
      { name: 'sifra_korisnika', label: 'ID', field: 'sifra_korisnika', align: 'left' },
      { name: 'ime_korisnika', label: 'Ime', field: 'ime_korisnika', align: 'left' },
      { name: 'prezime_korisnika', label: 'Prezime', field: 'prezime_korisnika', align: 'left' },
      { name: 'email_korisnika', label: 'Email', field: 'email_korisnika', align: 'left' },
      {
        name: 'broj_telefona_korisnika',
        label: 'Telefon',
        field: 'broj_telefona_korisnika',
        align: 'left',
      },
    ]

    const ucitajKorisnike = async () => {
      const r = await axios.get('http://localhost:3000/api/svi-korisnici', {
        withCredentials: true,
      })
      korisnici.value = r.data
    }

    const filtrirani = computed(() => {
      const q = (filter.value || '').toLowerCase().trim()
      if (!q) return korisnici.value
      return korisnici.value.filter((k) =>
        [k.ime_korisnika, k.prezime_korisnika, k.email_korisnika, k.broj_telefona_korisnika]
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
        await axios.post(
          'http://localhost:3000/api/korisnik',
          { ...novo.value },
          { withCredentials: true },
        )
        alert('Korisnik dodan')
        novo.value = {
          ime_korisnika: '',
          prezime_korisnika: '',
          broj_telefona_korisnika: '',
          email_korisnika: '',
          password: '',
        }
        await ucitajKorisnike()
        tab.value = 'edit'
      } catch (e) {
        console.error(e)
        alert('Greška pri dodavanju korisnika')
      }
    }

    const spremi = async () => {
      try {
        await axios.put(
          `http://localhost:3000/api/korisnik/${uredi.value.sifra_korisnika}`,
          { ...uredi.value },
          { withCredentials: true },
        )
        alert('Korisnik ažuriran')
        await ucitajKorisnike()
      } catch (e) {
        console.error(e)
        alert('Greška pri spremanju korisnika')
      }
    }

    const potvrdiBrisanje = async (k) => {
      if (!confirm(`Obrisati korisnika #${k.sifra_korisnika}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/korisnik/${k.sifra_korisnika}`, {
          withCredentials: true,
        })
        alert('Korisnik obrisan')
        if (uredi.value.sifra_korisnika === k.sifra_korisnika) uredi.value = {}
        await ucitajKorisnike()
      } catch (e) {
        console.error(e)
        alert('Greška pri brisanju korisnika')
      }
    }

    onMounted(ucitajKorisnike)
    return {
      tab,
      korisnici,
      filter,
      columns,
      filtrirani,
      novo,
      uredi,
      ucitajKorisnike,
      odaberi,
      dodaj,
      spremi,
      potvrdiBrisanje,
    }
  },
}
</script>
