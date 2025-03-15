import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UsernameSetupProps {
    onComplete: () => void;
}

export const UsernameSetup: React.FC<UsernameSetupProps> = ({ onComplete }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCheckingUser, setIsCheckingUser] = useState(true);

    useEffect(() => {
        // Check if the user already has a username
        const checkExistingUsername = async () => {
            if (!auth.currentUser) return;
            
            try {
                const userDoc = await getDoc(doc(db, 'players', auth.currentUser.uid));
                if (userDoc.exists() && userDoc.data().displayName) {
                    // User already has a username, skip this step
                    onComplete();
                } else {
                    setIsCheckingUser(false);
                }
            } catch (error) {
                console.error('Error checking username:', error);
                setIsCheckingUser(false);
            }
        };

        checkExistingUsername();
    }, [onComplete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters long.');
            return;
        }

        if (username.length > 20) {
            setError('Username must be less than 20 characters long.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Check if username is already taken
            const usernameQuery = await getDoc(doc(db, 'usernames', username.toLowerCase()));
            
            if (usernameQuery.exists()) {
                // Username exists, treat this as a login
                const userDoc = await getDoc(doc(db, 'players', usernameQuery.data().userId));
                if (userDoc.exists()) {
                    // Restore user session
                    restoreUserSession(userDoc.data());
                    onComplete();
                    return;
                } else {
                    setError('User data not found. Please try again.');
                    setIsLoading(false);
                    return;
                }
            }

            // Save username
            if (auth.currentUser) {
                // Update player document
                await setDoc(doc(db, 'players', auth.currentUser.uid), {
                    displayName: username,
                    userId: auth.currentUser.uid,
                    createdAt: Date.now()
                }, { merge: true });

                // Reserve username (to ensure uniqueness)
                await setDoc(doc(db, 'usernames', username.toLowerCase()), {
                    userId: auth.currentUser.uid
                });

                // Continue to the game
                onComplete();
            }
        } catch (error) {
            console.error('Error saving username:', error);
            setError('Failed to save username. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to restore user session
    const restoreUserSession = (userData: any) => {
        // Logic to restore user data such as production, inventory, coins, etc.
        console.log('Restoring user session:', userData);
        // Implement session restoration logic here
    };

    if (isCheckingUser) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Choose a Username</h2>
                <p className="text-gray-600 mb-6 text-center">
                    Please choose a username that will be displayed to other players in the marketplace.
                </p>
                
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter a username"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full ${
                            isLoading 
                            ? 'bg-blue-300 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white px-4 py-2 rounded transition-colors`}
                    >
                        {isLoading ? 'Saving...' : 'Continue to Game'}
                    </button>
                </form>
            </div>
        </div>
    );
}; 