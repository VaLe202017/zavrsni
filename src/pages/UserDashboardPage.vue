<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h6 text-primary">Aplikacija za iznajmljivanje opreme</div>
      <q-btn flat label="Odjava" color="accent" @click="logout" />
    </div>

    <div class="column items-center q-gutter-md">
      <q-btn
        round
        unelevated
        color="primary"
        size="xl"
        icon="person"
        label="Admin"
        @click="goToAdmin"
      />
      <q-btn
        round
        unelevated
        color="accent"
        size="xl"
        icon="sports_handball"
        label="Korisnik"
        @click="goToUser"
      />
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function logout() {
  router.push('/')
}

function goToAdmin() {
  router.push('/admin')
}

function goToUser() {
  router.push('/artikli')
}
</script>

<style scoped>
.text-primary {
  color: #ff8f00;
}
</style>
