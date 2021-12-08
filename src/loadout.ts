import { IEngineer } from './engineers';

export interface IComponent {
    module: string;
    blueprint: string;
    grade: number;
    uuid: string;
}

export interface ILoadout {
    components: IComponent[];
}

export function isBlueprintAvailable(
    engineer: IEngineer,
    component: IComponent
): boolean {
    return engineer.blueprints.includes(component.uuid);
}
