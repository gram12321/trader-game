import { useState, useEffect } from 'react';
import { auth } from './config/firebase';
import { User } from 'firebase/auth';
import { GameProvider } from './context/GameContext';
import { Inventory } from './components/Inventory';
import { Production } from './components/Production';
import { Market } from './components/Market';
import { Auth } from './components/Auth';
import { UsernameSetup } from './components/UsernameSetup';

function App() {
    console.log('App: Rendering');
    const [activeTab, setActiveTab] = useState<'inventory' | 'production' | 'market'>('production');
    const [showGame, setShowGame] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [needsUsername, setNeedsUsername] = useState(false);

    useEffect(() => {
        console.log('App: Setting up auth listener');
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('App: Auth state changed:', { userId: user?.uid, isAnonymous: user?.isAnonymous });
            setUser(user);
            setNeedsUsername(!!user); // Initially assume we need username setup if user is logged in
        });

        return () => unsubscribe();
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex items-center justify-center p-8">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
                    <h1 className="text-4xl md:text-5xl font-bold text-center text-green-800 mb-8">Resource Trading Game</h1>
                    <Auth />
                </div>
            </div>
        );
    }

    if (needsUsername) {
        return <UsernameSetup onComplete={() => setNeedsUsername(false)} />;
    }

    if (!showGame) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white">
                <div className="max-w-6xl mx-auto pt-12 md:pt-20 px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">Resource Trading Game</h1>
                        <p className="text-lg md:text-xl text-green-100 mb-8 max-w-3xl mx-auto">
                            Build your farming empire and trade resources in this multiplayer economic simulation
                        </p>
                        <button
                            onClick={() => setShowGame(true)}
                            className="bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                        >
                            Start Playing
                        </button>
                    </div>

                    {/* Game features */}
                    <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-16">
                        <div className="bg-green-700/50 backdrop-blur-sm p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">🌾 Production</h2>
                            <p className="text-green-100">
                                Manage your farms and mills to produce valuable resources like grain, corn, and flour.
                            </p>
                        </div>
                        <div className="bg-green-700/50 backdrop-blur-sm p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">💰 Trading</h2>
                            <p className="text-green-100">
                                Buy and sell resources in the marketplace. Set your own prices and trade with other players.
                            </p>
                        </div>
                        <div className="bg-green-700/50 backdrop-blur-sm p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">📈 Economy</h2>
                            <p className="text-green-100">
                                Experience a dynamic player-driven economy. Prices fluctuate based on supply and demand.
                            </p>
                        </div>
                    </div>

                    {/* How to play section */}
                    <div className="mt-12 md:mt-16 bg-green-700/50 backdrop-blur-sm p-6 md:p-8 rounded-lg">
                        <h2 className="text-2xl md:text-3xl font-bold mb-6">How to Play</h2>
                        <ol className="list-decimal list-inside space-y-4 text-green-100 text-lg">
                            <li>Start with a basic farm to produce grain or corn</li>
                            <li>Build a mill to process grain into valuable flour</li>
                            <li>Trade your resources in the marketplace</li>
                            <li>Expand your production and grow your empire</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <GameProvider>
            <div className="min-h-screen bg-gray-100 flex flex-col">
                {/* Navigation */}
                <nav className="bg-white shadow-lg sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex space-x-1 md:space-x-8">
                                <button
                                    className={`h-full px-3 md:px-6 focus:outline-none border-b-2 transition-colors ${
                                        activeTab === 'inventory'
                                            ? 'border-blue-500 text-blue-500'
                                            : 'border-transparent text-gray-500 hover:text-blue-500'
                                    }`}
                                    onClick={() => setActiveTab('inventory')}
                                >
                                    Inventory
                                </button>
                                <button
                                    className={`h-full px-3 md:px-6 focus:outline-none border-b-2 transition-colors ${
                                        activeTab === 'production'
                                            ? 'border-blue-500 text-blue-500'
                                            : 'border-transparent text-gray-500 hover:text-blue-500'
                                    }`}
                                    onClick={() => setActiveTab('production')}
                                >
                                    Production
                                </button>
                                <button
                                    className={`h-full px-3 md:px-6 focus:outline-none border-b-2 transition-colors ${
                                        activeTab === 'market'
                                            ? 'border-blue-500 text-blue-500'
                                            : 'border-transparent text-gray-500 hover:text-blue-500'
                                    }`}
                                    onClick={() => setActiveTab('market')}
                                >
                                    Market
                                </button>
                            </div>
                            <button
                                onClick={() => auth.signOut()}
                                className="text-gray-500 hover:text-red-500 transition-colors px-4 py-2"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main content */}
                <main className="flex-1 container mx-auto py-6 px-4 max-w-7xl">
                    {activeTab === 'inventory' && <Inventory />}
                    {activeTab === 'production' && <Production />}
                    {activeTab === 'market' && <Market />}
                </main>
            </div>
        </GameProvider>
    );
}

export default App; 