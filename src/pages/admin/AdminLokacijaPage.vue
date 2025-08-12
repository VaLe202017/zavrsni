<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Administracija lokacija</div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj lokaciju" />
      <q-tab name="edit" label="Uredi lokaciju" />
      <q-tab name="delete" label="Brisanje lokacije" />
    </q-tabs>

    <!-- Dodavanje lokacije -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <q-input filled v-model="form.naziv_lokacije" label="Naziv lokacije" />
      <q-input filled v-model="form.adresa_lokacije" label="Adresa" />
      <q-input filled v-model="form.grad" label="Grad" />
      <q-input filled v-model="form.drzava" label="Država" />
      <q-btn label="Spremi" color="orange" @click="dodajLokaciju" />
    </div>

    <!-- Uređivanje lokacije -->
    <div v-if="tab === 'edit'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na lokaciju za uređivanje:</div>
      <q-list bordered separator>
        <q-item v-for="l in lokacije" :key="l.sifra_lokacije" clickable @click="postaviZaUredi(l)">
          <q-item-section>
            {{ l.naziv_lokacije }} ({{ l.adresa_lokacije }}, {{ l.grad }}, {{ l.drzava }})
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="urediForm.sifra_lokacije" class="q-mt-md q-gutter-md">
        <q-input filled v-model="urediForm.sifra_lokacije" label="ID" disable />
        <q-input filled v-model="urediForm.naziv_lokacije" label="Naziv lokacije" />
        <q-input filled v-model="urediForm.adresa_lokacije" label="Adresa" />
        <q-input filled v-model="urediForm.grad" label="Grad" />
        <q-input filled v-model="urediForm.drzava" label="Država" />
        <q-btn label="Ažuriraj" color="secondary" @click="azurirajLokaciju" />
      </div>
    </div>

    <!-- Brisanje lokacije -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na lokaciju za brisanje:</div>
      <q-list bordered separator>
        <q-item v-for="l in lokacije" :key="l.sifra_lokacije" clickable @click="potvrdiBrisanje(l)">
          <q-item-section>
            {{ l.naziv_lokacije }} ({{ l.adresa_lokacije }}, {{ l.grad }}, {{ l.drzava }})
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import axios from 'axios'
import { ref, onMounted } from 'vue'

export default {
  name: 'AdminLokacijePage',
  setup() {
    const tab = ref('add')
    const lokacije = ref([])

    const form = ref({
      naziv_lokacije: '',
      adresa_lokacije: '',
      grad: '',
      drzava: '',
    })

    const urediForm = ref({})

    const dohvatiLokacije = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/sve-lokacije')
        lokacije.value = res.data
      } catch (err) {
        alert('Greška pri dohvaćanju lokacija')
        console.error(err)
      }
    }

    const dodajLokaciju = async () => {
      try {
        await axios.post(
          'http://localhost:3000/api/lokacija',
          { ...form.value },
          { withCredentials: true },
        )
        alert('Lokacija dodana')
        // reset
        form.value = { naziv_lokacije: '', adresa_lokacije: '', grad: '', drzava: '' }
        await dohvatiLokacije()
      } catch (err) {
        alert('Greška pri dodavanju lokacije')
        console.error(err)
      }
    }

    const postaviZaUredi = (lok) => {
      urediForm.value = { ...lok }
    }

    const azurirajLokaciju = async () => {
      try {
        await axios.put(
          `http://localhost:3000/api/lokacija/${urediForm.value.sifra_lokacije}`,
          {
            naziv_lokacije: urediForm.value.naziv_lokacije,
            adresa_lokacije: urediForm.value.adresa_lokacije,
            grad: urediForm.value.grad,
            drzava: urediForm.value.drzava,
          },
          { withCredentials: true },
        )
        alert('Lokacija ažurirana')
        await dohvatiLokacije()
      } catch (err) {
        alert('Greška pri ažuriranju lokacije')
        console.error(err)
      }
    }

    const potvrdiBrisanje = async (lok) => {
      if (!confirm(`Obrisati lokaciju "${lok.naziv_lokacije}"?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/lokacija/${lok.sifra_lokacije}`, {
          withCredentials: true,
        })
        alert('Lokacija obrisana')
        await dohvatiLokacije()
      } catch (err) {
        alert('Greška pri brisanju lokacije — provjeri postoji li povezanost u artiklima.')
        console.error(err)
      }
    }

    onMounted(dohvatiLokacije)

    return {
      tab,
      lokacije,
      form,
      urediForm,
      dohvatiLokacije,
      dodajLokaciju,
      postaviZaUredi,
      azurirajLokaciju,
      potvrdiBrisanje,
    }
  },
}
</script>
