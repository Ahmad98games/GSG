'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, CheckCircle, Package, Search } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';

interface Article {
  id: string;
  article_id: string;
  article_name: string;
  canonical_name: string;
  primary_image_url: string | null;
  set_protocol: 4 | 5 | 6 | 8;
  wholesale_set_price: number;
  total_sets_in_vault: number;
  total_units_available: number;
  is_active: boolean;
  desi_colors: string | null;
  color_primary: string | null;
}

export const ArticleMasterModule: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    article_name: '',
    set_protocol: 6 as 4 | 5 | 6 | 8,
    wholesale_set_price: 0,
    vault_inward_sets: 0,
    fabric_type: '',
    color_primary: '',
    desi_colors: '', // New field for regional metadata
    work_type: '',
    season: '',
  });

  const fetchArticles = React.useCallback(async (): Promise<void> => {
    const { data, error } = await supabase
      .from('article_master')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setArticles(data);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const generateArticleID = (): string => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `GS-ART-${randomDigits}`;
  };

  const generateCanonicalName = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadedImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const compressAndUploadImage = async (file: File, articleID: string): Promise<string | null> => {
    try {
      const options = {
        maxSizeMB: 0.8, // User Requirement: <800KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${articleID}_${Date.now()}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error } = await supabase.storage
        .from('article-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: unknown) {
      console.error('ASSET_CRASH: Image compression or upload failed', error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const handleCreateArticle = async (): Promise<void> => {
    if (!formData.article_name || formData.wholesale_set_price <= 0) {
      alert('Please fill all required fields');
      return;
    }

    setUploadProgress(10);

    const articleID = generateArticleID();
    const canonicalName = generateCanonicalName(formData.article_name);

    let imageUrl: string | null = null;

    if (uploadedImage) {
      setUploadProgress(30);
      imageUrl = await compressAndUploadImage(uploadedImage, articleID);
      setUploadProgress(60);
    }

    const { error } = await supabase
      .from('article_master')
      .insert({
        article_id: articleID,
        article_name: formData.article_name,
        canonical_name: canonicalName,
        primary_image_url: imageUrl,
        set_protocol: formData.set_protocol,
        wholesale_set_price: formData.wholesale_set_price,
        total_sets_in_vault: formData.vault_inward_sets,
        fabric_type: formData.fabric_type || null,
        color_primary: formData.color_primary || null,
        desi_colors: formData.desi_colors || null,
        work_type: formData.work_type || null,
        season: formData.season || null,
      });

    setUploadProgress(100);

    if (error) {
      alert('Failed to create article: ' + error.message);
      setUploadProgress(0);
      return;
    }

    alert(`Article ${articleID} created successfully!\nTotal Units: ${formData.vault_inward_sets * formData.set_protocol}`);

    setIsCreating(false);
    setFormData({
      article_name: '',
      set_protocol: 6,
      wholesale_set_price: 0,
      vault_inward_sets: 0,
      fabric_type: '',
      color_primary: '',
      desi_colors: '',
      work_type: '',
      season: '',
    });
    setUploadedImage(null);
    setImagePreview(null);
    setUploadProgress(0);

    fetchArticles();
  };

  const smartSearch = React.useMemo(() => AnalyticsEngine.parseSmartSearch(searchQuery), [searchQuery]);

  const filteredArticles = React.useMemo(() => {
    return articles.filter(article => {
      const matchesTerm = article.article_name.toLowerCase().includes(smartSearch.term) || 
                          article.article_id.toLowerCase().includes(smartSearch.term);
      const matchesColor = !smartSearch.color || 
                           (article.desi_colors?.toLowerCase().includes(smartSearch.color)) ||
                           (article.color_primary?.toLowerCase().includes(smartSearch.color));
      const matchesProtocol = !smartSearch.protocol || article.set_protocol === smartSearch.protocol;

      return matchesTerm && matchesColor && matchesProtocol;
    });
  }, [articles, smartSearch]);

  const calculatedNetUnits = formData.vault_inward_sets * formData.set_protocol;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-sm font-black text-electric-blue tracking-[.2em] uppercase italic">
            Article Registry
          </h2>
          <p className="text-[10px] text-zinc-600 mt-2 max-w-md font-mono tracking-wider italic">
            PRODUCT_VAULT // WHOLESALE SET PROTOCOLS
          </p>
        </div>

        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-2.5 bg-electric-blue text-base-p border border-electric-blue hover:bg-electric-blue/90 transition-all text-xs font-black uppercase tracking-widest rounded-[2px]"
          >
            + Add New Suit
          </button>
        ) : (
          <button
            onClick={() => setIsCreating(false)}
            className="px-6 py-2.5 bg-base-t text-zinc-500 border border-white/5 hover:text-white transition-all text-xs font-black uppercase tracking-widest rounded-[2px]"
          >
            Cancel
          </button>
        )}
      </section>

      {/* Smart Search Bar & Filter Chips */}
      {!isCreating && (
        <div className="space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-electric-blue transition-colors" />
            <input 
              type="text"
              placeholder="Fuzzy Search Articles (e.g. 'Zinc 6' for Zinc Color & 6 Pieces)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1113] border border-white/5 pl-11 pr-4 py-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-electric-blue/30 rounded-[2px] transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {smartSearch.term && (
              <div className="px-3 py-1 bg-[#0F1113] border border-electric-blue/40 text-electric-blue text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 animate-in slide-in-from-left-2 transition-all">
                Term: {smartSearch.term}
                <X className="w-2 h-2 cursor-pointer" onClick={() => setSearchQuery('')} />
              </div>
            )}
            {smartSearch.color && (
              <div className="px-3 py-1 bg-[#0F1113] border border-electric-blue/40 text-electric-blue text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 animate-in slide-in-from-left-2 transition-all">
                Color: {smartSearch.color}
              </div>
            )}
            {smartSearch.protocol && (
              <div className="px-3 py-1 bg-[#0F1113] border border-electric-blue/40 text-electric-blue text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 animate-in slide-in-from-left-2 transition-all">
                Protocol: {smartSearch.protocol} Pcs
              </div>
            )}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {!isCreating ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-32 bg-base-s/20 border border-dashed border-white/5 rounded-[2px]">
              <Package className="w-16 h-16 text-zinc-800 mb-6 opacity-20" />
              <p className="text-zinc-700 font-mono text-xs uppercase tracking-[0.4em]">
                Vault Empty: No Suits Registered
              </p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-base-s border border-white/5 rounded-[2px] overflow-hidden hover:border-electric-blue/30 transition-all group shadow-xl"
              >
                {/* Image */}
                <div className="aspect-square bg-base-p flex items-center justify-center relative overflow-hidden">
                  {article.primary_image_url ? (
                    <img
                      src={article.primary_image_url}
                      alt={article.article_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[0.5] group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="text-zinc-800 text-[10px] uppercase font-black tracking-widest opacity-20 italic">No Photo Asset</div>
                  )}
                  <div className="absolute top-4 left-4 px-3 py-2 bg-base-p/90 backdrop-blur-md border border-white/5 text-electric-blue text-[10px] font-black uppercase tracking-widest shadow-2xl">
                    {article.article_id}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md">
                      {article.article_name}
                    </h3>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-600 font-extrabold uppercase tracking-widest mb-1.5 leading-none">
                        Protocol
                      </p>
                      <p className="text-electric-blue font-mono font-black text-lg leading-none">{article.set_protocol}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-5">
                    <div>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Stock Sets</p>
                      <p className="text-zinc-200 font-mono text-[13px] tracking-tighter">{article.total_sets_in_vault}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Total Pieces</p>
                      <p className="text-electric-blue font-mono text-[13px] font-black tracking-tighter">
                        {article.total_units_available}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Wholesale Price</p>
                      <p className="text-white font-mono text-base font-black tracking-tight">
                        Rs. {article.wholesale_set_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* Left: Photo Upload */}
          <div className="bg-base-s border border-white/5 p-8 rounded-[2px] space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-electric-blue" />
              <h3 className="text-electric-blue text-[11px] font-black uppercase tracking-[0.3em] italic font-mono">
                Suit Photo Hub
              </h3>
            </div>

            <div className="border border-dashed border-white/10 rounded-[2px] p-10 text-center hover:border-electric-blue/30 transition-all bg-base-p shadow-inner group">
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="w-full h-80 object-cover rounded-[2px] shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 p-3 bg-base-p/90 backdrop-blur-md border border-white/5 text-red-500 hover:text-red-400 shadow-2xl transform active:scale-90 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-12">
                  <Upload className="w-16 h-16 mx-auto text-zinc-800 mb-6 group-hover:text-electric-blue/20 transition-colors" />
                  <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest font-black">
                    Drag or Click to Upload Suit Photo
                  </p>
                  <p className="text-zinc-800 text-[10px] mt-4 font-mono uppercase tracking-tighter">
                    Max size: 800KB (Auto-compressed)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-4">
                <div className="h-[3px] bg-base-p rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-electric-blue transition-all duration-700 shadow-[0_0_20px_rgba(96,165,250,0.4)]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-zinc-600 font-mono text-[10px] uppercase text-center tracking-[.4em] font-black">
                  Syncing Data: {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          {/* Right: Suit Specifications */}
          <div className="bg-base-s border border-white/5 p-8 rounded-[2px] space-y-8 shadow-2xl">
            <h3 className="text-electric-blue text-[11px] font-black uppercase tracking-[0.3em] italic font-mono">
              Suit Details
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                  Design Name (Article Name)
                </label>
                <input
                  type="text"
                  value={formData.article_name}
                  onChange={(e) => setFormData({ ...formData, article_name: e.target.value })}
                  placeholder="e.g. Khaadi Lawn 2026 Festive"
                />
              </div>

              <div>
                <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                  Desi Colors (Regional Metadata)
                </label>
                <input
                  type="text"
                  value={formData.desi_colors}
                  onChange={(e) => setFormData({ ...formData, desi_colors: e.target.value })}
                  className="w-full bg-base-p border border-white/5 text-[#60A5FA] px-5 py-4 text-xs font-mono focus:outline-none focus:border-electric-blue/40 rounded-[2px] transition-all uppercase tracking-tighter italic"
                  placeholder="e.g. Falsa, Zinc, Angoori, Jamuni"
                />
              </div>

              <div>
                <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                  Pieces per Set
                </label>
                <select
                  value={formData.set_protocol}
                  onChange={(e) => setFormData({ ...formData, set_protocol: parseInt(e.target.value) as 4 | 5 | 6 | 8 })}
                  className="w-full bg-base-p border border-white/5 text-zinc-100 px-5 py-4 text-xs font-mono focus:outline-none focus:border-electric-blue/40 rounded-[2px] transition-all uppercase tracking-[0.2em]"
                >
                  <option value="4">4 Pieces (Standard)</option>
                  <option value="5">5 Pieces (Mid)</option>
                  <option value="6">6 Pieces (Bulk)</option>
                  <option value="8">8 Pieces (Premium)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    Wholesale Price (Rs.)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 text-sm font-black font-mono tracking-tighter">Rs.</span>
                    <input
                      type="number"
                      value={formData.wholesale_set_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_set_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-base-p border border-white/5 text-electric-blue pl-14 pr-5 py-4 text-sm font-mono font-black focus:outline-none focus:border-electric-blue/40 rounded-[2px]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    Stock Sets (Inward)
                  </label>
                  <input
                    type="number"
                    value={formData.vault_inward_sets}
                    onChange={(e) => setFormData({ ...formData, vault_inward_sets: parseInt(e.target.value) || 0 })}
                    className="w-full bg-base-p border border-white/5 text-zinc-100 px-5 py-4 text-sm font-mono focus:outline-none focus:border-electric-blue/40 rounded-[2px]"
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.vault_inward_sets > 0 && (
                <div className="p-6 bg-electric-blue/[0.03] border border-electric-blue/10 flex items-center justify-between rounded-[2px] shadow-inner">
                  <div>
                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[.4em] mb-1">Calculated Total</p>
                    <p className="text-electric-blue font-black text-2xl tracking-tighter">{calculatedNetUnits} Pieces</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-electric-blue opacity-10" />
                </div>
              )}

              <button
                onClick={handleCreateArticle}
                disabled={uploadProgress > 0 && uploadProgress < 100}
                className="w-full bg-electric-blue text-base-p text-xs font-black uppercase tracking-[0.5em] py-5 hover:bg-electric-blue/90 transition-all disabled:opacity-50 rounded-[2px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] mt-8"
              >
                {uploadProgress > 0 && uploadProgress < 100 ? 'Creating...' : 'Save Suit Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
