<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Administracija artikala</div>
      <q-btn color="orange" outline icon="refresh" label="Osvježi" @click="ucitajSve" />
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-orange q-mb-md">
      <q-tab name="add" label="Dodaj artikl" />
      <q-tab name="edit" label="Uredi artikl" />
      <q-tab name="delete" label="Brisanje artikla" />
    </q-tabs>

    <!-- ====== DODAJ ====== -->
    <div v-if="tab === 'add'" class="q-gutter-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input filled v-model="novo.naziv_artikla" label="Naziv artikla" />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            filled
            type="number"
            min="0"
            v-model.number="novo.dostupna_kolicina"
            label="Količina"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            filled
            type="number"
            min="0"
            step="0.01"
            v-model.number="novo.cijena_dan"
            label="Cijena/dan (€)"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-select
            filled
            v-model="novo.sifra_tipa_artikla"
            :options="tipOpcije"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Tip artikla"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-select
            filled
            v-model="novo.sifra_lokacije"
            :options="lokOpcije"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Lokacija"
          />
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
        label="Filtriraj (naziv, tip, lokacija…)"
        class="q-mb-sm"
        clearable
      />
      <q-table
        title="Artikli"
        :rows="filtriraniArtikli"
        :columns="columns"
        row-key="sifra_artikla"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
        @row-click="(_, row) => odaberi(row)"
      >
        <template #body-cell-lokacija="props">
          <q-td :props="props">
            {{ props.row.naziv_lokacije }}
            <div class="text-caption text-grey-7">{{ props.row.adresa_lokacije }}</div>
          </q-td>
        </template>
        <template #body-cell-cijena_dan="props">
          <q-td :props="props">{{ Number(props.row.cijena_dan).toFixed(2) }} €</q-td>
        </template>
      </q-table>

      <div v-if="uredi.sifra_artikla" class="q-gutter-md q-mt-md">
        <div class="text-subtitle1">Uredi artikl #{{ uredi.sifra_artikla }}</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-2">
            <q-input filled v-model="uredi.sifra_artikla" label="ID" readonly />
          </div>
          <div class="col-12 col-md-4">
            <q-input filled v-model="uredi.naziv_artikla" label="Naziv" />
          </div>
          <div class="col-6 col-md-2">
            <q-input
              filled
              type="number"
              min="0"
              v-model.number="uredi.dostupna_kolicina"
              label="Količina"
            />
          </div>
          <div class="col-6 col-md-2">
            <q-input
              filled
              type="number"
              min="0"
              step="0.01"
              v-model.number="uredi.cijena_dan"
              label="Cijena/dan (€)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-select
              filled
              v-model="uredi.sifra_tipa_artikla"
              :options="tipOpcije"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Tip"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-select
              filled
              v-model="uredi.sifra_lokacije"
              :options="lokOpcije"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Lokacija"
            />
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
        label="Filtriraj (naziv, tip, lokacija…)"
        class="q-mb-sm"
        clearable
      />
      <q-list bordered separator>
        <q-item
          v-for="a in filtriraniArtikli"
          :key="a.sifra_artikla"
          clickable
          @click="obrisiUpit(a)"
        >
          <q-item-section>
            <div class="text-body2">#{{ a.sifra_artikla }} — {{ a.naziv_artikla }}</div>
            <div class="text-caption">
              {{ a.tip_artikla }} • {{ Number(a.cijena_dan).toFixed(2) }} € •
              {{ a.naziv_lokacije }} ({{ a.adresa_lokacije }})
            </div>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat color="negative" icon="delete" @click.stop="obrisiUpit(a)" />
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
  name: 'AdminArtikliPage',
  setup() {
    const tab = ref('edit')
    const artikli = ref([])
    const tipovi = ref([])
    const lokacije = ref([])
    const filter = ref('')

    const novo = ref({
      naziv_artikla: '',
      dostupna_kolicina: 0,
      cijena_dan: 0,
      sifra_tipa_artikla: null,
      sifra_lokacije: null,
    })
    const uredi = ref({})

    const columns = [
      { name: 'sifra_artikla', label: 'ID', field: 'sifra_artikla', align: 'left' },
      { name: 'naziv_artikla', label: 'Naziv', field: 'naziv_artikla', align: 'left' },
      { name: 'tip_artikla', label: 'Tip', field: 'tip_artikla', align: 'left' },
      { name: 'cijena_dan', label: 'Cijena/dan (€)', field: 'cijena_dan', align: 'right' },
      { name: 'dostupna_kolicina', label: 'Količina', field: 'dostupna_kolicina', align: 'right' },
      { name: 'lokacija', label: 'Lokacija', field: (r) => r.naziv_lokacije, align: 'left' },
    ]

    const tipOpcije = computed(() =>
      tipovi.value.map((t) => ({ value: t.sifra_tipa_artikla, label: t.tip_artikla })),
    )
    const lokOpcije = computed(() =>
      lokacije.value.map((l) => ({
        value: l.sifra_lokacije,
        label: `${l.naziv_lokacije} (${l.adresa_lokacije})`,
      })),
    )

    const filtriraniArtikli = computed(() => {
      const q = (filter.value || '').toLowerCase().trim()
      if (!q) return artikli.value
      return artikli.value.filter((a) =>
        [a.naziv_artikla, a.tip_artikla, a.naziv_lokacije, a.adresa_lokacije]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    })

    const ucitajArtikle = async () => {
      const r = await axios.get('http://localhost:3000/api/svi-artikli', { withCredentials: true })
      artikli.value = r.data
    }
    const ucitajTipove = async () => {
      const r = await axios.get('http://localhost:3000/api/tipovi-artikla', {
        withCredentials: true,
      })
      tipovi.value = r.data
    }
    const ucitajLokacije = async () => {
      const r = await axios.get('http://localhost:3000/api/lokacije', { withCredentials: true })
      lokacije.value = r.data
    }
    const ucitajSve = async () => {
      try {
        await Promise.all([ucitajArtikle(), ucitajTipove(), ucitajLokacije()])
      } catch (e) {
        console.error(e)
        alert('Greška pri dohvaćanju podataka')
      }
    }

    const odaberi = (row) => {
      uredi.value = {
        sifra_artikla: row.sifra_artikla,
        naziv_artikla: row.naziv_artikla,
        dostupna_kolicina: Number(row.dostupna_kolicina),
        cijena_dan: Number(row.cijena_dan),
        sifra_tipa_artikla: row.sifra_tipa_artikla,
        sifra_lokacije: row.sifra_lokacije,
      }
    }

    const dodaj = async () => {
      try {
        const payload = {
          naziv_artikla: novo.value.naziv_artikla,
          dostupna_kolicina: Number(novo.value.dostupna_kolicina || 0),
          cijena_dan: Number(novo.value.cijena_dan || 0),
          sifra_tipa_artikla: Number(novo.value.sifra_tipa_artikla),
          sifra_lokacije: Number(novo.value.sifra_lokacije),
        }
        await axios.post('http://localhost:3000/api/artikl', payload, { withCredentials: true })
        alert('Artikl dodan')
        novo.value = {
          naziv_artikla: '',
          dostupna_kolicina: 0,
          cijena_dan: 0,
          sifra_tipa_artikla: null,
          sifra_lokacije: null,
        }
        await ucitajArtikle()
        tab.value = 'edit'
      } catch (e) {
        console.error(e)
        alert('Greška pri dodavanju artikla')
      }
    }

    const spremi = async () => {
      try {
        const id = uredi.value.sifra_artikla
        const payload = {
          naziv_artikla: uredi.value.naziv_artikla,
          dostupna_kolicina: Number(uredi.value.dostupna_kolicina || 0),
          cijena_dan: Number(uredi.value.cijena_dan || 0),
          sifra_tipa_artikla: Number(uredi.value.sifra_tipa_artikla),
          sifra_lokacije: Number(uredi.value.sifra_lokacije),
        }
        await axios.put(`http://localhost:3000/api/artikl/${id}`, payload, {
          withCredentials: true,
        })
        alert('Artikl ažuriran')
        await ucitajArtikle()
      } catch (e) {
        console.error(e)
        alert('Greška pri spremanju artikla')
      }
    }

    const obrisiUpit = async (a) => {
      if (!confirm(`Obrisati artikl #${a.sifra_artikla}?`)) return
      try {
        await axios.delete(`http://localhost:3000/api/artikl/${a.sifra_artikla}`, {
          withCredentials: true,
        })
        alert('Artikl obrisan')
        await ucitajArtikle()
      } catch (e) {
        console.error(e)
        const msg =
          e?.response?.data?.error || 'Greška pri brisanju artikla (možda postoji narudžba/stavke).'
        alert(msg)
      }
    }

    onMounted(ucitajSve)
    return {
      tab,
      artikli,
      tipovi,
      lokacije,
      filter,
      novo,
      uredi,
      columns,
      tipOpcije,
      lokOpcije,
      filtriraniArtikli,
      ucitajSve,
      odaberi,
      dodaj,
      spremi,
      obrisiUpit,
    }
  },
}
</script>
