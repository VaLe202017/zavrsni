<template>
  <q-page class="flex flex-center column q-pa-xl">
    <div class="text-h5 text-primary q-mb-lg">Aplikacija za iznajmljivanje opreme</div>
    <div class="row q-gutter-md">
      <q-btn label="Login" color="accent" @click="goToLogin" />
      <q-btn label="Registracija" color="primary" @click="goToRegister" />
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goToLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/register')
}
</script>

<style scoped>
.text-primary {
  color: #ff8f00; /* topla narančasta */
}
</style>
