<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 420px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Admin prijava</div>
        <div class="text-caption text-grey-7">Unesite administratorske podatke</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input v-model="username" label="Korisničko ime" filled autofocus @keyup.enter="login" />
        <q-input v-model="password" label="Lozinka" type="password" filled @keyup.enter="login" />
        <q-btn color="primary" label="Prijava" class="full-width" @click="login" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'AdminLoginPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const username = ref('')
    const password = ref('')

    const login = async () => {
      try {
        const res = await axios.post(
          'http://localhost:3000/api/admin',
          { username: username.value, password: password.value },
          { withCredentials: true },
        )
        if (res.data?.success) {
          const redirect = route.query.redirect || '/admin/dashboard'
          router.replace(redirect)
        } else {
          alert('Neispravni podaci')
        }
      } catch (e) {
        console.error(e)
        alert('Neispravni podaci ili greška na serveru')
      }
    }

    return { username, password, login }
  },
}
</script>
