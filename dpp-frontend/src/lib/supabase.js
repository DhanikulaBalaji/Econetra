import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // Products
  getProducts: async (filters = {}) => {
    let query = supabase.from('products').select('*')
    
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  createProduct: async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
    return { data, error }
  },

  updateProduct: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  deleteProduct: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // DPPs
  getDPPs: async (filters = {}) => {
    let query = supabase.from('digital_product_passports').select(`
      *,
      products (
        product_name,
        description,
        material_composition
      )
    `)
    
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  getDPP: async (id) => {
    const { data, error } = await supabase
      .from('digital_product_passports')
      .select(`
        *,
        products (
          product_name,
          description,
          material_composition,
          production_location,
          production_date
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    return { data, error }
  },

  updateUserRole: async (id, role) => {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
    return { data, error }
  }
}

