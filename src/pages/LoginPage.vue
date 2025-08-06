<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: 400px; background-color: #fff8e1">
      <q-card-section>
        <div class="text-h6 text-center text-primary">Login</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input v-model="username" label="Username" filled dense />
          <q-input v-model="password" label="Password" type="password" filled dense />
          <q-btn type="submit" label="Prijava" color="primary" class="full-width" />
        </q-form>
      </q-card-section>

      <q-card-actions class="justify-end">
        <q-btn flat label="Zaboravljena lozinka?" color="accent" @click="onForgot" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')

function onSubmit() {
  if (username.value && password.value) {
    if (username.value === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }
}

function onForgot() {
  // ovdje možeš dodati logiku za zaboravljenu lozinku
  alert('Funkcionalnost još nije implementirana.')
}
</script>

<style scoped>
.text-primary {
  color: #ff8f00;
}
</style>
