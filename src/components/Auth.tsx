import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const Auth: React.FC = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState('');

    const signIn = async () => {
        setIsSigningIn(true);
        setError('');
        
        try {
            await signInAnonymously(auth);
            // Username will be handled in UsernameSetup component
        } catch (error) {
            console.error('Error signing in:', error);
            setError('Failed to sign in. Please try again.');
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Welcome to Resource Trading Game</h2>
                <p className="text-gray-600 mb-6 text-center">
                    To start playing, click the button below to sign in anonymously.
                    You'll be asked to choose a username after signing in.
                </p>
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <button
                    onClick={signIn}
                    disabled={isSigningIn}
                    className={`w-full ${
                        isSigningIn 
                        ? 'bg-blue-300 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white px-4 py-2 rounded transition-colors`}
                >
                    {isSigningIn ? 'Signing in...' : 'Start Playing'}
                </button>
            </div>
        </div>
    );
}; 