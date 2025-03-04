import React, { createContext, useContext, useEffect, useState } from 'react';
import { Resource, ResourceType } from '../types/Resource';
import { ProductionFacility, FacilityType, DEFAULT_RECIPES } from '../types/Production';
import { auth, db } from '../config/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

interface GameState {
    resources: Resource[];
    facilities: ProductionFacility[];
    addResource: (type: ResourceType, amount: number) => void;
    removeResource: (type: ResourceType, amount: number) => boolean;
    produce: (facilityId: string, recipeIndex: number) => void;
}

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [facilities, setFacilities] = useState<ProductionFacility[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const createInitialFacilities = (userId: string): ProductionFacility[] => {
        console.log('GameProvider: Creating initial facilities for user:', userId);
        return [
            {
                id: 'farmland-1',
                type: 'farmland',
                ownerId: userId,
                level: 1,
                recipes: DEFAULT_RECIPES.farmland,
            },
            {
                id: 'mill-1',
                type: 'mill',
                ownerId: userId,
                level: 1,
                recipes: DEFAULT_RECIPES.mill,
            },
        ];
    };

    // Load player data from Firebase on auth state change
    useEffect(() => {
        console.log('GameProvider: Setting up auth state listener');
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log('GameProvider: Auth state changed:', user?.uid);
            if (user) {
                try {
                    const userDoc = doc(db, 'players', user.uid);
                    console.log('GameProvider: Fetching user data from Firebase');
                    const userData = await getDoc(userDoc);
                    
                    if (userData.exists()) {
                        console.log('GameProvider: User data found:', userData.data());
                        const data = userData.data();
                        
                        // Check if facilities exist and are not empty
                        if (!data.facilities || data.facilities.length === 0) {
                            console.log('GameProvider: No facilities found, creating initial facilities');
                            const initialFacilities = createInitialFacilities(user.uid);
                            setFacilities(initialFacilities);
                            
                            // Update Firebase with the new facilities
                            await setDoc(userDoc, {
                                resources: data.resources || [],
                                facilities: initialFacilities,
                            }, { merge: true });
                        } else {
                            setFacilities(data.facilities);
                        }
                        
                        setResources(data.resources || []);
                    } else {
                        console.log('GameProvider: Creating new user data');
                        const initialFacilities = createInitialFacilities(user.uid);
                        setFacilities(initialFacilities);
                        
                        // Then save to Firebase
                        try {
                            await setDoc(userDoc, {
                                resources: [],
                                facilities: initialFacilities,
                            });
                            console.log('GameProvider: Initial user data saved successfully');
                        } catch (error) {
                            console.error('GameProvider: Error saving initial user data:', error);
                        }
                    }
                    setIsInitialized(true);
                } catch (error) {
                    console.error('GameProvider: Error initializing game data:', error);
                }
            } else {
                // Reset state when user signs out
                setResources([]);
                setFacilities([]);
                setIsInitialized(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Save player data to Firebase when it changes
    useEffect(() => {
        const saveData = async () => {
            const user = auth.currentUser;
            if (user) {
                console.log('GameProvider: Saving updated data to Firebase:', {
                    resources,
                    facilities
                });
                const userDoc = doc(db, 'players', user.uid);
                await setDoc(userDoc, {
                    resources,
                    facilities,
                }, { merge: true });
            }
        };

        saveData();
    }, [resources, facilities]);

    const addResource = (type: ResourceType, amount: number) => {
        const existingResource = resources.find(r => r.type === type && r.ownerId === auth.currentUser?.uid);
        if (existingResource) {
            setResources(resources.map(r =>
                r.id === existingResource.id
                    ? { ...r, amount: r.amount + amount }
                    : r
            ));
        } else {
            setResources([...resources, {
                id: `${type}-${Date.now()}`,
                type,
                amount,
                ownerId: auth.currentUser?.uid || '',
            }]);
        }
    };

    const removeResource = (type: ResourceType, amount: number): boolean => {
        const resource = resources.find(r => r.type === type && r.ownerId === auth.currentUser?.uid);
        if (!resource || resource.amount < amount) return false;

        setResources(resources.map(r =>
            r.id === resource.id
                ? { ...r, amount: r.amount - amount }
                : r
        ));
        return true;
    };

    const produce = (facilityId: string, recipeIndex: number) => {
        console.log('GameContext: Starting production');
        const facility = facilities.find(f => f.id === facilityId);
        if (!facility || recipeIndex >= facility.recipes.length) {
            console.log('GameContext: Invalid facility or recipe index');
            return;
        }

        const recipe = facility.recipes[recipeIndex];
        console.log('GameContext: Using recipe:', recipe);

        // Check if we have enough input resources
        const canProduce = recipe.inputs.every(input => {
            const hasResource = resources.some(r => r.type === input.type && r.amount >= input.amount);
            console.log('GameContext: Resource check:', {
                type: input.type,
                required: input.amount,
                available: resources.find(r => r.type === input.type)?.amount || 0,
                hasEnough: hasResource
            });
            return hasResource;
        });

        console.log('GameContext: Can produce?', canProduce);

        if (canProduce) {
            // Create a new resources array to handle all changes at once
            let newResources = [...resources];

            // Remove input resources
            for (const input of recipe.inputs) {
                console.log('GameContext: Removing input:', input);
                const resourceIndex = newResources.findIndex(r => r.type === input.type);
                if (resourceIndex !== -1) {
                    newResources[resourceIndex] = {
                        ...newResources[resourceIndex],
                        amount: newResources[resourceIndex].amount - input.amount
                    };
                }
            }

            // Add output resource
            const existingOutputIndex = newResources.findIndex(r => r.type === recipe.output.type);
            if (existingOutputIndex !== -1) {
                newResources[existingOutputIndex] = {
                    ...newResources[existingOutputIndex],
                    amount: newResources[existingOutputIndex].amount + recipe.output.amount
                };
            } else {
                newResources.push({
                    id: `${recipe.output.type}-${Date.now()}`,
                    type: recipe.output.type,
                    amount: recipe.output.amount,
                    ownerId: auth.currentUser?.uid || ''
                });
            }

            console.log('GameContext: Setting new resources:', newResources);
            setResources(newResources);
        }
    };

    return (
        <GameContext.Provider value={{
            resources,
            facilities,
            addResource,
            removeResource,
            produce,
        }}>
            {children}
        </GameContext.Provider>
    );
}; 