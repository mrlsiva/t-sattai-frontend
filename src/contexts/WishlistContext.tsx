import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { WishlistContextType, Product } from '../types';
import { handleApiError } from '../services/api';
import { useAuth } from './AuthContext';
import api from '../utils/api';

interface WishlistState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

type WishlistAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: Product[] }
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      };
    case 'ADD_ITEM':
      // Check if item already exists
      if (state.items.some(item => item.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== Number(action.payload)),
      };
    case 'CLEAR_WISHLIST':
      return {
        ...state,
        items: [],
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: React.ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      // Load wishlist from localStorage for guests
      loadGuestWishlist();
    }
  }, [isAuthenticated]);

  // Save guest wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('guest_wishlist', JSON.stringify(state.items));
    }
  }, [state.items, isAuthenticated]);

  const loadWishlist = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/wishlist');
      
      if (response.data?.success && response.data?.data) {
        // Convert API wishlist items to products
        const products = response.data.data.map((item: any) => item.product);
        dispatch({ type: 'SET_ITEMS', payload: products });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const loadGuestWishlist = () => {
    try {
      const guestWishlist = localStorage.getItem('guest_wishlist');
      if (guestWishlist) {
        const items = JSON.parse(guestWishlist);
        dispatch({ type: 'SET_ITEMS', payload: items });
      }
    } catch (error) {
      console.error('Error loading guest wishlist:', error);
      dispatch({ type: 'SET_ITEMS', payload: [] });
    }
  };

  const addItem = async (product: Product) => {
    try {
      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await api.post(`/wishlist/${product.id}`);
        
        if (response.data?.success) {
          dispatch({ type: 'ADD_ITEM', payload: product });
        } else {
          throw new Error(response.data?.message || 'Failed to add to wishlist');
        }
      } else {
        dispatch({ type: 'ADD_ITEM', payload: product });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await api.delete(`/wishlist/${productId}`);
        
        if (response.data?.success) {
          dispatch({ type: 'REMOVE_ITEM', payload: productId.toString() });
        } else {
          throw new Error(response.data?.message || 'Failed to remove from wishlist');
        }
      } else {
        dispatch({ type: 'REMOVE_ITEM', payload: productId.toString() });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const clearWishlist = async () => {
    try {
      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await api.delete('/wishlist');
        
        if (response.data?.success) {
          dispatch({ type: 'CLEAR_WISHLIST' });
        } else {
          throw new Error(response.data?.message || 'Failed to clear wishlist');
        }
      } else {
        dispatch({ type: 'CLEAR_WISHLIST' });
        localStorage.removeItem('guest_wishlist');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return state.items.some(item => Number(item.id) === productId);
  };

  const contextValue: WishlistContextType = {
    items: state.items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;