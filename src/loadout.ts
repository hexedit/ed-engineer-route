import { blueprints, IEngineer } from './engineers';

export interface IComponent {
    module: string;
    blueprint: string;
    grade: number;
    uuid: string;
}

export interface ILoadout {
    name: string;
    ship: string;
    components: IComponent[];
}

export function isBlueprintAvailable(
    engineer: IEngineer,
    component: IComponent
): boolean {
    return engineer.blueprints.includes(component.uuid);
}

// #region Coriolis loadout

interface ICoriolisLoadout {
    name: string;
    ship: string;
    components: {
        [key: string]: {
            [key: string]: {
                blueprint: {
                    grades: {
                        [key: number]: {
                            uuid: string;
                        };
                    };
                    grade: number;
                };
            };
        };
    };
}

export function parseCoriolis(s: string): ILoadout {
    const input = JSON.parse(s) as ICoriolisLoadout;
    const loadout: ILoadout = {
        name: input.name,
        ship: input.ship,
        components: [],
    };
    for (const cg of Object.values(input.components)) {
        for (const co of Object.values(cg)) {
            if (!co) continue;
            if (co.constructor !== Object) continue;
            if (!co.blueprint) continue;

            let bp = blueprints.find(
                (bp) =>
                    bp.uuid === co.blueprint.grades[co.blueprint.grade].uuid &&
                    bp.grade === co.blueprint.grade
            );
            // Workaround for Coriolis duplicated UUIDs
            if (!bp) {
                const sbp = blueprints.find(
                    (bp) =>
                        bp.uuid === co.blueprint.grades[co.blueprint.grade].uuid
                );
                if (!sbp) continue;
                bp = blueprints.find(
                    (bp) =>
                        bp.type === sbp.type &&
                        bp.name === sbp.name &&
                        bp.grade === co.blueprint.grade
                );
            }
            if (!bp) continue;

            loadout.components.push({
                module: bp.type,
                blueprint: bp.name,
                grade: bp.grade,
                uuid: bp.uuid,
            });
        }
    }
    return loadout;
}

// #endregion Coriolis loadout

// #region SLEF loadout

interface ISLEFLoadout {
    data: {
        Ship: string;
        ShipName: string;
        Modules: {
            Item: string;
            Engineering?: {
                BlueprintName: string;
                Level: number;
            };
        }[];
    };
}

export function parseSLEF(s: string): ILoadout {
    const input = JSON.parse(s) as ISLEFLoadout[];
    const data = input[0].data;

    function shipType(type: string): string {
        const shipTypes: { [key: string]: string } = {
            sidewinder: 'Sidewinder',
            eagle: 'Eagle',
            hauler: 'Hauler',
            adder: 'Adder',
            viper: 'Viper',
            cobramkiii: 'Cobra Mk III',
            type6: 'Type-6 Transporter',
            dolphin: 'Dolphin',
            type7: 'Type-7 Transporter',
            asp: 'Asp Explorer',
            vulture: 'Vulture',
            empire_trader: 'Imperial Clipper',
            federation_dropship: 'Federal Dropship',
            orca: 'Orca',
            type9: 'Type-9 Heavy',
            python: 'Python',
            belugaliner: 'Beluga',
            ferdelance: 'Fer-de-Lance',
            anaconda: 'Andconda',
            federation_corvette: 'Federal Corvette',
            cutter: 'Imperial Cutter',
            diamondback: 'Diamondback Scout',
            empire_courier: 'Imperial Courier',
            diamondbackxl: 'Diamondback Explorer',
            empire_eagle: 'Imperial Eagle',
            federation_dropship_mkii: 'Federal Assault Ship',
            federation_gunship: 'Federal Gunship',
            viper_mkiv: 'Viper Mk IV',
            cobramkiv: 'Cobra Mk IV',
            independant_trader: 'Keelback',
            asp_scout: 'AspScout',
            type9_military: 'Type-10 Defender',
            kraitmkii: 'Krait Mk II',
            typex: 'Alliance Chieftain',
            typex_2: 'Alliance Crusader',
            typex_3: 'Alliance Challenger',
            krait_light: 'Krait Phantom',
            mamba: 'Mamba',
        };
        type = type.toLowerCase();
        if (Object.keys(shipTypes).includes(type)) {
            return shipTypes[type];
        }
        throw new Error(`Unknown ship type: ${type}`);
    }

    function moduleType(type: string): string {
        const moduleTypes: { [key: string]: string } = {
            int_repairer: 'Auto Field-Maintenance Unit',
            int_refinery: 'Refinery',
            int_hullreinforcement: 'Hull Reinforcement Package',
            int_detailedsurfacescanner: 'Detailed Surface Scanner',
            int_fuelscoop: 'Fuel Scoop',
            int_dronecontrol_recon: 'Recon Limpet Controller',
            int_dronecontrol_collection: 'Collector Limpet Controller',
            int_dronecontrol_fueltransfer: 'Fuel Transfer Limpet Controller',
            int_dronecontrol_prospector: 'Prospector Limpet Controller',
            int_dronecontrol_resourcesiphon: 'Hatch Breaker Limpet Controller',
            int_dronecontrol_repair: 'Repair Limpet Controller',
            int_dronecontrol_decontamination:
                'Decontamination Limpet Controller',
            int_fsdinterdictor: 'Frame Shift Drive Interdictor',
            int_shieldgenerator: 'Shield Generator',
            int_shieldcellbank: 'Shield Cell Bank',
            int_powerplant: 'Power Plant',
            int_engine: 'Thrusters',
            int_hyperdrive: 'Frame Shift Drive',
            int_lifesupport: 'Life Support',
            int_powerdistributor: 'Power Distributor',
            int_sensors: 'Sensors',
            hpt_chafflauncher: 'Chaff Launcher',
            hpt_electroniccountermeasure: 'Electronic Countermeasure',
            hpt_heatsinklauncher: 'Heat Sink Launcher',
            hpt_plasmapointdefence: 'Point Defence',
            hpt_shieldbooster: 'Shield Booster',
            hpt_cargoscanner: 'Manifest Scanner',
            hpt_cloudscanner: 'Frame Shift Wake Scanner',
            hpt_crimescanner: 'Kill Warrant Scanner',
            hpt_beamlaser: 'Beam Laser',
            hpt_pulselaserburst: 'Burst Laser',
            hpt_pulselaser: 'Pulse Laser',
            hpt_cannon: 'Cannon',
            hpt_slugshot: 'Fragment Cannon',
            hpt_multicannon: 'Enforcer Cannon',
            hpt_minelauncher: 'Mine Launcher',
            hpt_mininglaser: 'Mining Laser',
            hpt_dumbfiremissilerack: 'Missile Rack',
            hpt_basicmissilerack: 'Seeker Missile Rack',
            hpt_drunkmissilerack: 'Pack-Hound Missile Rack',
            hpt_plasmaaccelerator: 'Plasma Accelerator',
            hpt_railgun: 'Rail Gun',
            hpt_advancedtorppylon: 'Torpedo Pylon',
            hpt_flakmortar: 'Remote Release Flak Launcher',
            hpt_flechettelauncher: 'Remote Release Flechette Launcher',
            hpt_plasmashockcannon: 'Shock Cannon',
        };
        type = type.toLowerCase();
        if (type.includes('_armour_')) {
            return 'Armour';
        }
        for (const [tx, tv] of Object.entries(moduleTypes)) {
            if (type.startsWith(tx)) {
                return tv;
            }
        }
        throw new Error(`Unknown module type: ${type}`);
    }

    const loadout: ILoadout = {
        name: data.ShipName,
        ship: shipType(data.Ship),
        components: [],
    };

    for (const module of data.Modules) {
        if (!module.Engineering) continue;

        const type = moduleType(module.Item);
        const blueprint = module.Engineering.BlueprintName;
        const grade = module.Engineering.Level;

        const bp = blueprints.find(
            (bp) =>
                bp.code === blueprint && bp.type === type && bp.grade === grade
        );
        if (!bp) continue;

        loadout.components.push({
            module: bp.type,
            blueprint: bp.name,
            grade: bp.grade,
            uuid: bp.uuid,
        });
    }

    return loadout;
}

// #endregion SLEF loadout
