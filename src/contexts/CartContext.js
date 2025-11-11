import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';


const CART_ACTIONS = {
  ADD_PRODUCT: 'ADD_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  CHANGE_QUANTITY: 'CHANGE_QUANTITY',
  EMPTY_CART: 'EMPTY_CART',
  SYNC_CART: 'SYNC_CART',
  TOGGLE_ITEM_SELECTION: 'TOGGLE_ITEM_SELECTION',
  SELECT_ALL_ITEMS: 'SELECT_ALL_ITEMS',
  UNSELECT_ALL_ITEMS: 'UNSELECT_ALL_ITEMS'
};


const initialCartState = {
  products: [],
  selectedItems: [],
  lastUpdated: null
};


const shoppingCartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_PRODUCT:
      const existingProduct = state.products.find(product => product.id === action.product.id);
      
      if (existingProduct) {
        return {
          ...state,
          products: state.products.map(product =>
            product.id === action.product.id
              ? { ...product, quantity: product.quantity + 1 }
              : product
          ),
          lastUpdated: new Date().toISOString()
        };
      }
      
      return {
        ...state,
        products: [...state.products, { ...action.product, quantity: 1 }],
        lastUpdated: new Date().toISOString()
      };

    case CART_ACTIONS.DELETE_PRODUCT:
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.productId),
        selectedItems: state.selectedItems.filter(id => id !== action.productId),
        lastUpdated: new Date().toISOString()
      };

    case CART_ACTIONS.CHANGE_QUANTITY:
      const { productId, quantity } = action;
      
      if (quantity <= 0) {
        return {
          ...state,
          products: state.products.filter(product => product.id !== productId),
          selectedItems: state.selectedItems.filter(id => id !== productId),
          lastUpdated: new Date().toISOString()
        };
      }
      
      return {
        ...state,
        products: state.products.map(product =>
          product.id === productId ? { ...product, quantity } : product
        ),
        lastUpdated: new Date().toISOString()
      };

    case CART_ACTIONS.EMPTY_CART:
      return {
        ...initialCartState,
        lastUpdated: new Date().toISOString()
      };

    case CART_ACTIONS.SYNC_CART:
      return {
        ...state,
        products: action.products || [],
        lastUpdated: new Date().toISOString()
      };

    case CART_ACTIONS.TOGGLE_ITEM_SELECTION:
      const isSelected = state.selectedItems.includes(action.productId);
      return {
        ...state,
        selectedItems: isSelected
          ? state.selectedItems.filter(id => id !== action.productId)
          : [...state.selectedItems, action.productId]
      };

    case CART_ACTIONS.SELECT_ALL_ITEMS:
      return {
        ...state,
        selectedItems: state.products.map(product => product.id)
      };

    case CART_ACTIONS.UNSELECT_ALL_ITEMS:
      return {
        ...state,
        selectedItems: []
      };

    default:
      return state;
  }
};


const ShoppingCartContext = createContext();


export const ShoppingCartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(shoppingCartReducer, initialCartState);


  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('shoppingCart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        dispatch({ type: CART_ACTIONS.SYNC_CART, products: parsedCart.products });
      }
    } catch (error) {
      console.warn('Не удалось загрузить корзину из хранилища:', error);
    }
  }, []);

 
  useEffect(() => {
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cartState));
    } catch (error) {
      console.warn('Не удалось сохранить корзину в хранилище:', error);
    }
  }, [cartState]);


  const addProduct = useCallback((product) => {
    dispatch({ type: CART_ACTIONS.ADD_PRODUCT, product });
  }, []);


  const deleteProduct = useCallback((productId) => {
    dispatch({ type: CART_ACTIONS.DELETE_PRODUCT, productId });
  }, []);


  const changeProductQuantity = useCallback((productId, quantity) => {
    dispatch({ type: CART_ACTIONS.CHANGE_QUANTITY, productId, quantity });
  }, []);


  const emptyCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.EMPTY_CART });
  }, []);


  const toggleItemSelection = useCallback((productId) => {
    dispatch({ type: CART_ACTIONS.TOGGLE_ITEM_SELECTION, productId });
  }, []);


  const selectAllItems = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SELECT_ALL_ITEMS });
  }, []);

 
  const unselectAllItems = useCallback(() => {
    dispatch({ type: CART_ACTIONS.UNSELECT_ALL_ITEMS });
  }, []);

 
  const totalItems = cartState.products.reduce((total, product) => total + product.quantity, 0);
  
  const totalCost = cartState.products.reduce((total, product) => {
    return total + (product.price * product.quantity);
  }, 0);

  const selectedItemsCost = cartState.products
    .filter(product => cartState.selectedItems.includes(product.id))
    .reduce((total, product) => total + (product.price * product.quantity), 0);

  const selectedItemsCount = cartState.selectedItems.length;

  const isProductInCart = (productId) => {
    return cartState.products.some(product => product.id === productId);
  };

  const getProductQuantity = (productId) => {
    const product = cartState.products.find(p => p.id === productId);
    return product ? product.quantity : 0;
  };

  const value = {
  
    items: cartState.products,
    selectedItems: cartState.selectedItems,
    lastUpdated: cartState.lastUpdated,
    
 
    totalItems,
    totalCost,
    selectedItemsCost,
    selectedItemsCount,
    isAllSelected: cartState.products.length > 0 && cartState.selectedItems.length === cartState.products.length,
    

    addToCart: addProduct,
    removeFromCart: deleteProduct,
    updateQuantity: changeProductQuantity,
    clearCart: emptyCart,
    toggleItemSelection,
    selectAllItems,
    unselectAllItems,
    isProductInCart,
    getProductQuantity,
    

    getTotalItems: () => totalItems,
    getTotalPrice: () => totalCost
  };

  return (
    <ShoppingCartContext.Provider value={value}>
      {children}
    </ShoppingCartContext.Provider>
  );
};


export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  
  if (!context) {
    throw new Error('useShoppingCart должен использоваться внутри ShoppingCartProvider');
  }
  
  return context;
};


export const CartProvider = ShoppingCartProvider;
export const useCart = useShoppingCart;


export const useCartItem = (productId) => {
  const { 
    items, 
    selectedItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    toggleItemSelection,
    isProductInCart,
    getProductQuantity
  } = useShoppingCart();

  const product = items.find(item => item.id === productId);
  const isSelected = selectedItems.includes(productId);
  const isInCart = isProductInCart(productId);
  const quantity = getProductQuantity(productId);

  return {
    product,
    isSelected,
    isInCart,
    quantity,
    addToCart: () => addToCart(product || { id: productId }),
    removeFromCart: () => removeFromCart(productId),
    changeQuantity: (newQuantity) => updateQuantity(productId, newQuantity),
    toggleSelection: () => toggleItemSelection(productId)
  };
};