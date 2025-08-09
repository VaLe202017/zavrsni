<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Administracija korisnika</div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj korisnika" />
      <q-tab name="edit" label="Uredi korisnika" />
      <q-tab name="delete" label="Brisanje korisnika" />
    </q-tabs>

    <!-- Dodavanje korisnika -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <q-input
        filled
        v-model="form.ime"
        label="Ime korisnika"
        :rules="[(val) => !!val || 'Ime je obavezno']"
      />
      <q-input
        filled
        v-model="form.prezime"
        label="Prezime korisnika"
        :rules="[(val) => !!val || 'Prezime je obavezno']"
      />
      <q-input
        filled
        v-model="form.telefon"
        label="Broj telefona korisnika"
        :rules="[(val) => !!val || 'Broj telefona je obavezan']"
      />
      <q-input
        filled
        v-model="form.email"
        label="Email korisnika"
        :rules="[(val) => !!val || 'Email je obavezan']"
      />
      <q-input
        filled
        v-model="form.password"
        label="Lozinka"
        type="password"
        :rules="[(val) => !!val || 'Password je obavezan']"
      />
      <q-btn label="Spremi" color="orange" @click="dodajKorisnika" />
    </div>

    <!-- Uređivanje korisnika -->
    <div v-if="tab === 'edit'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na korisnika za uređivanje:</div>
      <q-list bordered separator>
        <q-item
          v-for="k in korisnici"
          :key="k.sifra_korisnika"
          clickable
          @click="postaviZaUredi(k)"
        >
          <q-item-section
            >{{ k.ime_korisnika }} {{ k.prezime_korisnika }} -
            {{ k.email_korisnika }}</q-item-section
          >
        </q-item>
      </q-list>

      <div v-if="urediForm.sifra_korisnika" class="q-mt-md q-gutter-md">
        <q-input filled v-model="urediForm.sifra_korisnika" label="ID" disable />
        <q-input
          filled
          v-model="urediForm.ime_korisnika"
          label="Ime"
          :rules="[(val) => !!val || 'Ime je obavezno']"
        />
        <q-input
          filled
          v-model="urediForm.prezime_korisnika"
          label="Prezime"
          :rules="[(val) => !!val || 'Prezime je obavezno']"
        />
        <q-input
          filled
          v-model="urediForm.broj_telefona_korisnika"
          label="Broj telefona"
          :rules="[(val) => !!val || 'Broj telefona je obavezan']"
        />
        <q-input
          filled
          v-model="urediForm.email_korisnika"
          label="Email"
          :rules="[(val) => !!val || 'Email je obavezan']"
        />
        <q-input
          filled
          v-model="urediForm.password"
          label="Lozinka"
          :rules="[(val) => !!val || 'Password je obavezan']"
        />
        <q-btn label="Ažuriraj" color="secondary" @click="azurirajKorisnika" />
      </div>
    </div>

    <!-- Brisanje korisnika -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na korisnika za brisanje:</div>
      <q-list bordered separator>
        <q-item
          v-for="k in korisnici"
          :key="k.sifra_korisnika"
          clickable
          @click="potvrdiBrisanje(k)"
        >
          <q-item-section
            >{{ k.ime_korisnika }} {{ k.prezime_korisnika }} -
            {{ k.email_korisnika }}</q-item-section
          >
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import axios from 'axios'
import { ref, onMounted } from 'vue'

export default {
  name: 'AdminKorisniciPage',
  setup() {
    const tab = ref('add')
    const korisnici = ref([])

    const form = ref({
      ime: '',
      prezime: '',
      telefon: '',
      email: '',
      password: '',
    })

    const urediForm = ref({})

    const dohvatiKorisnike = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/svi-korisnici')
        korisnici.value = res.data
      } catch (err) {
        alert('Greška pri dohvaćanju korisnika')
        console.error(err)
      }
    }

    const dodajKorisnika = async () => {
      try {
        await axios.post(
          'http://localhost:3000/api/korisnik',
          {
            ime_korisnika: form.value.ime,
            prezime_korisnika: form.value.prezime,
            broj_telefona_korisnika: form.value.telefon,
            email_korisnika: form.value.email,
            password: form.value.password,
          },
          { withCredentials: true },
        )

        alert('Korisnik dodan')
        await dohvatiKorisnike()
      } catch (err) {
        alert('Greška pri dodavanju korisnika')
        console.error(err)
      }
    }

    const postaviZaUredi = (korisnik) => {
      urediForm.value = { ...korisnik }
    }

    const azurirajKorisnika = async () => {
      try {
        await axios.put(
          `http://localhost:3000/api/korisnik/${urediForm.value.sifra_korisnika}`,
          urediForm.value,
          {
            withCredentials: true,
          },
        )
        alert('Korisnik ažuriran')
        await dohvatiKorisnike()
      } catch (err) {
        alert('Greška pri ažuriranju korisnika')
        console.error(err)
      }
    }

    const potvrdiBrisanje = async (korisnik) => {
      const potvrda = confirm(
        `Želite li obrisati korisnika ${korisnik.ime_korisnika} ${korisnik.prezime_korisnika}?`,
      )
      if (!potvrda) return

      try {
        await axios.delete(`http://localhost:3000/api/korisnik/${korisnik.sifra_korisnika}`, {
          withCredentials: true,
        })
        alert('Korisnik obrisan')
        await dohvatiKorisnike()
      } catch (err) {
        alert('Greška pri brisanju korisnika')
        console.error(err)
      }
    }

    onMounted(() => {
      dohvatiKorisnike()
    })

    return {
      tab,
      form,
      korisnici,
      urediForm,
      dodajKorisnika,
      postaviZaUredi,
      azurirajKorisnika,
      potvrdiBrisanje,
    }
  },
}
</script>
