<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card>
      <q-card-section>
        <div class="text-h6">Prijava korisnika</div>
        <q-input v-model="email" label="Email" type="email" class="q-mb-sm" />
        <q-input v-model="password" label="Lozinka" type="password" class="q-mb-sm" />
        <q-btn label="Prijavi se" color="primary" @click="login" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      email: '',
      password: '',
    }
  },
  methods: {
    async login() {
      try {
        const res = await axios.post(
          'http://localhost:3000/api/login',
          {
            email: this.email,
            password: this.password,
          },
          {
            withCredentials: true,
          },
        )
        if (res.data.success) {
          localStorage.setItem('korisnik', JSON.stringify(res.data.korisnik))
          this.$router.push('/dashboard')
        } else {
          this.$q.notify({ color: 'negative', message: 'Neispravan email' })
        }
      } catch (err) {
        console.error(err)
      }
    },
  },
}
</script>
