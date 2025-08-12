<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="register" class="column q-gutter-md">
      <div class="text-h6">Aplikacija za iznajmljivanje opreme</div>
      <q-input filled v-model="form.ime" label="Ime" required />
      <q-input filled v-model="form.prezime" label="Prezime" required />
      <q-input filled v-model="form.telefon" label="Broj telefona" required />
      <q-input filled v-model="form.email" label="Email" required />
      <q-input filled v-model="form.password" label="Password" type="password" required />
      <q-btn type="submit" color="orange" label="Register" />
    </q-form>
  </q-page>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RegisterPage',
  data() {
    return {
      form: {
        ime: '',
        prezime: '',
        telefon: '',
        email: '',
        password: '',
      },
    }
  },
  methods: {
    async register() {
      try {
        const response = await axios.post(
          'http://localhost:3000/api/register',
          {
            ime_korisnika: this.form.ime,
            prezime_korisnika: this.form.prezime,
            broj_telefona_korisnika: this.form.telefon,
            email_korisnika: this.form.email,
            password: this.form.password,
          },
          { withCredentials: true },
        )

        if (response.status === 201 || response.data.success) {
          alert('Registracija uspješna.')
          this.$router.push('/dashboard')
        } else {
          alert('Registracija nije uspjela. Pokušajte ponovno.')
        }
      } catch (error) {
        console.error(error)
        alert('Greška tijekom registracije.')
      }
    },
  },
}
</script>
