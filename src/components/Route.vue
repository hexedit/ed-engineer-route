<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="6">
                <v-card outlined elevation="2">
                    <v-toolbar dense elevation="1" color="primary">
                        <v-toolbar-title>Conditions</v-toolbar-title>
                        <v-spacer />
                        <v-btn
                            text
                            outlined
                            rounded
                            elevation="1"
                            @click="reset"
                        >
                            Reset
                        </v-btn>
                    </v-toolbar>
                    <v-card-text>
                        <v-text-field
                            v-if="!!startSystem"
                            label="Start system"
                            append-icon="mdi-close"
                            readonly
                            outlined
                            hide-details="auto"
                            :value="startSystem.name"
                            @click:append="startSystem = null"
                        ></v-text-field>
                        <v-text-field
                            v-else
                            label="Start system"
                            v-model="startInput"
                            outlined
                            clearable
                            hide-details="auto"
                            :error-messages="startInputErrors"
                            @keypress.enter="setStart"
                        >
                            <v-icon
                                slot="append"
                                color="green"
                                @click="setStart"
                            >
                                mdi-check
                            </v-icon>
                        </v-text-field>
                    </v-card-text>
                </v-card>
                <v-card outlined elevation="2">
                    <v-toolbar dense elevation="1" color="primary">
                        <v-toolbar-title>Loadout</v-toolbar-title>
                        <v-spacer />
                        <add-dialog width="50%" @add="addComponent">
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn
                                    text
                                    outlined
                                    rounded
                                    elevation="1"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    Add
                                </v-btn>
                            </template>
                        </add-dialog>
                        <import-dialog width="50%" @import="importLoadout">
                            <template v-slot:activator="{ on, attrs }">
                                <v-btn
                                    text
                                    outlined
                                    rounded
                                    elevation="1"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    Import
                                </v-btn>
                            </template>
                        </import-dialog>
                    </v-toolbar>
                    <v-card-text>
                        <v-list v-if="loadout">
                            <v-list-item v-if="loadout.ship">
                                <v-list-item-title>
                                    Ship
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ loadout.name }}
                                </v-list-item-subtitle>
                                <v-list-item-subtitle>
                                    {{ loadout.ship }}
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item
                                v-for="(co, cx) of loadout.components"
                                :key="cx"
                                dense
                            >
                                <v-list-item-title>
                                    {{ co.module }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ co.blueprint }}
                                </v-list-item-subtitle>
                                <v-list-item-subtitle>
                                    <v-chip
                                        v-for="grade in co.grade"
                                        :key="grade"
                                        @click="setGrade(co, grade)"
                                    >
                                        {{ grade }}
                                    </v-chip>
                                </v-list-item-subtitle>
                                <v-list-item-action>
                                    <v-btn icon @click="removeComponent(co)">
                                        <v-icon> mdi-close </v-icon>
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6">
                <v-card outlined elevation="2">
                    <v-toolbar dense elevation="1" color="primary">
                        <v-toolbar-title>Result</v-toolbar-title>
                        <v-spacer />
                        <v-btn
                            text
                            outlined
                            rounded
                            elevation="1"
                            @click="reveal"
                        >
                            Reveal
                        </v-btn>
                    </v-toolbar>
                    <v-timeline v-if="route.length > 0" dense align-top>
                        <v-timeline-item v-for="r of route" :key="r.engineer">
                            <v-row align="center">
                                <v-col>
                                    <strong>{{ r.engineer }}</strong>
                                    <div class="text-caption">
                                        {{ r.location.name }}
                                    </div>
                                </v-col>
                                <v-col>
                                    <strong>{{ r.system }}</strong>
                                    <div class="text-caption">
                                        {{ +r.distance.toFixed(2) }}
                                        ({{ +r.fromStart.toFixed(2) }}) ly
                                    </div>
                                </v-col>
                                <v-col>
                                    <strong>{{ r.location.body }}</strong>
                                    <div class="text-caption">
                                        {{ r.location.distance }} ls
                                    </div>
                                </v-col>
                            </v-row>
                        </v-timeline-item>
                    </v-timeline>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import {
    blueprints,
    engineers,
    IEngineer,
    ILocation,
    ISystem,
    ISystemCoords,
} from '@/engineers';
import { IComponent, ILoadout, isBlueprintAvailable } from '@/loadout';
import { Component, Vue } from 'vue-property-decorator';
import AddDialog from './AddDialog.vue';
import ImportDialog from './ImportDialog.vue';

interface Revealed {
    engineer: string;
    system: string;
    distance: number;
    fromStart: number;
    location: ILocation;
}

@Component({
    components: {
        AddDialog,
        ImportDialog,
    },
})
export default class Route extends Vue {

    defaultSystem: ISystem = Object.freeze({
        name: 'Shinrarta Dezhra',
        coords: { x: 55.71875, y: 17.59375, z: 27.15625 },
    });

    engineers = engineers;

    startSystem: ISystem | null = this.defaultSystem;
    startInput = '';
    startInputErrors: string[] = [];

    loadout: ILoadout | null = null;

    route: Revealed[] = [];

    setStart(): void {
        const system = this.startInput?.trim();
        if (!system) return;
        this.startInput = '';
        this.startInputErrors = [];

        this.$http
            .get('system', {
                params: {
                    systemName: system,
                    showCoordinates: 1,
                },
            })
            .then((response) => {
                if (!response.data.name) {
                    this.startInputErrors.push('Not found in EDSM database');
                    return;
                }
                this.startSystem = {
                    name: response.data.name,
                    coords: response.data.coords,
                };
            })
            .catch((err) => {
                this.startInputErrors.push(err.toString());
            });
    }

    reset(): void {
        this.startSystem = this.defaultSystem;
        this.loadout = null;
        this.route = [];
    }

    addComponent(co: IComponent): void {
        if (!this.loadout) {
            this.loadout = {
                name: '',
                ship: '',
                components: [],
            };
        }
        if (this.loadout.components.find((lco) => lco.uuid === co.uuid)) return;
        this.loadout.components.push(co);
    }

    removeComponent(co: IComponent): void {
        if (!this.loadout) return;
        const cx = this.loadout.components.findIndex(
            (lco) => lco.uuid === co.uuid
        );
        if (cx === -1) return;
        this.loadout.components.splice(cx, 1);
        if (this.loadout.components.length === 0) {
            this.loadout = null;
        }
    }

    setGrade(co: IComponent, grade: number): void {
        if (!this.loadout) return;
        const lco = this.loadout.components.find((lco) => lco.uuid === co.uuid);
        if (!lco) return;
        const bp = blueprints.find(
            (bp) =>
                bp.type === co.module &&
                bp.name === co.blueprint &&
                bp.grade === grade
        );
        if (!bp) return;
        lco.grade = bp.grade;
        lco.uuid = bp.uuid;
    }

    importLoadout(loadout: ILoadout): void {
        this.loadout = {
            name: loadout.name,
            ship: loadout.ship,
            components: [],
        };
        for (const co of loadout.components) {
            this.addComponent(co);
        }
    }

    reveal(): void {
        if (!this.startSystem) return;
        if (!this.loadout) return;

        function distance3d(from: ISystemCoords, to: ISystemCoords) {
            return Math.sqrt(
                Math.pow(to.x - from.x, 2) +
                    Math.pow(to.y - from.y, 2) +
                    Math.pow(to.z - from.z, 2)
            );
        }

        // Calculate distances from start system to each engineer
        for (const e of this.engineers) {
            e.system.fromStart = distance3d(
                this.startSystem.coords,
                e.system.coords
            );
        }

        // Determine which engineers we should visit
        const toVisit: IEngineer[] = [];
        for (const co of this.loadout.components) {
            if (toVisit.find((ev) => isBlueprintAvailable(ev, co))) continue;

            const ec = this.engineers.filter((ev) =>
                isBlueprintAvailable(ev, co)
            );
            if (ec.length === 0) continue;

            let vc = ec[0];
            for (const ev of ec) {
                if (ev.system.fromStart === undefined) continue;
                if (vc.system.fromStart === undefined) continue;
                if (ev.system.fromStart < vc.system.fromStart) {
                    vc = ev;
                }
            }
            toVisit.push(vc);
        }
        if (toVisit.length === 0) return;

        // Calculate distance matrix between engineer systems
        const distMatrix = Array(this.engineers.length)
            .fill(null)
            .map(() => Array(this.engineers.length).fill(0));
        for (const [fx, from] of this.engineers.entries()) {
            for (const [tx, to] of this.engineers.entries()) {
                distMatrix[fx][tx] = distance3d(
                    from.system.coords,
                    to.system.coords
                );
            }
        }

        const route: Revealed[] = [];
        let next = toVisit[0];
        let clearIndex = 0;

        // Searching first engineer by minimum distance from start
        for (const [ex, ev] of toVisit.entries()) {
            if (ev.system.fromStart === undefined) continue;
            if (next.system.fromStart === undefined) continue;
            if (ev.system.fromStart < next.system.fromStart) {
                next = ev;
                clearIndex = ex;
            }
        }

        let nextDistance = next.system.fromStart || 0;
        while (true) {
            route.push({
                engineer: next.name,
                system: next.system.name,
                distance: nextDistance,
                fromStart: next.system.fromStart || 0,
                location: next.location,
            });

            // Remove start and check if any other left
            toVisit.splice(clearIndex, 1);
            if (toVisit.length === 0) break;

            // Searching for next nearest intermediate
            const sx = this.engineers.findIndex((s) => s.name === next.name);
            next = toVisit[0];
            clearIndex = 0;
            nextDistance =
                distMatrix[sx][
                    this.engineers.findIndex((s) => s.name === next.name)
                ];
            for (const [cx, cv] of toVisit.entries()) {
                const nx = this.engineers.findIndex((s) => s.name === cv.name);
                if (distMatrix[sx][nx] < nextDistance) {
                    nextDistance = distMatrix[sx][nx];
                    next = cv;
                    clearIndex = cx;
                }
            }
        }

        this.route = route;
    }

}
</script>
