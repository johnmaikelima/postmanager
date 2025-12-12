import React, { useState, useEffect } from 'react';
import { Facebook, Sparkles, Image as ImageIcon, Calendar, Settings, Link2, LogOut } from 'lucide-react';
import Login from './components/Login';
import FeedLoader from './components/FeedLoader';
import PostEditor from './components/PostEditor';
import ImageEditor from './components/ImageEditor';
import ScheduledPosts from './components/ScheduledPosts';
import PostImporter from './components/PostImporter';
import SettingsPage from './components/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedPost, setSelectedPost] = useState(null);

  // Verificar se já está logado ao carregar
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      // Verificar se token ainda é válido
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: savedToken })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpar
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        })
        .catch(err => {
          console.error('Error verifying token:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'importer', label: 'Importar por Link', icon: Link2 },
    { id: 'feed', label: 'Carregar Posts', icon: Facebook },
    { id: 'editor', label: 'Editor de Posts', icon: Sparkles },
    { id: 'image', label: 'Editor de Imagens', icon: ImageIcon },
    { id: 'scheduled', label: 'Posts Agendados', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Post Generator</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Gerenciador de Posts para Facebook</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="container mx-auto px-3 sm:px-4">
          <nav className="flex space-x-1 min-w-max sm:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
          {activeTab === 'importer' && <PostImporter onPostImported={handleSelectPost} />}
          {activeTab === 'feed' && <FeedLoader onSelectPost={handleSelectPost} />}
          {activeTab === 'editor' && <PostEditor selectedPost={selectedPost} />}
          {activeTab === 'image' && <ImageEditor />}
          {activeTab === 'scheduled' && <ScheduledPosts />}
          {activeTab === 'settings' && <SettingsPage user={user} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Post Generator. Sistema de gerenciamento de posts para Facebook.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
