<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Aplikacija za iznajmljivanje opreme</div>
      <div>
        <q-btn color="orange" label="Odjava" rounded @click="logout" />
      </div>
    </div>

    <div class="row">
      <div>
        <div class="text-subtitle1 q-mb-sm">Stranice &nbsp;→</div>
        <div class="row q-gutter-md">
          <q-card
            v-for="item in items"
            :key="item.label"
            class="q-pa-md"
            style="width: 100px; height: 140px"
            flat
            bordered
            @click="goToPage(item.route)"
          >
            <div class="column items-center">
              <q-avatar size="60px" color="orange" class="q-mb-sm" />
              <div class="text-center">{{ item.label }}</div>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import axios from 'axios'
export default {
  name: 'AfterLogin',
  data() {
    const logout = async () => {
      await axios.post('http://localhost:3000/api/logout', {}, { withCredentials: true })
      window.location.href = '/'
    }
    return {
      items: [
        { label: 'Artikli', route: '/artikli' },
        { label: 'Košarica', route: '/kosarica' },
      ],
      logout,
    }
  },
  methods: {
    goToPage(route) {
      this.$router.push(route)
    },
  },
}
</script>
