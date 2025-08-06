<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="register" class="column q-gutter-md">
      <div class="text-h6">Aplikacija za iznajmljivanje opreme</div>
      <q-input filled v-model="form.ime" label="Ime" />
      <q-input filled v-model="form.prezime" label="Prezime" />
      <q-input filled v-model="form.telefon" label="Broj telefona" />
      <q-input filled v-model="form.email" label="Email" />
      <q-btn type="submit" color="orange" label="Register" />
    </q-form>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'

export default {
  data() {
    return {
      form: {
        ime: '',
        prezime: '',
        telefon: '',
        email: '',
      },
    }
  },
  methods: {
    async register() {
      //try {
      const response = await api.post(
        '/korisnici',
        {
          ime_korisnika: this.form.ime,
          prezime_korisnika: this.form.prezime,
          broj_telefona_korisnika: this.form.telefon,
          email_korisnika: this.form.email,
        },
        { withCredentials: true },
      )
      if (response.data.success) {
        this.$router.push('/korisnici')
      } else {
        this.$q.notify({ color: 'negative', message: 'Krivi podaci' })
      }
      /*} catch (err) {
        this.$q.notify({ color: 'negative', message: 'Greška prilikom registracije' })
      }*/
    },
  },
}
</script>
