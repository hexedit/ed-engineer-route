<template>
    <v-app>
        <v-app-bar app color="primary" dark>
            <div class="d-flex align-center">
                <v-toolbar-title>{{ title }}</v-toolbar-title>
            </div>

            <v-spacer></v-spacer>
        </v-app-bar>

        <v-main>
            <route />
        </v-main>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Route from './components/Route.vue';

@Component({
    components: {
        Route,
    },
})
export default class App extends Vue {

    title = document.title;

}
</script>
