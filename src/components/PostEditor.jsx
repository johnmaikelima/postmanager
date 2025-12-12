import React, { useState, useEffect } from 'react';
import { Wand2, Hash, TrendingUp, Send, Clock, Facebook, Upload, ImageIcon, Sparkles, Loader2 } from 'lucide-react';

function PostEditor({ selectedPost }) {
  const [originalText, setOriginalText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [userPages, setUserPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalTitle, setOriginalTitle] = useState(''); // Título original do scraper
  const [availableLogos, setAvailableLogos] = useState([]);
  const [selectedLogo, setSelectedLogo] = useState('page'); // 'page' ou nome do arquivo

  useEffect(() => {
    console.log('📦 selectedPost recebido:', selectedPost);
    
    if (selectedPost?.message) {
      setOriginalText(selectedPost.message);
      setEditedText(selectedPost.message);
    } else if (selectedPost?.text) {
      // Dados do scraper
      setOriginalText(selectedPost.text);
      setEditedText(selectedPost.text);
      setOriginalTitle(selectedPost.title || ''); // Salvar título original
      console.log('📰 Título do scraper salvo:', selectedPost.title);
    }
    
    // Carregar imagem se disponível
    if (selectedPost?.imagePath) {
      setCurrentImage(selectedPost.imagePath);
      setImagePreview(selectedPost.imagePath);
    } else if (selectedPost?.full_picture) {
      setImagePreview(selectedPost.full_picture);
    }
  }, [selectedPost]);

  useEffect(() => {
    loadUserPages();
    loadAvailableLogos();
  }, []);

  const loadAvailableLogos = async () => {
    try {
      console.log('🔍 Carregando logos disponíveis...');
      const response = await fetch('/api/image/logos');
      const data = await response.json();
      
      console.log('📦 Resposta da API:', data);
      
      if (data.success) {
        console.log(`✅ ${data.logos.length} logo(s) carregado(s):`, data.logos);
        setAvailableLogos(data.logos);
      } else {
        console.error('❌ Erro ao carregar logos:', data.error);
      }
    } catch (err) {
      console.error('❌ Error loading logos:', err);
    }
  };

  const loadUserPages = async () => {
    try {
      const response = await fetch('/api/facebook/pages');
      const data = await response.json();
      
      if (data.success && data.pages.length > 0) {
        setUserPages(data.pages);
        setSelectedPageId(data.pages[0].id); // Seleciona primeira página por padrão
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setCurrentImage(data.file.path);
        setImagePreview(data.file.url);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Erro ao carregar imagem');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch('/api/image/upload-logo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        // Recarregar lista de logos
        await loadAvailableLogos();
        // Selecionar o logo recém-enviado
        setSelectedLogo(data.filename);
        alert('Logo enviado com sucesso!');
      } else {
        alert('Erro ao enviar logo: ' + data.error);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Erro ao enviar logo');
    }
  };

  const applyImageTemplate = async () => {
    if (!currentImage || !editedText.trim()) {
      alert('É necessário ter uma imagem e um texto para aplicar o template');
      return;
    }

    setLoading(true);
    try {
      // Usar título original do scraper se disponível
      let title = originalTitle || '';
      
      console.log('🔍 Título original do scraper:', title);
      
      // Se não tiver título original, extrair da primeira linha ou até o primeiro ponto
      if (!title) {
        const lines = editedText.split('\n').filter(line => line.trim());
        let firstLine = lines[0] || 'Notícia';
        
        // Se a primeira linha for muito longa (sem quebras), pegar até o primeiro ponto final
        if (firstLine.length > 150) {
          const firstPeriod = firstLine.indexOf('. ');
          if (firstPeriod > 0 && firstPeriod < 150) {
            firstLine = firstLine.substring(0, firstPeriod);
          } else {
            // Se não tiver ponto, pegar primeiras 100 caracteres
            firstLine = firstLine.substring(0, 100);
          }
        }
        
        title = firstLine;
        console.log('🔍 Extraído da primeira linha:', title);
      }

      // Limpar título: remover apenas a parte após " - " (nome do site)
      let cleanTitle = title
        .replace(/^[📰🔥💡⚡✨🎯]+\s*/, '') // Remove emojis do início
        .trim();
      
      console.log('🔍 Título após remover emoji:', cleanTitle);
      
      // Se tiver " - " seguido de texto (nome do site), remove essa parte
      const dashIndex = cleanTitle.lastIndexOf(' - ');
      if (dashIndex > 0) {
        cleanTitle = cleanTitle.substring(0, dashIndex).trim();
      }
      
      // Também tenta com outros tipos de traço
      const enDashIndex = cleanTitle.lastIndexOf(' – ');
      if (enDashIndex > 0) {
        cleanTitle = cleanTitle.substring(0, enDashIndex).trim();
      }
      
      const emDashIndex = cleanTitle.lastIndexOf(' — ');
      if (emDashIndex > 0) {
        cleanTitle = cleanTitle.substring(0, emDashIndex).trim();
      }
      
      console.log('✅ Título final para template:', cleanTitle);

      // Pegar informações da página selecionada
      const selectedPage = userPages.find(p => p.id === selectedPageId);
      const pageName = selectedPage?.name || 'PAPEL POP';
      
      // Determinar qual logo usar
      let logoUrl = null;
      if (selectedLogo === 'page') {
        // Usar logo da página do Facebook
        logoUrl = selectedPage?.picture?.data?.url || null;
      } else if (selectedLogo !== 'none') {
        // Usar logo personalizado da pasta logos/
        const logo = availableLogos.find(l => l.name === selectedLogo);
        if (logo) {
          logoUrl = `http://localhost:3000${logo.path}`;
        }
      }

      const response = await fetch('/api/image/create-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePath: currentImage.replace(/^\//, ''), // Remove barra inicial se houver
          title: cleanTitle,
          watermark: '@CURIOSONAUTA',
          pageLogoUrl: logoUrl,
          pageName: pageName
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentImage(data.file.path);
        setImagePreview(data.file.url);
        alert('✅ Template aplicado com sucesso!');
      } else {
        alert('Erro ao aplicar template: ' + data.error);
      }
    } catch (err) {
      console.error('Error applying template:', err);
      alert('Erro ao aplicar template');
    } finally {
      setLoading(false);
    }
  };

  const rewriteText = async () => {
    if (!originalText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, tone })
      });
      
      const data = await response.json();
      if (data.success) {
        setEditedText(data.rewritten);
      }
    } catch (err) {
      console.error('Error rewriting text:', err);
      alert('Erro ao reescrever texto');
    } finally {
      setLoading(false);
    }
  };

  const generateVariations = async () => {
    if (!originalText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, count: 3 })
      });
      
      const data = await response.json();
      if (data.success) {
        setVariations(data.variations);
      }
    } catch (err) {
      console.error('Error generating variations:', err);
      alert('Erro ao gerar variações');
    } finally {
      setLoading(false);
    }
  };

  const generateHashtags = async () => {
    if (!editedText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedText, count: 5 })
      });
      
      const data = await response.json();
      if (data.success) {
        setHashtags(data.hashtags);
      }
    } catch (err) {
      console.error('Error generating hashtags:', err);
      alert('Erro ao gerar hashtags');
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!editedText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedText })
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error analyzing text:', err);
      alert('Erro ao analisar texto');
    } finally {
      setLoading(false);
    }
  };

  const publishNow = async () => {
    if (!editedText.trim()) {
      alert('Digite um texto para publicar');
      return;
    }
    
    if (!selectedPageId && userPages.length > 0) {
      alert('Selecione uma página para publicar');
      return;
    }
    
    if (!confirm('Deseja publicar este post agora?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/facebook/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: editedText,
          imagePath: currentImage || selectedPost?.full_picture,
          targetPageId: selectedPageId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Post publicado com sucesso!');
        setEditedText('');
        setOriginalText('');
      } else {
        alert('Erro ao publicar: ' + data.error);
      }
    } catch (err) {
      console.error('Error publishing:', err);
      alert('Erro ao publicar post');
    } finally {
      setLoading(false);
    }
  };

  const schedulePost = async () => {
    if (!editedText.trim() || !scheduledTime) {
      alert('Digite um texto e escolha uma data/hora');
      return;
    }
    
    if (!selectedPageId && userPages.length > 0) {
      alert('Selecione uma página para publicar');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: editedText,
          imagePath: currentImage || selectedPost?.full_picture,
          scheduledTime,
          targetPageId: selectedPageId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Post agendado com sucesso!');
        setScheduledTime('');
      } else {
        alert('Erro ao agendar: ' + data.error);
      }
    } catch (err) {
      console.error('Error scheduling:', err);
      alert('Erro ao agendar post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Editor de Posts</h2>
        <p className="text-gray-600 mt-1">
          Use IA para reescrever e otimizar seu conteúdo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Text */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Texto Original
          </label>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Cole ou digite o texto original aqui..."
            className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans leading-relaxed text-sm sm:text-base"
            style={{ whiteSpace: 'pre-wrap' }}
          />
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="professional">Profissional</option>
              <option value="journalistic">Jornalístico</option>
              <option value="sensationalist">Sensacionalista</option>
              <option value="casual">Casual</option>
              <option value="friendly">Amigável</option>
              <option value="enthusiastic">Entusiasta</option>
              <option value="formal">Formal</option>
            </select>
            
            <button
              onClick={rewriteText}
              disabled={loading || !originalText.trim()}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span className="text-sm sm:text-base">Reescrever com IA</span>
            </button>
          </div>
        </div>

        {/* Edited Text */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Texto Editado
          </label>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="O texto reescrito aparecerá aqui..."
            className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans leading-relaxed text-sm sm:text-base"
            style={{ whiteSpace: 'pre-wrap' }}
          />
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={generateHashtags}
              disabled={loading || !editedText.trim()}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              <Hash className="w-4 h-4" />
              <span className="text-sm">Hashtags</span>
            </button>
            
            <button
              onClick={analyzeText}
              disabled={loading || !editedText.trim()}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Analisar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center space-x-2">
            <ImageIcon className="w-5 h-5" />
            <span>Imagem do Post</span>
          </h3>
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Carregar Imagem</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {imagePreview && (
          <div className="mt-4 space-y-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full h-auto rounded-lg border border-gray-300"
              style={{ maxHeight: '400px' }}
            />
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={selectedLogo}
                  onChange={(e) => setSelectedLogo(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="page">Logo da Página</option>
                  <option value="none">Sem Logo</option>
                  {availableLogos.map(logo => (
                    <option key={logo.name} value={logo.name}>
                      {logo.displayName}
                    </option>
                  ))}
                </select>
                
                <label className="flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-colors w-full sm:w-auto">
                  <Upload className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={applyImageTemplate}
                  disabled={loading || !currentImage || !editedText.trim()}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Aplicar Template</span>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setCurrentImage(null);
                  setImagePreview(null);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remover imagem
              </button>
              
              <p className="text-xs text-gray-500">
                💡 O template adiciona degradê e o título do post na imagem
              </p>
            </div>
          </div>
        )}

        {!imagePreview && (
          <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Nenhuma imagem carregada</p>
            <p className="text-xs text-gray-500 mt-1">Clique em "Carregar Imagem" para adicionar</p>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Hashtags Sugeridas</h3>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <button
                key={index}
                onClick={() => setEditedText(editedText + ' ' + tag)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      {analysis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Análise do Texto</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{analysis}</p>
        </div>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Variações Geradas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {variations.map((variation, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2"
              >
                <p className="text-sm text-gray-700">{variation}</p>
                <button
                  onClick={() => setEditedText(variation)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Usar esta</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Selector */}
      {userPages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            📱 Selecione a Página para Publicar
          </label>
          <select
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
          >
            {userPages.map(page => (
              <option key={page.id} value={page.id}>
                {page.name} {page.fan_count ? `(${page.fan_count.toLocaleString()} seguidores)` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-2">
            Você tem {userPages.length} página{userPages.length > 1 ? 's' : ''} disponível{userPages.length > 1 ? 'is' : ''}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t">
        <button
          onClick={publishNow}
          disabled={loading || !editedText.trim()}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          <Send className="w-5 h-5" />
          <span>Publicar Agora</span>
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={schedulePost}
            disabled={loading || !editedText.trim() || !scheduledTime}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            <Clock className="w-5 h-5" />
            <span>Agendar</span>
          </button>
        </div>

        <button
          onClick={generateVariations}
          disabled={loading || !originalText.trim()}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          Gerar Variações
        </button>
      </div>
    </div>
  );
}

export default PostEditor;
