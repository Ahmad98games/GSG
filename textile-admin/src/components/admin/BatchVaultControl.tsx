'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Search, Plus, Printer, X } from 'lucide-react';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';
import { WorkOrderModal } from '../manufacturing/WorkOrderModal';
import type { ArticleMaster, SetProtocol } from '../../types/database';

interface BatchEntry {
  id: string;
  article_id: string;
  stock_in_sets: number;
  derived_units: number;
  vault_entry_date: string;
  article: {
    article_id: string;
    article_name: string;
    set_protocol: SetProtocol;
    wholesale_set_price: number;
    primary_image_url: string | null;
  };
}

export const BatchVaultControl: React.FC = () => {
  const [batches, setBatches] = useState<BatchEntry[]>([]);
  const [articles, setArticles] = useState<ArticleMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInwarding, setIsInwarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchForSlip, setSelectedBatchForSlip] = useState<BatchEntry | null>(null);

  const [inwardFormData, setInwardFormData] = useState({
    article_id: '',
    stock_in_sets: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [batchesRes, articlesRes] = await Promise.all([
        supabase
          .from('batches')
          .select(`
            *,
            article:article_master!article_id (
              article_id,
              article_name,
              set_protocol,
              wholesale_set_price,
              primary_image_url
            )
          `)
          .order('vault_entry_date', { ascending: false }),
        supabase
          .from('article_master')
          .select('*')
          .eq('is_active', true)
          .order('article_name')
      ]);

      if (batchesRes.data) setBatches(batchesRes.data);
      if (articlesRes.data) setArticles(articlesRes.data);
    } catch (error) {
      console.error('Data stabilization failure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInwardStock = async () => {
    if (!inwardFormData.article_id || inwardFormData.stock_in_sets <= 0) {
      alert('PROTOCOL_ERROR: Invalid Metadata or Quantity');
      return;
    }

    const { error } = await supabase
      .from('batches')
      .insert({
        article_id: inwardFormData.article_id,
        stock_in_sets: inwardFormData.stock_in_sets,
        vault_entry_date: new Date().toISOString(),
      });

    if (error) {
      alert('VAULT_REJECTION: ' + error.message);
      return;
    }

    // Update Article Master total sets
    const selectedArticle = articles.find(a => a.article_id === inwardFormData.article_id);
    if (selectedArticle) {
      await supabase
        .from('article_master')
        .update({
          total_sets_in_vault: (selectedArticle.total_sets_in_vault || 0) + inwardFormData.stock_in_sets,
        })
        .eq('article_id', inwardFormData.article_id);
    }

    setIsInwarding(false);
    setInwardFormData({ article_id: '', stock_in_sets: 0 });
    fetchData();
  };

  const smartSearch = React.useMemo(() => AnalyticsEngine.parseSmartSearch(searchQuery), [searchQuery]);

  const filteredBatches = React.useMemo(() => {
    return batches.filter(batch => {
      const matchesTerm = batch.article?.article_name.toLowerCase().includes(smartSearch.term) || 
                          batch.article?.article_id.toLowerCase().includes(smartSearch.term);
      const matchesColor = !smartSearch.color || 
                           (batch.article?.article_name.toLowerCase().includes(smartSearch.color));
      const matchesProtocol = !smartSearch.protocol || batch.article?.set_protocol === smartSearch.protocol;

      return matchesTerm && matchesColor && matchesProtocol;
    });
  }, [batches, smartSearch]);

  const totalVaultValue = batches.reduce((acc, batch) => {
    return acc + (batch.stock_in_sets * (batch.article?.wholesale_set_price || 0));
  }, 0);

  const totalVaultSets = batches.reduce((acc, batch) => acc + batch.stock_in_sets, 0);

  const selectedArticleForInward = articles.find(a => a.article_id === inwardFormData.article_id);
  const calculatedInwardUnits = selectedArticleForInward 
    ? inwardFormData.stock_in_sets * selectedArticleForInward.set_protocol 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-sm font-black text-electric-blue tracking-[.2em] uppercase italic">
            Inventory Registry
          </h2>
          <p className="text-[10px] text-zinc-600 mt-2 font-mono tracking-wider italic">
            STOCK_MANAGEMENT // SOVEREIGN_EDITION_V3
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Total Vault Value</p>
            <p className="text-electric-blue font-mono font-black text-lg tracking-tighter shadow-sm">
              Rs. {totalVaultValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right border-l border-white/5 pl-8">
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Total Sets</p>
            <p className="text-zinc-200 font-mono font-black text-lg tracking-tighter">
              {totalVaultSets.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setIsInwarding(true)}
            className="px-6 py-2.5 bg-electric-blue text-base-p border border-electric-blue hover:bg-electric-blue/90 transition-all text-xs font-black uppercase tracking-widest rounded-[2px] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Stock
          </button>
        </div>
      </section>

      {/* Control Panel & Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center gap-4 bg-base-s border border-white/5 p-2 rounded-[2px] shadow-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-electric-blue transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fuzzy Search (e.g. 'Zinc 6')..."
              className="w-full bg-base-p border border-white/5 text-zinc-100 pl-11 pr-5 py-2.5 text-xs font-mono placeholder:text-zinc-800 focus:outline-none focus:border-electric-blue/30 rounded-[2px] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {smartSearch.term && (
            <div className="px-3 py-1 bg-[#0F1113] border border-electric-blue/40 text-electric-blue text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
              Term: {smartSearch.term}
              <X className="w-2 h-2 cursor-pointer" onClick={() => setSearchQuery('')} />
            </div>
          )}
          {smartSearch.color && (
            <div className="px-3 py-1 bg-[#0F1113] border border-electric-blue/40 text-electric-blue text-[9px] font-black uppercase tracking-widest rounded-full">
              Color: {smartSearch.color}
            </div>
          )}
          {smartSearch.protocol && (
            <div className="px-3 py-1 bg-[#0F1113] border border-electric-blue/40 text-electric-blue text-[9px] font-black uppercase tracking-widest rounded-full">
              Protocol: {smartSearch.protocol} Pcs
            </div>
          )}
        </div>
      </div>

      {/* Vault Ledger */}
      {!isInwarding ? (
        <div className="bg-base-s border border-white/5 rounded-[2px] overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_80px_80px_80px_100px_80px] gap-4 px-4 py-4 bg-base-p border-b border-white/5">
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic font-mono">Suit</p>
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic font-mono">Details</p>
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic text-right font-mono">Prot</p>
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic text-right font-mono">Sets</p>
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic text-right font-mono">Pcs</p>
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic text-right font-mono">Rate</p>
            <p className="text-electric-blue font-black text-[9px] uppercase tracking-widest italic text-right font-mono">Slip</p>
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="py-32 text-center bg-base-p/50">
                <div className="w-10 h-10 border-2 border-electric-blue/10 border-t-gold rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(96,165,250,0.2)]" />
                <p className="text-zinc-700 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Syncing Stock...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-base-s/20 border border-dashed border-white/5 m-8">
                <Package className="w-20 h-20 text-zinc-900 mb-6 opacity-20" />
                <p className="text-zinc-700 font-mono text-xs uppercase tracking-[0.4em]">
                  Stock Registry Empty
                </p>
              </div>
            ) : (
              filteredBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="grid grid-cols-[60px_1fr_80px_80px_80px_100px_80px] gap-4 px-4 py-3 hover:bg-base-p transition-all group border-l-2 border-l-transparent hover:border-l-gold shadow-sm items-center"
                >
                  {/* Asset */}
                  <div className="w-12 h-12 bg-base-p border border-white/5 rounded-[2px] overflow-hidden flex items-center justify-center shadow-inner">
                    {batch.article?.primary_image_url ? (
                      <img
                        src={batch.article.primary_image_url}
                        alt={batch.article.article_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.3] group-hover:grayscale-0"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-zinc-900 opacity-20" />
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col justify-center">
                    <p className="text-electric-blue text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 font-mono">
                      {batch.article?.article_id || 'UNKNOWN'}
                    </p>
                    <h3 className="text-white font-black text-sm uppercase tracking-tighter drop-shadow-md">
                      {batch.article?.article_name || 'Legacy Item'}
                    </h3>
                    <p className="text-zinc-700 font-mono text-[9px] mt-2 uppercase tracking-widest">
                      Added: {new Date(batch.vault_entry_date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Protocol */}
                  <div className="flex items-center justify-end">
                    <div className="px-3 py-1.5 bg-base-p border border-white/5 text-zinc-500 font-mono text-[13px] font-black rounded-[2px] shadow-inner">
                      {batch.article?.set_protocol || 0}
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="flex items-center justify-end">
                    <p className="text-white font-black font-mono text-base tracking-tighter">
                      {batch.stock_in_sets}
                    </p>
                  </div>

                  {/* Derived Units */}
                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <p className="text-electric-blue font-black font-mono text-base tracking-tighter">
                        {batch.derived_units}
                      </p>
                      <p className="text-zinc-800 text-[8px] font-black uppercase tracking-[0.2em]">Pieces</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <p className="text-zinc-500 font-black font-mono text-[11px] tracking-tighter">
                      Rs. {batch.article?.wholesale_set_price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>

                  {/* Print Action */}
                  <div className="flex items-center justify-end">
                    <button 
                      onClick={() => setSelectedBatchForSlip(batch)}
                      className="p-2 bg-base-p border border-white/5 text-zinc-700 hover:text-electric-blue transition-all rounded-[2px] group/btn"
                    >
                      <Printer className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Inward Form: INDUSTRIAL_BATCH_GENERATOR */
        <div className="max-w-xl mx-auto bg-base-s border border-white/5 p-10 rounded-[2px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] space-y-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-electric-blue text-[11px] font-black uppercase tracking-[0.3em] font-mono italic">
              New Stock Entry
            </h3>
            <button 
              onClick={() => setIsInwarding(false)}
              className="text-zinc-700 hover:text-white transition-all text-[10px] font-mono uppercase tracking-widest"
            >
              [Cancel Entry]
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[.3em] mb-4">
                Select Design / Suit ID
              </label>
              <select
                value={inwardFormData.article_id}
                onChange={(e) => setInwardFormData({ ...inwardFormData, article_id: e.target.value })}
                className="w-full bg-base-p border border-white/5 text-zinc-100 px-5 py-4 text-xs font-mono focus:outline-none focus:border-electric-blue/40 rounded-[2px] transition-all uppercase tracking-tighter"
              >
                <option value="">-- Choose Suit Registry --</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.article_id}>
                    {article.article_id} // {article.article_name} // {article.set_protocol} Pcs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 text-[10px] font-black uppercase tracking-[.3em] mb-4">
                Quantity (Number of Sets)
              </label>
              <input
                type="number"
                value={inwardFormData.stock_in_sets}
                onChange={(e) => setInwardFormData({ ...inwardFormData, stock_in_sets: parseInt(e.target.value) || 0 })}
                className="w-full bg-base-p border border-white/5 text-zinc-100 px-5 py-4 text-sm font-mono focus:outline-none focus:border-electric-blue/40 rounded-[2px] shadow-inner font-black"
                placeholder="Enter sets..."
              />
            </div>

            {selectedArticleForInward && inwardFormData.stock_in_sets > 0 && (
              <div className="p-6 bg-electric-blue/[0.03] border border-electric-blue/10 flex items-center justify-between rounded-[2px] shadow-inner">
                <div>
                  <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[.4em] mb-2">Calculated Total</p>
                  <p className="text-electric-blue font-black text-3xl tracking-tighter">
                    {calculatedInwardUnits} <span className="text-xs not-italic opacity-40 ml-2">Pieces</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-800 text-[9px] font-black uppercase tracking-widest mb-1">Formula</p>
                  <p className="text-zinc-500 font-mono text-[11px] font-black">
                    {inwardFormData.stock_in_sets} Sets × {selectedArticleForInward.set_protocol} Pcs
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleInwardStock}
              className="w-full bg-electric-blue text-base-p text-xs font-black uppercase tracking-[0.5em] py-5 hover:bg-electric-blue/90 transition-all rounded-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] mt-10"
            >
              Confirm Stock Entry →
            </button>
          </div>
        </div>
      )}
      {/* Work Order Modal */}
      {selectedBatchForSlip && (
        <WorkOrderModal 
          isOpen={!!selectedBatchForSlip}
          onClose={() => setSelectedBatchForSlip(null)}
          batchData={{
            id: selectedBatchForSlip.id,
            article_id: selectedBatchForSlip.article?.article_id || 'UNKNOWN',
            article_name: selectedBatchForSlip.article?.article_name || 'LEGACY_ITEM',
            total_gaz: selectedBatchForSlip.derived_units * 3.5, // Mocking Gaz for demo, should be in DB
            karigar_name: 'Karigar_Pending_Sync'
          }}
        />
      )}
    </div>
  );
};
