import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ProductionFacility, ProductionRecipe } from '../types/Production';
import { ResourceType } from '../types/Resource';

export const Production: React.FC = () => {
    console.log('Production: Component rendering');
    const { facilities, produce, resources } = useGame();
    const [selectedRecipes, setSelectedRecipes] = useState<Record<string, number>>({});

    useEffect(() => {
        console.log('Production: Facilities updated:', facilities);
    }, [facilities]);

    const canProduce = (facility: ProductionFacility, recipe: ProductionRecipe): boolean => {
        console.log('Production: Checking if can produce:', {
            facility: facility.type,
            recipeInputs: recipe.inputs,
            recipeOutput: recipe.output,
            currentResources: resources
        });
        
        if (!recipe.inputs.length) return true;
        
        return recipe.inputs.every(input => {
            const resource = resources.find(r => r.type === input.type);
            const hasEnough = resource && resource.amount >= input.amount;
            console.log('Production: Resource check:', {
                inputType: input.type,
                inputAmount: input.amount,
                available: resource?.amount || 0,
                hasEnough
            });
            return hasEnough;
        });
    };

    const handleProduce = (facilityId: string) => {
        console.log('Production: Attempting to produce with facility:', facilityId);
        const facility = facilities.find(f => f.id === facilityId);
        if (!facility) return;

        const recipeIndex = selectedRecipes[facilityId] || 0;
        const recipe = facility.recipes[recipeIndex];
        console.log('Production: Selected recipe:', {
            inputs: recipe.inputs,
            output: recipe.output
        });
        
        if (canProduce(facility, recipe)) {
            console.log('Production: Starting production with recipe:', recipe);
            produce(facilityId, recipeIndex);
        }
    };

    const getResourceAmount = (type: ResourceType): number => {
        return resources.find(r => r.type === type)?.amount || 0;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Production Facilities</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {facilities.map((facility) => (
                    <div key={facility.id} className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 capitalize">
                                {facility.type} (Level {facility.level})
                            </h3>
                        </div>

                        {facility.recipes.length > 1 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select what to produce:
                                </label>
                                <select
                                    value={selectedRecipes[facility.id] || 0}
                                    onChange={(e) => setSelectedRecipes({
                                        ...selectedRecipes,
                                        [facility.id]: parseInt(e.target.value)
                                    })}
                                    className="input"
                                >
                                    {facility.recipes.map((recipe, index) => (
                                        <option key={index} value={index}>
                                            {recipe.output.type} ({recipe.output.amount})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 mb-2">Recipe Details:</p>
                            <div className="space-y-2">
                                {facility.recipes[selectedRecipes[facility.id] || 0].inputs.map((input, index) => (
                                    <p key={index} className="text-sm flex justify-between items-center">
                                        <span>
                                            <span className="text-red-600 font-medium">Input:</span>{' '}
                                            {input.amount} {input.type}
                                        </span>
                                        <span className="text-gray-500">
                                            (Have: {getResourceAmount(input.type)})
                                        </span>
                                    </p>
                                ))}
                                <p className="text-sm pt-1 border-t border-gray-200">
                                    <span className="text-green-600 font-medium">Output:</span>{' '}
                                    {facility.recipes[selectedRecipes[facility.id] || 0].output.amount}{' '}
                                    {facility.recipes[selectedRecipes[facility.id] || 0].output.type}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleProduce(facility.id)}
                            disabled={!canProduce(facility, facility.recipes[selectedRecipes[facility.id] || 0])}
                            className={
                                canProduce(facility, facility.recipes[selectedRecipes[facility.id] || 0])
                                    ? 'btn btn-primary w-full'
                                    : 'btn btn-secondary w-full opacity-50 cursor-not-allowed'
                            }
                        >
                            {canProduce(facility, facility.recipes[selectedRecipes[facility.id] || 0])
                                ? 'Produce'
                                : 'Not enough resources'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}; 