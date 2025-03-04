import React from 'react';
import { useGame } from '../context/GameContext';
import { ResourceType } from '../types/Resource';

export const Inventory: React.FC = () => {
    const { resources } = useGame();

    const resourcesByType = (type: ResourceType) => {
        return resources.find(r => r.type === type)?.amount || 0;
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['grain', 'corn', 'flour'] as ResourceType[]).map((type) => (
                    <div key={type} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold capitalize">{type}</h3>
                            <span className="text-2xl font-bold">{resourcesByType(type)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 