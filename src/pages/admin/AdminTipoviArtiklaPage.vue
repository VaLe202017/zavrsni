<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Administracija tipova artikala</div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj tip artikla" />
      <q-tab name="edit" label="Uredi tip artikla" />
      <q-tab name="delete" label="Brisanje tip artikla" />
    </q-tabs>

    <!-- Dodavanje tipa artikla -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <q-input
        filled
        v-model="form.tip_artikla"
        label="Tip artikla"
        :rules="[(val) => !!val || 'Tip artikla je obavezan']"
      />
      <q-btn label="Spremi" color="orange" @click="dodajTip" />
    </div>

    <!-- Uređivanje tipa artikla -->
    <div v-if="tab === 'edit'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na korisnika za uređivanje:</div>
      <q-list bordered separator>
        <q-item
          v-for="t in tipovi"
          :key="t.sfira_tipa_artikla"
          clickable
          @click="postaviZaUredi(t)"
        >
          <q-item-section>{{ t.tip_artikla }}</q-item-section>
        </q-item>
      </q-list>

      <div v-if="urediForm.sfira_tipa_artikla" class="q-mt-md q-gutter-md">
        <q-input filled v-model="urediForm.sfira_tipa_artikla" label="ID" disable />
        <q-input filled v-model="urediForm.tip_artikla" label="Ime" />
        <q-btn label="Ažuriraj" color="secondary" @click="azurirajTip" />
      </div>
    </div>

    <!-- Brisanje tipa artikla -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na korisnika za brisanje:</div>
      <q-list bordered separator>
        <q-item
          v-for="t in tipovi"
          :key="t.sfira_tipa_artikla"
          clickable
          @click="potvrdiBrisanje(t)"
        >
          <q-item-section>{{ t.tip_artikla }}</q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import axios from 'axios'
import { ref, onMounted } from 'vue'

export default {
  name: 'AdminTipoviArtikalaPage',
  setup() {
    const tab = ref('add')
    const tipovi = ref([])

    const form = ref({
      tip_artikla: '',
    })

    const urediForm = ref({})

    const dohvatiTip = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/tipovi-artikla')
        tipovi.value = res.data
      } catch (err) {
        alert('Greška pri dohvaćanju tipa artikla')
        console.error(err)
      }
    }

    const dodajTip = async () => {
      try {
        const podaciZaSlanje = {
          tip_artikla: form.value.tip_artikla,
        }
        await axios.post('http://localhost:3000/api/tip-artikla', podaciZaSlanje, {
          withCredentials: true,
        })

        alert('Tip artikla dodan')
        await dohvatiTip()
      } catch (err) {
        alert('Greška pri dodavanju tipa artikla')
        console.error(err)
      }
    }

    const postaviZaUredi = (tip) => {
      urediForm.value = { ...tip }
    }

    const azurirajTip = async () => {
      try {
        const podaciZaSlanje = {
          tip_artikla: urediForm.value.tip_artikla,
        }
        await axios.put(
          `http://localhost:3000/api/tip-artikla/${urediForm.value.sfira_tipa_artikla}`,
          podaciZaSlanje,
          {
            withCredentials: true,
          },
        )
        alert('Tip artikla ažuriran')
        await dohvatiTip()
      } catch (err) {
        alert('Greška pri ažuriranju tipa artikla')
        console.error(err)
      }
    }

    const potvrdiBrisanje = async (tipovi) => {
      const potvrda = confirm(`Želite li obrisati tip artikla ${tipovi.tip_artikla}?`)
      if (!potvrda) return

      try {
        await axios.delete(`http://localhost:3000/api/tip-artikla/${tipovi.sfira_tipa_artikla}`, {
          withCredentials: true,
        })
        alert('Korisnik obrisan')
        await dohvatiTip()
      } catch (err) {
        alert('Greška pri brisanju tipa artikla')
        console.error(err)
      }
    }

    onMounted(() => {
      dohvatiTip()
    })

    return {
      tab,
      form,
      tipovi,
      urediForm,
      dodajTip,
      postaviZaUredi,
      azurirajTip,
      potvrdiBrisanje,
    }
  },
}
</script>
