import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, NewProductDto } from '../types/database';

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (newProduct: NewProductDto) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: addError } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (addError) throw addError;
      setProducts((current) => [data as Product, ...current]);
      return data as Product;

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add batch');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setProducts((current) => current.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // 🛡️ BEYOND AI: Realtime Synchronization Engine
    const subscription = supabase
      .channel('products_live_updates')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: '*', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    deleteProduct,
  };
};
