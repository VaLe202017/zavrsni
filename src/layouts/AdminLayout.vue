<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          Aplikacija za iznajmljivanje sportske opreme <strong>ADMIN SUČELJE</strong>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list style="padding-top: 20%">
        <EssentialLink
          style="padding-top: 5%"
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Menu',
    icon: 'school',
    link: '#/admin',
  },
  {
    title: 'Korisnici',
    icon: 'school',
    link: '#/admin/korisnik',
  },
  {
    title: 'Artikli',
    icon: 'code',
    link: '#/admin/artikl',
  },
  {
    title: 'Tipovi artikala',
    icon: 'code',
    link: '#/admin/tip_artikla',
  },
  {
    title: 'Lokacije',
    icon: 'code',
    link: '#/admin/lokacija',
  },
  {
    title: 'Narudžbe',
    icon: 'code',
    link: '#/admin/narudzba',
  },
  {
    title: 'Uplate',
    icon: 'code',
    link: '#/admin/uplata',
  },
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
