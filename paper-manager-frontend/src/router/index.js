import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Papers from '../pages/Papers.vue'
import Categories from '../pages/Categories.vue'

const routes = [
    { path: '/', name: 'Home', component: Home },
    { path: '/papers', name: 'Papers', component: Papers },
    { path: '/categories', name: 'Categories', component: Categories },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router