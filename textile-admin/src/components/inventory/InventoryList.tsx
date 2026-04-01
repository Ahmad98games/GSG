import { useState } from 'react';
import type { Product } from '../../types/database';
import { QRCodeSVG } from 'qrcode.react';
import { MoreHorizontal, FileText, Trash2, ArrowUpRight, X } from 'lucide-react';
import { LabelPreview } from './LabelPreview';

interface InventoryListProps {
  products: Product[];
  loading: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export const InventoryList = ({ products, loading, onDelete }: InventoryListProps) => {
  const [printProduct, setPrintProduct] = useState<Product | null>(null);

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.item_name}? This action is irreversible.`)) {
      if (onDelete) {
        try {
          await onDelete(product.id);
        } catch {
          alert('Delete failed. Please try again.');
        }
      }
    }
  };

  const handleExport = () => {
    if (products.length === 0) return;

    const headers = ['QR Code', 'Item Name', 'Category', 'Total Gaz', 'Unit Cost', 'Subtotal', 'Grand Total', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.qr_code,
        `"${p.item_name}"`,
        p.item_category,
        p.total_gaz,
        p.unit_cost,
        p.subtotal || 0,
        p.grand_total || 0,
        new Date(p.created_at).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (loading && products.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-full bg-zinc-900/20 animate-pulse rounded-md border border-zinc-800/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-900/30 border-b border-zinc-800/50">
            <tr>
              <th className="px-6 py-3 label-xs">QR Code</th>
              <th className="px-6 py-3 label-xs">Item Description</th>
              <th className="px-6 py-3 label-xs">Category</th>
              <th className="px-6 py-3 label-xs text-right">Total Gaz</th>
              <th className="px-6 py-3 label-xs text-right">Unit Cost</th>
              <th className="px-6 py-3 label-xs">Created At</th>
              <th className="px-6 py-3 label-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 text-sm italic">
                  No active batches found. Initialize your first batch.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="group hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-white rounded-sm">
                        <QRCodeSVG value={product.qr_code} size={24} />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-tighter group-hover:text-gold-500/70 transition-colors">
                        {product.qr_code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm font-medium text-zinc-200">{product.item_name}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      product.item_category === 'Fabric' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      product.item_category === 'Embroidery' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {product.item_category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-mono text-zinc-300">{product.total_gaz.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-mono text-zinc-100">${product.unit_cost.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs text-zinc-500">
                      {new Date(product.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button 
                        onClick={() => setPrintProduct(product)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-200 rounded transition-colors group/btn"
                        title="Print Label"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-200 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product)}
                        className="p-1.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 border-t border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          Showing {products.length} active batches
        </p>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            Export CSV <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Print Modal */}
      {printProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setPrintProduct(null)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Production Label Preview</h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tight">Verify all technical parameters before thermal export.</p>
            </div>
            <LabelPreview product={printProduct} />
          </div>
        </div>
      )}
    </div>
  );
};
