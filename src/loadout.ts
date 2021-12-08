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

export function parseSLEF(): ILoadout {
    throw new Error('SLEF import is not implemented');
}

// #endregion SLEF loadout
