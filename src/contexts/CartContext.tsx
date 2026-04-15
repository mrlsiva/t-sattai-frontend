import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartContextType, CartItem, Product, ProductVariant } from '../types';
import { cartApi, handleApiError } from '../services/api';
import { useAuth } from './AuthContext';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
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
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === action.payload.product.id &&
        item.selectedVariant?.id === action.payload.selectedVariant?.id
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return {
          ...state,
          items: updatedItems,
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
        };
      }
    }
    case 'UPDATE_ITEM': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: updatedItems,
        loading: false,
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        loading: false,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        loading: false,
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

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      // Load cart from localStorage for guests
      loadGuestCart();
    }
  }, [isAuthenticated]);

  // Save guest cart to localStorage whenever it changes
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('guest_cart', JSON.stringify(state.items));
    }
  }, [state.items, isAuthenticated]);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartApi.getCart();
      
      if (response.success && response.data) {
        // Convert API cart items to frontend CartItem format
        const cartItems: CartItem[] = response.data.items.map((item: any) => ({
          id: String(item.id),
          product: item.product,
          quantity: item.quantity,
          selectedVariant: undefined, // API doesn't currently support variants
        }));
        
        dispatch({ type: 'SET_ITEMS', payload: cartItems });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const loadGuestCart = () => {
    try {
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        const items = JSON.parse(guestCart);
        dispatch({ type: 'SET_ITEMS', payload: items });
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
      dispatch({ type: 'SET_ITEMS', payload: [] });
    }
  };

  const addItem = async (product: Product, quantity: number = 1, variant?: ProductVariant) => {
    try {
      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          const response = await cartApi.addToCart(product.id, quantity);
          
          if (response.success) {
            // Reload cart to get the latest data from server
            await loadCart();
          } else {
            throw new Error(response.message);
          }
        } catch (apiError: any) {
          // If API call fails, add locally
          console.warn('API add failed, adding locally:', apiError);
          const newItem: CartItem = {
            id: `${product.id}_${variant?.id || 'default'}_${Date.now()}`,
            product,
            quantity,
            selectedVariant: variant,
          };
          dispatch({ type: 'ADD_ITEM', payload: newItem });
        }
      } else {
        // For guest users, create a local cart item
        const newItem: CartItem = {
          id: `${product.id}_${variant?.id || 'default'}_${Date.now()}`,
          product,
          quantity,
          selectedVariant: variant,
        };
        dispatch({ type: 'ADD_ITEM', payload: newItem });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Add to cart error:', errorMessage);
      
      // Still add locally as fallback
      const newItem: CartItem = {
        id: `${product.id}_${variant?.id || 'default'}_${Date.now()}`,
        product,
        quantity,
        selectedVariant: variant,
      };
      dispatch({ type: 'ADD_ITEM', payload: newItem });
    }
  };

  const removeItem = async (itemId: string | number) => {
    try {
      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          const response = await cartApi.removeFromCart(Number(itemId));
          
          if (response.success) {
            dispatch({ type: 'REMOVE_ITEM', payload: String(itemId) });
          } else {
            throw new Error(response.message);
          }
        } catch (apiError: any) {
          // If API call fails, just remove locally
          console.warn('API remove failed, removing locally:', apiError);
          dispatch({ type: 'REMOVE_ITEM', payload: String(itemId) });
        }
      } else {
        dispatch({ type: 'REMOVE_ITEM', payload: String(itemId) });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Remove item error:', errorMessage);
      // Still remove locally even if API fails
      dispatch({ type: 'REMOVE_ITEM', payload: String(itemId) });
    }
  };

  const updateQuantity = async (itemId: string | number, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          const response = await cartApi.updateCartItem(Number(itemId), quantity);
          
          if (response.success) {
            dispatch({ type: 'UPDATE_ITEM', payload: { id: String(itemId), quantity } });
          } else {
            throw new Error(response.message);
          }
        } catch (apiError: any) {
          // If API call fails, update locally
          console.warn('API update failed, updating locally:', apiError);
          dispatch({ type: 'UPDATE_ITEM', payload: { id: String(itemId), quantity } });
        }
      } else {
        dispatch({ type: 'UPDATE_ITEM', payload: { id: String(itemId), quantity } });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Update quantity error:', errorMessage);
      // Still update locally even if API fails
      dispatch({ type: 'UPDATE_ITEM', payload: { id: String(itemId), quantity } });
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        try {
          const response = await cartApi.clearCart();
          
          if (response.success) {
            dispatch({ type: 'CLEAR_CART' });
          } else {
            throw new Error(response.message);
          }
        } catch (apiError: any) {
          // If API call fails, clear locally
          console.warn('API clear failed, clearing locally:', apiError);
          dispatch({ type: 'CLEAR_CART' });
        }
      } else {
        dispatch({ type: 'CLEAR_CART' });
        localStorage.removeItem('guest_cart');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Clear cart error:', errorMessage);
      // Still clear locally even if API fails
      dispatch({ type: 'CLEAR_CART' });
      localStorage.removeItem('guest_cart');
    }
  };

  // Calculate total price
  const total = state.items.reduce((sum, item) => {
    const price = parseFloat(item.product.sale_price || item.product.price);
    const variantPrice = item.selectedVariant?.priceModifier || 0;
    return sum + ((price + variantPrice) * item.quantity);
  }, 0);

  // Calculate total item count
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const contextValue: CartContextType = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;