<template>
    <v-dialog :width="width" v-model="show">
        <template v-slot:activator="props">
            <slot name="activator" v-bind="props" />
        </template>
        <v-card>
            <v-card-title>Import loadout</v-card-title>
            <v-card-text>
                <v-tabs v-model="format" fixed-tabs>
                    <v-tab v-for="lf of formats" :key="lf.name">
                        {{ lf.name }}
                    </v-tab>
                </v-tabs>
                <v-textarea
                    v-model="loadoutInput"
                    :error-messages="loadoutErrors"
                />
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="show = false">Cancel</v-btn>
                <v-btn color="success" @click="submit">Import</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { parseCoriolis, parseSLEF } from '@/loadout';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class AddDialog extends Vue {

    @Prop({ default: undefined })
    width!: string | number;

    show = false;

    @Watch('show')
    onShowChanged(v: boolean): void {
        if (!v) {
            this.format = 0;
            this.loadoutInput = '';
            this.loadoutErrors = [];
        }
    }

    formats = Object.freeze([
        {
            name: 'Coriolis',
            parse: parseCoriolis,
        },
        {
            name: 'SLEF',
            parse: parseSLEF,
        },
    ]);

    format = 0;
    loadoutInput = '';
    loadoutErrors: string[] = [];

    submit(): void {
        try {
            this.loadoutErrors = [];
            this.$emit(
                'import',
                this.formats[this.format].parse(this.loadoutInput.trim())
            );
            this.show = false;
        }
        catch (err: any) {
            this.loadoutErrors.push(err.toString());
        }
    }

}
</script>
