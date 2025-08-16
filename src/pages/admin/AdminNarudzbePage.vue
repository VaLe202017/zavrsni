<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Administracija narudžbi</div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj narudžbu" />
      <q-tab name="edit" label="Uredi narudžbu" />
      <q-tab name="delete" label="Brisanje narudžbe" />
    </q-tabs>

    <!-- Dodavanje narudžbe -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <q-select
        v-model="form.sifra_korisnika"
        :options="korisniciOptions"
        label="Korisnik"
        option-value="sifra_korisnika"
        option-label="fullName"
        filled
      />
      <q-select
        v-model="form.sifra_lokacije"
        :options="lokacijeOptions"
        label="Lokacija"
        option-value="sifra_lokacije"
        option-label="fullName"
        filled
      />
      <q-select
        v-model="form.stavke"
        :options="artikliOptions"
        label="Artikli"
        option-value="sifra_artikla"
        option-label="fullName"
        multiple
        filled
      />
      <q-input
        filled
        v-model="form.datum_iznajmljivanja"
        label="Datum iznajmljivanja"
        type="date"
      />
      <q-input filled v-model="form.datum_vracanja" label="Datum vraćanja" type="date" />
      <q-select
        v-model="form.nacin_placanja"
        :options="['Gotovina', 'Kartica']"
        label="Način plaćanja"
        filled
      />
      <q-btn label="Spremi" color="orange" @click="dodajNarudzbu" />
    </div>

    <!-- Uređivanje narudžbe -->
    <div v-if="tab === 'edit'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na narudžbu za uređivanje:</div>
      <q-list bordered separator>
        <q-item v-for="n in narudzbe" :key="n.sifra_narudzbe" clickable @click="postaviZaUredi(n)">
          <q-item-section>
            Narudžba #{{ n.sifra_narudzbe }} – {{ n.korisnik }} – {{ n.datum_iznajmljivanja }}
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="urediForm.sifra_narudzbe" class="q-mt-md q-gutter-md">
        <q-input filled v-model="urediForm.sifra_narudzbe" label="ID" disable />
        <q-input
          filled
          v-model="urediForm.datum_iznajmljivanja"
          type="date"
          label="Datum iznajmljivanja"
        />
        <q-input filled v-model="urediForm.datum_vracanja" type="date" label="Datum vraćanja" />
        <q-select
          v-model="urediForm.nacin_placanja"
          :options="['Gotovina', 'Kartica']"
          label="Način plaćanja"
          filled
        />
        <q-btn label="Ažuriraj" color="secondary" @click="azurirajNarudzbu" />
      </div>
    </div>

    <!-- Brisanje narudžbe -->
    <div v-if="tab === 'delete'" class="q-gutter-md">
      <div class="q-mb-sm">Kliknite na narudžbu za brisanje:</div>
      <q-list bordered separator>
        <q-item v-for="n in narudzbe" :key="n.sifra_narudzbe" clickable @click="potvrdiBrisanje(n)">
          <q-item-section>
            Narudžba #{{ n.sifra_narudzbe }} – {{ n.korisnik }} – {{ n.datum_iznajmljivanja }}
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
  name: 'AdminNarudzbePage',
  setup() {
    const tab = ref('add')
    const narudzbe = ref([])
    const korisniciOptions = ref([])
    const lokacijeOptions = ref([])
    const artikliOptions = ref([])

    const form = ref({
      sifra_korisnika: null,
      sifra_lokacije: null,
      stavke: [],
      datum_iznajmljivanja: '',
      datum_vracanja: '',
      nacin_placanja: '',
    })

    const urediForm = ref({})

    // Dohvati podatke
    const dohvatiNarudzbe = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/narudzbe')
        narudzbe.value = res.data
      } catch (err) {
        alert('Greška pri dohvaćanju narudžbi')
        console.error(err)
      }
    }

    const dohvatiKorisnike = async () => {
      const res = await axios.get('http://localhost:3000/api/svi-korisnici')
      korisniciOptions.value = res.data.map((k) => ({
        sifra_korisnika: k.sifra_korisnika,
        fullName: `${k.ime_korisnika} ${k.prezime_korisnika} (${k.email_korisnika})`,
      }))
    }

    const dohvatiLokacije = async () => {
      const res = await axios.get('http://localhost:3000/api/sve-lokacije')
      lokacijeOptions.value = res.data.map((l) => ({
        sifra_lokacije: l.sifra_lokacije,
        fullName: `${l.naziv_lokacije} (${l.adresa_lokacije})`,
      }))
    }

    const dohvatiArtikle = async () => {
      const res = await axios.get('http://localhost:3000/api/svi-artikli')
      artikliOptions.value = res.data.map((a) => ({
        sifra_artikla: a.sifra_artikla,
        fullName: `${a.naziv_artikla} (${a.cijena_dan} €/dan)`,
      }))
    }

    // Dodaj narudžbu
    const dodajNarudzbu = async () => {
      try {
        await axios.post(
          'http://localhost:3000/api/narudzba',
          {
            sifra_korisnika: form.value.sifra_korisnika,
            sifra_lokacije: form.value.sifra_lokacije,
            stavke: form.value.stavke.map((a) => ({
              sifra_artikla: a,
              kolicina: 1,
            })),
            datumIznajmljivanja: form.value.datum_iznajmljivanja,
            datumVracanja: form.value.datum_vracanja,
            nacin_placanja: form.value.nacin_placanja,
          },
          { withCredentials: true },
        )
        alert('Narudžba dodana')
        await dohvatiNarudzbe()
      } catch (err) {
        alert('Greška pri dodavanju narudžbe')
        console.error(err)
      }
    }

    // Postavi za uređivanje
    const postaviZaUredi = (nar) => {
      urediForm.value = { ...nar }
    }

    const azurirajNarudzbu = async () => {
      try {
        await axios.put(
          `http://localhost:3000/api/narudzba/${urediForm.value.sifra_narudzbe}`,
          urediForm.value,
          { withCredentials: true },
        )
        alert('Narudžba ažurirana')
        await dohvatiNarudzbe()
      } catch (err) {
        alert('Greška pri ažuriranju narudžbe')
        console.error(err)
      }
    }

    const potvrdiBrisanje = async (nar) => {
      if (!confirm(`Obrisati narudžbu #${nar.sifra_narudzbe}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/narudzba/${nar.sifra_narudzbe}`, {
          withCredentials: true,
        })
        alert('Narudžba obrisana')
        await dohvatiNarudzbe()
      } catch (err) {
        alert('Greška pri brisanju narudžbe')
        console.error(err)
      }
    }

    onMounted(() => {
      dohvatiNarudzbe()
      dohvatiKorisnike()
      dohvatiLokacije()
      dohvatiArtikle()
    })

    return {
      tab,
      form,
      urediForm,
      narudzbe,
      korisniciOptions,
      lokacijeOptions,
      artikliOptions,
      dodajNarudzbu,
      postaviZaUredi,
      azurirajNarudzbu,
      potvrdiBrisanje,
    }
  },
}
</script>
