import React, { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useGame } from '../context/GameContext';
import { MarketListing, Resource, ResourceType, DEFAULT_PRICES } from '../types/Resource';

export const Market: React.FC = () => {
    console.log('Market: Component rendering');
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [selectedResource, setSelectedResource] = useState<ResourceType>('grain');
    const [amount, setAmount] = useState<number>(1);
    const [price, setPrice] = useState<number>(DEFAULT_PRICES.grain);
    const { resources, addResource, removeResource } = useGame();
    const [sortBy, setSortBy] = useState<'price' | 'amount' | 'timestamp'>('timestamp');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filterResource, setFilterResource] = useState<ResourceType | 'all'>('all');
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info' | null}>({text: '', type: null});
    const [sellerNames, setSellerNames] = useState<Record<string, string>>({});

    useEffect(() => {
        console.log('Market: Setting up listings listener');
        const q = query(collection(db, 'market_listings'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('Market: Listings updated');
            const newListings: MarketListing[] = [];
            const sellerIds = new Set<string>();
            
            snapshot.forEach((doc) => {
                const listing = { id: doc.id, ...doc.data() } as MarketListing;
                newListings.push(listing);
                sellerIds.add(listing.sellerId);
            });
            
            console.log('Market: New listings:', newListings);
            setListings(newListings);
            
            // Fetch seller names
            sellerIds.forEach(async (sellerId) => {
                if (!sellerNames[sellerId]) {
                    try {
                        const userDoc = await getDoc(doc(db, 'players', sellerId));
                        if (userDoc.exists() && userDoc.data().displayName) {
                            setSellerNames(prev => ({
                                ...prev,
                                [sellerId]: userDoc.data().displayName
                            }));
                        } else {
                            setSellerNames(prev => ({
                                ...prev,
                                [sellerId]: "Anonymous Trader"
                            }));
                        }
                    } catch (error) {
                        console.error('Error fetching seller name:', error);
                        setSellerNames(prev => ({
                            ...prev,
                            [sellerId]: "Unknown Trader"
                        }));
                    }
                }
            });
        });

        return () => unsubscribe();
    }, []);

    // Handle resource selection changes
    useEffect(() => {
        // Update suggested price based on the selected resource
        setPrice(DEFAULT_PRICES[selectedResource]);
    }, [selectedResource]);

    const createListing = async () => {
        console.log('Market: Attempting to create listing:', {
            resource: selectedResource,
            amount,
            price
        });
        
        if (!auth.currentUser) {
            console.log('Market: No authenticated user');
            setMessage({
                text: 'You need to be signed in to create a listing',
                type: 'error'
            });
            return;
        }
        
        if (removeResource(selectedResource, amount)) {
            console.log('Market: Resources removed, creating listing');
            setMessage({
                text: 'Creating your listing...',
                type: 'info'
            });
            
            const listing: Omit<MarketListing, 'id'> = {
                sellerId: auth.currentUser.uid,
                resource: {
                    id: `${selectedResource}-${Date.now()}`,
                    type: selectedResource,
                    amount,
                    ownerId: auth.currentUser.uid,
                },
                pricePerUnit: price,
                totalAmount: amount,
                timestamp: Date.now(),
            };

            try {
                await addDoc(collection(db, 'market_listings'), listing);
                console.log('Market: Listing created successfully');
                setMessage({
                    text: 'Listing created successfully!',
                    type: 'success'
                });
                
                // Reset form
                setAmount(1);
                setPrice(DEFAULT_PRICES[selectedResource]);
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setMessage({text: '', type: null});
                }, 3000);
            } catch (error) {
                console.error('Market: Error creating listing:', error);
                setMessage({
                    text: 'Error creating listing. Your resources have been returned.',
                    type: 'error'
                });
                // Return the resources to the player if the listing creation fails
                addResource(selectedResource, amount);
            }
        } else {
            console.log('Market: Not enough resources to create listing');
            setMessage({
                text: 'Not enough resources to create this listing',
                type: 'error'
            });
        }
    };

    const buyListing = async (listing: MarketListing) => {
        if (!auth.currentUser) {
            setMessage({
                text: 'You need to be signed in to buy',
                type: 'error'
            });
            return;
        }
        
        const totalCost = listing.pricePerUnit * listing.totalAmount;
        // In a real game, you'd check if the player has enough currency here
        
        try {
            setMessage({
                text: 'Processing purchase...',
                type: 'info'
            });
            
            addResource(listing.resource.type, listing.totalAmount);
            await deleteDoc(doc(db, 'market_listings', listing.id));
            
            setMessage({
                text: `Successfully purchased ${listing.totalAmount} ${listing.resource.type} for ${totalCost} coins`,
                type: 'success'
            });
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage({text: '', type: null});
            }, 3000);
        } catch (error) {
            console.error('Market: Error buying listing:', error);
            setMessage({
                text: 'Error processing purchase',
                type: 'error'
            });
        }
    };

    const removeListing = async (listing: MarketListing) => {
        if (!auth.currentUser) {
            setMessage({
                text: 'You need to be signed in to remove listings',
                type: 'error'
            });
            return;
        }
        
        if (listing.sellerId !== auth.currentUser.uid) {
            setMessage({
                text: 'You can only remove your own listings',
                type: 'error'
            });
            return;
        }
        
        try {
            setMessage({
                text: 'Removing listing...',
                type: 'info'
            });
            
            // Return the resources to the seller
            addResource(listing.resource.type, listing.totalAmount);
            
            // Delete the listing from Firestore
            await deleteDoc(doc(db, 'market_listings', listing.id));
            
            setMessage({
                text: `Listing removed. ${listing.totalAmount} ${listing.resource.type} returned to your inventory.`,
                type: 'success'
            });
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage({text: '', type: null});
            }, 3000);
        } catch (error) {
            console.error('Market: Error removing listing:', error);
            setMessage({
                text: 'Error removing listing',
                type: 'error'
            });
        }
    };

    const getResourceAmount = (type: ResourceType): number => {
        return resources.find(r => r.type === type)?.amount || 0;
    };

    // Filter and sort listings
    const displayedListings = [...listings]
        .filter(listing => filterResource === 'all' || listing.resource.type === filterResource)
        .sort((a, b) => {
            if (sortBy === 'price') {
                return sortDirection === 'asc' 
                    ? a.pricePerUnit - b.pricePerUnit 
                    : b.pricePerUnit - a.pricePerUnit;
            } else if (sortBy === 'amount') {
                return sortDirection === 'asc' 
                    ? a.totalAmount - b.totalAmount 
                    : b.totalAmount - a.totalAmount;
            } else {
                return sortDirection === 'asc' 
                    ? a.timestamp - b.timestamp 
                    : b.timestamp - a.timestamp;
            }
        });

    // Get timestamp in readable format
    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    // Get seller display name
    const getSellerName = (sellerId: string): string => {
        return sellerNames[sellerId] || (sellerId === auth.currentUser?.uid ? "You" : "Anonymous Trader");
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Resource Market</h2>
            
            {/* Notification message */}
            {message.text && (
                <div className={`px-4 py-3 rounded-lg ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' :
                    message.type === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                }`}>
                    {message.text}
                </div>
            )}
            
            {/* Current resources */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-700">Your Resources</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4">
                    {Object.keys(DEFAULT_PRICES).map(type => (
                        <div key={type} className="text-center">
                            <div className="text-xl font-semibold">{getResourceAmount(type as ResourceType)}</div>
                            <div className="text-sm text-gray-500 capitalize">{type}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Create listing form */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-700">Create New Listing</h3>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Resource
                            </label>
                            <select
                                value={selectedResource}
                                onChange={(e) => setSelectedResource(e.target.value as ResourceType)}
                                className="input w-full"
                            >
                                {Object.keys(DEFAULT_PRICES).map(type => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)} (Have: {getResourceAmount(type as ResourceType)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input w-full"
                                min="1"
                                max={getResourceAmount(selectedResource)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price Per Unit
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input w-full"
                                min="1"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={createListing}
                                disabled={getResourceAmount(selectedResource) < amount}
                                className={`btn w-full ${
                                    getResourceAmount(selectedResource) >= amount 
                                    ? 'btn-primary' 
                                    : 'btn-secondary opacity-50 cursor-not-allowed'
                                }`}
                            >
                                Create Listing
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        Total price: {price * amount} coins
                    </div>
                </div>
            </div>

            {/* Filter and sort options */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-700">Market Listings</h3>
                </div>
                <div className="p-4 border-b">
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Resource
                            </label>
                            <select
                                value={filterResource}
                                onChange={(e) => setFilterResource(e.target.value as ResourceType | 'all')}
                                className="input"
                            >
                                <option value="all">All Resources</option>
                                {Object.keys(DEFAULT_PRICES).map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <div className="flex">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'price' | 'amount' | 'timestamp')}
                                    className="input rounded-r-none"
                                >
                                    <option value="timestamp">Date</option>
                                    <option value="price">Price</option>
                                    <option value="amount">Amount</option>
                                </select>
                                <button
                                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                    className="px-3 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-r flex items-center"
                                >
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listings */}
                <div className="divide-y divide-gray-200">
                    {displayedListings.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No listings available. Be the first to create one!
                        </div>
                    ) : (
                        displayedListings.map((listing) => (
                            <div key={listing.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <span className="text-lg font-medium capitalize">
                                                {listing.resource.type}
                                            </span>
                                            {listing.sellerId === auth.currentUser?.uid && (
                                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                    Your Listing
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            <span className="font-medium">{listing.totalAmount}</span> units at <span className="font-medium">{listing.pricePerUnit}</span> coins per unit
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Seller: {getSellerName(listing.sellerId)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            Posted: {formatDate(listing.timestamp)}
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-2 md:mt-0">
                                        <div className="text-lg font-bold mr-4">
                                            {listing.pricePerUnit * listing.totalAmount} coins
                                        </div>
                                        {listing.sellerId === auth.currentUser?.uid ? (
                                            <button
                                                onClick={() => removeListing(listing)}
                                                className="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => buyListing(listing)}
                                                className="btn btn-primary px-4 py-2"
                                            >
                                                Buy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}; 