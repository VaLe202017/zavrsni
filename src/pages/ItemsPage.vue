<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-primary q-mb-md">Dostupna sportska oprema</div>

    <q-input v-model="search" label="Pretraži opremu..." filled class="q-mb-lg" />

    <q-card v-for="item in filteredItems" :key="item.id" class="q-mb-md bg-krem">
      <q-card-section>
        <div class="text-h6">{{ item.naziv }}</div>
        <div class="text-subtitle2">{{ item.opis }}</div>
        <div class="text-caption">Količina: {{ item.kolicina }}</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="accent" label="Rezerviraj" @click="rezerviraj(item.id)" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from 'boot/axios'

const search = ref('')
const items = ref([])

onMounted(async () => {
  try {
    const res = await api.get('/artikli')
    items.value = res.data
  } catch (err) {
    console.error('Greška kod dohvaćanja artikala:', err)
  }
})

const filteredItems = computed(() =>
  items.value.filter((item) => item.naziv.toLowerCase().includes(search.value.toLowerCase())),
)

function rezerviraj(id) {
  // Ovdje ćeš kasnije dodati POST /api/rezervacija ili sl.
  console.log('Rezervacija artikla ID:', id)
}
</script>

<style scoped>
.text-primary {
  color: #ff8f00;
}
.bg-krem {
  background-color: #fff8e1;
}
</style>
