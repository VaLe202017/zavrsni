<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Administracija artikala</div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj artikl" />
      <q-tab name="edit" label="Uredi artikl" />
      <q-tab name="delete" label="Obriši artikl" />
    </q-tabs>

    <!-- Dodavanje artikla -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <q-input
        filled
        v-model="form.naziv_artikla"
        label="Naziv artikla"
        :rules="[(val) => !!val || 'Naziv artikla je obavezan']"
      />
      <q-input
        filled
        v-model.number="form.dostupna_kolicina"
        label="Količina"
        type="number"
        :rules="[(val) => !!val || 'Količina je obavezna']"
      />
      <q-input
        filled
        v-model.number="form.cijena_dan"
        label="Cijena po danu (€)"
        type="number"
        :rules="[(val) => !!val || 'Cijena je obavezna']"
      />

      <q-select
        filled
        v-model="form.sifra_lokacije"
        label="Lokacija"
        :options="lokacije"
        option-label="full"
        option-value="sifra"
        emit-value
        map-options
        :rules="[(val) => !!val || 'Lokacija je obavezna']"
      />

      <q-select
        filled
        v-model="form.sifra_tipa_artikla"
        label="Tip artikla"
        :options="tipoviArtikala"
        option-label="naziv"
        option-value="sifra"
        emit-value
        map-options
        :rules="[(val) => !!val || 'Tip artikla je obavezan']"
      />

      <q-btn label="Dodaj artikl" color="primary" @click="dodajArtikl" />
    </div>
    <!-- Uređivanje artikla -->
    <div v-if="tab === 'edit'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na artikl za uređivanje:</div>
      <q-list bordered separator>
        <q-item v-for="a in artikli" :key="a.sifra_artikla" clickable @click="postaviZaUredi(a)">
          <q-item-section>
            {{ a.naziv_artikla }} ({{ a.tip_artikla }}) - {{ a.naziv_lokacije }} ({{
              a.adresa_lokacije
            }})
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="urediForm.sifra_artikla" class="q-mt-md q-gutter-md">
        <q-input
          filled
          v-model="urediForm.naziv_artikla"
          label="Naziv artikla"
          :rules="[(val) => !!val || 'Naziv je obavezan']"
        />
        <q-input
          filled
          v-model.number="urediForm.dostupna_kolicina"
          label="Dostupna količina"
          type="number"
          :rules="[(val) => !!val || 'Količina je obavezna']"
        />
        <q-input
          filled
          v-model.number="urediForm.cijena_dan"
          label="Cijena po danu (€)"
          type="number"
          :rules="[(val) => !!val || 'Cijena je obavezna']"
        />

        <q-select
          filled
          v-model="urediForm.sifra_tipa_artikla"
          :options="tipoviArtikala"
          option-label="naziv"
          option-value="sifra"
          label="Tip artikla"
          emit-value
          map-options
          :rules="[(val) => !!val || 'Tip artikla je obavezan']"
        />

        <q-select
          filled
          v-model="urediForm.sifra_lokacije"
          :options="lokacije"
          option-label="full"
          option-value="sifra"
          label="Lokacija (naziv + adresa)"
          emit-value
          map-options
          :rules="[(val) => !!val || 'Lokacija je obavezna']"
        />

        <q-btn label="Ažuriraj" color="secondary" @click="azurirajArtikl" />
      </div>
    </div>
    <!-- Brisanje artikla -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na artikl za brisanje:</div>
      <q-list bordered separator>
        <q-item v-for="a in artikli" :key="a.sifra_artikla" clickable @click="potvrdiBrisanje(a)">
          <q-item-section>
            {{ a.naziv_artikla }} - {{ a.tip_artikla }} - {{ a.naziv_lokacije }}
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
  name: 'AdminArtikliPage',
  setup() {
    const tab = ref('add')
    const artikli = ref([])
    const tipoviArtikala = ref([])
    const lokacije = ref([])

    const form = ref({
      naziv_artikla: '',
      dostupna_kolicina: '',
      cijena_dan: '',
      sifra_tipa_artikla: null,
      sifra_lokacije: null,
    })

    const urediForm = ref({})

    const dohvatiArtikle = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/svi-artikli')
        artikli.value = res.data
      } catch (err) {
        alert('Greška pri dohvaćanju artikala')
        console.error(err)
      }
    }

    const dohvatiTipove = async () => {
      const res = await axios.get('http://localhost:3000/api/tipovi-artikla')
      tipoviArtikala.value = res.data.map((t) => ({
        naziv: t.tip_artikla,
        sifra: t.sifra_tipa_artikla,
      }))
    }

    const dohvatiLokacije = async () => {
      const res = await axios.get('http://localhost:3000/api/lokacije')
      lokacije.value = res.data.map((l) => ({
        full: `${l.naziv_lokacije} (${l.adresa_lokacije})`,
        sifra: l.sifra_lokacije,
      }))
    }

    const dodajArtikl = async () => {
      try {
        const podaciZaSlanje = {
          naziv_artikla: form.value.naziv_artikla,
          dostupna_kolicina: form.value.dostupna_kolicina,
          cijena_dan: form.value.cijena_dan,
          sifra_lokacije: form.value.sifra_lokacije, // samo broj
          sifra_tipa_artikla: form.value.sifra_tipa_artikla, // samo broj
        }
        await axios.post('http://localhost:3000/api/artikl', podaciZaSlanje, {
          withCredentials: true,
        })
        alert('Artikl dodan')
        await dohvatiArtikle()
      } catch (err) {
        alert('Greška pri dodavanju artikla')
        console.error(err)
      }
    }

    const postaviZaUredi = (artikl) => {
      urediForm.value = { ...artikl }
    }

    const azurirajArtikl = async () => {
      try {
        const podaciZaSlanje = {
          naziv_artikla: urediForm.value.naziv_artikla,
          dostupna_kolicina: urediForm.value.dostupna_kolicina,
          cijena_dan: urediForm.value.cijena_dan,
          sifra_lokacije: urediForm.value.sifra_lokacije, // samo broj
          sifra_tipa_artikla: urediForm.value.sifra_tipa_artikla, // samo broj
        }
        await axios.put(
          `http://localhost:3000/api/artikl/${urediForm.value.sifra_artikla}`,
          podaciZaSlanje,
          {
            withCredentials: true,
          },
        )
        alert('Artikl ažuriran')
        await dohvatiArtikle()
      } catch (err) {
        alert('Greška pri ažuriranju artikla')
        console.error(err)
      }
    }

    const potvrdiBrisanje = async (artikl) => {
      if (!confirm(`Obrisati artikl: ${artikl.naziv_artikla}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/artikl/${artikl.sifra_artikla}`, {
          withCredentials: true,
        })
        alert('Artikl obrisan')
        await dohvatiArtikle()
      } catch (err) {
        alert('Greška pri brisanju artikla')
        console.error(err)
      }
    }

    onMounted(async () => {
      await dohvatiArtikle()
      await dohvatiTipove()
      await dohvatiLokacije()
    })

    return {
      tab,
      form,
      artikli,
      tipoviArtikala,
      lokacije,
      urediForm,
      dodajArtikl,
      postaviZaUredi,
      azurirajArtikl,
      potvrdiBrisanje,
    }
  },
}
</script>
