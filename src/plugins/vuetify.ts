import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        options: {
            customProperties: true
        },
        themes: {
            light: {
                primary: '#f07b05',
                secondary: '#ffb000',
                accent: '#0a8bd6',
                error: '#ff0000',
                info: '#00b3f7',
                success: '#029e4c',
                warning: '#ff7100',
            }
        }
    }
});
