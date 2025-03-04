import { ResourceType } from './Resource';

export type FacilityType = 'farmland' | 'mill';

export interface ProductionRecipe {
    inputs: { type: ResourceType; amount: number; }[];
    output: { type: ResourceType; amount: number; };
}

export interface ProductionFacility {
    id: string;
    type: FacilityType;
    ownerId: string;
    level: number;
    recipes: ProductionRecipe[];
}

// Default production recipes
export const DEFAULT_RECIPES: Record<FacilityType, ProductionRecipe[]> = {
    farmland: [
        {
            inputs: [],
            output: { type: 'grain', amount: 1 }
        },
        {
            inputs: [],
            output: { type: 'corn', amount: 1 }
        },
    ],
    mill: [
        {
            inputs: [{ type: 'grain', amount: 2 }],
            output: { type: 'flour', amount: 1 }
        },
    ],
}; 