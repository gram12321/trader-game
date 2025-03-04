export type ResourceType = 'grain' | 'corn' | 'flour';

export interface Resource {
    id: string;
    type: ResourceType;
    amount: number;
    ownerId: string;
}

export interface ResourcePrice {
    resourceType: ResourceType;
    price: number;
}

export interface MarketListing {
    id: string;
    sellerId: string;
    resource: Resource;
    pricePerUnit: number;
    totalAmount: number;
    timestamp: number;
}

// Initial resource prices (for reference)
export const DEFAULT_PRICES: Record<ResourceType, number> = {
    grain: 10,
    corn: 12,
    flour: 25,
}; 