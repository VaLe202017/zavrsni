<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-primary q-mb-lg">Aplikacija za iznajmljivanje sportske opreme</div>

    <q-separator class="q-my-md" />

    <div class="q-gutter-md column">
      <q-btn
        label="Pregled opreme"
        color="primary"
        icon="inventory_2"
        @click="router.push('/artikli')"
        unelevated
      />
      <q-btn
        label="Košarica"
        color="primary"
        icon="shopping_cart"
        @click="router.push('/kosarica')"
        unelevated
      />
    </div>

    <q-separator class="q-my-md" />

    <div class="q-gutter-md row">
      <q-btn
        v-if="!authenticated"
        label="Login"
        color="accent"
        icon="login"
        @click="router.push('/login')"
      />
      <q-btn
        v-if="!authenticated"
        label="Registracija"
        color="accent"
        icon="person_add"
        @click="router.push('/register')"
      />
      <q-btn v-if="authenticated" label="Odjava" color="negative" icon="logout" @click="logout" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'

const router = useRouter()
const authenticated = ref(false)

onMounted(async () => {
  try {
    const res = await api.get('/auth/check')
    authenticated.value = res.data.authenticated
  } catch (err) {
    console.error('Greška kod provjere autentifikacije:', err)
  }
})

async function logout() {
  try {
    await api.post('/logout')
    authenticated.value = false
    router.push('/')
  } catch (err) {
    console.error('Greška pri odjavi:', err)
  }
}
</script>

<style scoped>
.text-primary {
  color: #ff8f00;
}
</style>
