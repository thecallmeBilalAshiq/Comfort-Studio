import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      // Products count
      const { count: pCount, error: pError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (pError) throw pError;

      // Users count (excluding admin users)
      const { count: uCount, error: uError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', false);
      if (uError) throw uError;

      // Orders count
      const { count: oCount, error: oError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      if (oError) throw oError;

      // Pending orders count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (pendingError) throw pendingError;

      // Categories count
      const { count: catCount, error: catError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      if (catError) throw catError;

      // Reviews count
      const { count: reviewCount, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
      if (reviewError) throw reviewError;
      
      // Total Revenue sum
      const { data: revenueData, error: revError } = await supabase
        .from('orders')
        .select('total');
      if (revError) throw revError;
      const totalRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

      // Average Review Rating
      const { data: ratingData, error: ratingError } = await supabase
        .from('reviews')
        .select('rating');
      if (ratingError) throw ratingError;
      const totalRating = (ratingData || []).reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
      const avgRating = ratingData && ratingData.length > 0 ? (totalRating / ratingData.length) : 0;

      // Recent Orders list
      const { data: recentOrdersData, error: recOrdersError } = await supabase
        .from('orders')
        .select('*, users(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recOrdersError) throw recOrdersError;

      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalProducts: pCount || 0,
        totalOrders: oCount || 0,
        totalUsers: uCount || 0,
        pendingOrders: pendingCount || 0,
        totalCategories: catCount || 0,
        totalReviews: reviewCount || 0,
        avgRating: parseFloat(avgRating.toFixed(1)),
        recentOrders: (recentOrdersData || []).map((o: any) => ({
          id: o.id,
          customerName: o.users?.name || o.shipping_name || 'Customer',
          total: Number(o.total),
          status: o.status,
          createdAt: o.created_at
        }))
      };
    }
  });
}

export function useAdminProducts() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), subcategories(name)')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    }
  });

  return {
    ...query,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useAdminOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, users(name), order_items(*, products(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    }
  });

  return {
    ...query,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export function useAdminCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(*)')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newCategory: any) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    }
  });

  return {
    ...query,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
