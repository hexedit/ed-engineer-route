<template>
    <v-dialog :width="width" v-model="show">
        <template v-slot:activator="props">
            <slot name="activator" v-bind="props" />
        </template>
        <v-card>
            <v-card-title>Add component</v-card-title>
            <v-card-text>
                <v-select v-model="type" :items="types" hide-details="auto" />
                <v-select
                    v-model="blueprint"
                    :items="blueprints"
                    :disabled="!type"
                    hide-details="auto"
                />
                <v-list-item>
                    <v-list-item-title>Grade</v-list-item-title>
                    <v-list-item-subtitle>
                        <v-btn-toggle v-model="grade" dense mandatory>
                            <v-btn v-for="g of grades" :key="g">
                                {{ g }}
                            </v-btn>
                        </v-btn-toggle>
                    </v-list-item-subtitle>
                </v-list-item>
                <div class="text-caption">* Grade 1 for experimental-only</div>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="show = false">Cancel</v-btn>
                <v-btn color="success" @click="submit">Add</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { blueprints } from '@/engineers';
import { IComponent } from '@/loadout';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class AddDialog extends Vue {

    @Prop({ default: undefined })
    width!: string | number;

    show = false;

    @Watch('show')
    onShowChanged(v: boolean): void {
        if (!v) {
            this.type = null;
        }
    }

    type: string | null = null;
    blueprint: string | null = null;
    grade = 0;

    @Watch('type')
    ontypeChanged(): void {
        this.blueprint = null;
    }

    @Watch('blueprint')
    onBlueprintChanged(): void {
        this.grade = 0;
    }

    get types(): string[] {
        const res: string[] = [];
        for (const bp of blueprints) {
            if (res.includes(bp.type)) continue;
            res.push(bp.type);
        }
        return res.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
    }

    get blueprints(): string[] {
        const res: string[] = [];
        const typebp = blueprints.filter((bp) => bp.type === this.type);
        for (const bp of typebp) {
            if (res.includes(bp.name)) continue;
            res.push(bp.name);
        }
        return res;
    }

    get grades(): number {
        let res = 0;
        const bps = blueprints.filter(
            (bp) => bp.type === this.type && bp.name === this.blueprint
        );
        for (const bp of bps) {
            if (bp.grade > res) {
                res = bp.grade;
            }
        }
        return res;
    }

    submit(): void {
        const bp = blueprints.find(
            (bp) =>
                bp.type === this.type &&
                bp.name === this.blueprint &&
                bp.grade === this.grade + 1
        );
        if (!bp) return;
        const res: IComponent = {
            module: bp.type,
            blueprint: bp.name,
            grade: bp.grade,
            uuid: bp.uuid,
        };
        this.$emit('add', res);
        this.show = false;
    }

}
</script>
