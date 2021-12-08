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
                            :value="startSystem.name"
                            @click:append="startSystem = null"
                        ></v-text-field>
                        <v-text-field
                            v-else
                            label="Start system"
                            v-model="startInput"
                            outlined
                            clearable
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
                    </v-toolbar>
                    <v-card-text>
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
                    </v-timeline>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

interface Revealed {
    name: string;
    distance: number;
    fromStart: number;
    starType?: string;
}

@Component
export default class Route extends Vue {

    startSystem: System | null = null;
    startInput = '';
    startInputErrors: string[] = [];

    route: Revealed[] = [];

    setStart(): void {
        const system = this.startInput?.trim();
        if (!system) return;
        this.startInput = '';
        this.startInputErrors = [];

        if (this.intermediate.findIndex((s) => s.name === system) !== -1) {
            this.startInputErrors.push('Already exists');
            return;
        }

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
                    location: response.data.coords,
                };
            })
            .catch((err) => {
                this.startInputErrors.push(err.toString());
            });
    }

    reset(): void {
        this.startSystem = null;
        this.route = [];
    }

    reveal(): void {
        if (!this.startSystem) return;

        function distance3d(from: Location, to: Location) {
            return Math.sqrt(
                Math.pow(Math.abs(to.x - from.x), 2) +
                    Math.pow(Math.abs(to.y - from.y), 2) +
                    Math.pow(Math.abs(to.z - from.z), 2)
            );
        }

        // Calculating distance matrix between intermediate systems
        const distMatrix = Array(this.intermediate.length)
            .fill(null)
            .map(() => Array(this.intermediate.length).fill(0));
        for (const [fx, from] of this.intermediate.entries()) {
            for (const [tx, to] of this.intermediate.entries()) {
                distMatrix[fx][tx] = distance3d(from.location, to.location);
            }
        }

        // Calculating distance from start system to intermediates
        const start = this.startSystem;
        const systems = this.intermediate.map((s) => {
            return {
                name: s.name,
                location: s.location,
                fromStart: distance3d(start.location, s.location),
                starType: s.starType,
            };
        });

        const route: Revealed[] = [];
        let next = systems[0];
        let clearIndex = 0;

        // Searching first system by minimum distance from start
        for (const [sx, sv] of systems.entries()) {
            if (sv.fromStart < next.fromStart) {
                next = sv;
                clearIndex = sx;
            }
        }

        let nextDistance = next.fromStart;
        while (true) {
            route.push({
                name: next.name,
                distance: nextDistance,
                fromStart: next.fromStart,
                starType: next.starType,
            });

            // Remove start and check if any other left
            systems.splice(clearIndex, 1);
            if (systems.length === 0) break;

            // Searching for next nearest intermediate
            const sx = this.intermediate.findIndex((s) => s.name === next.name);
            next = systems[0];
            clearIndex = 0;
            nextDistance =
                distMatrix[sx][
                    this.intermediate.findIndex((s) => s.name === next.name)
                ];
            for (const [cx, cv] of systems.entries()) {
                const nx = this.intermediate.findIndex(
                    (s) => s.name === cv.name
                );
                if (distMatrix[sx][nx] < nextDistance) {
                    nextDistance = distMatrix[sx][nx];
                    next = cv;
                    clearIndex = cx;
                }
            }
        }

        this.route = route;
    }

    starColor(type?: string): string {
        if (!type) return 'primary';
        if (type.startsWith('O ')) return '#f4f5ff';
        if (type.startsWith('B ')) return '#b6c7e3';
        if (type.startsWith('A ')) return '#cef';
        if (type.startsWith('F ')) return '#afc0db';
        if (type.startsWith('G ')) return 'yellow';
        if (type.startsWith('K ')) return 'orange';
        if (type.startsWith('M ')) return 'red';
        if (type.startsWith('L ')) return 'purple';
        if (type.startsWith('T Tauri ')) return 'yellow';
        if (type.startsWith('T ')) return 'purple';
        if (type.startsWith('Y ')) return 'purple';
        if (type.includes('Black')) return 'black';
        if (type.includes('White Dwarf')) return '#486ba3';
        if (type.includes('Neutron')) return '#1958bf';
        if (type.includes('Wolf-Rayet')) return 'white';
        return 'secondary';
    }

}
</script>
