import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async newProduct => {
      const findProductIdx = products.findIndex(
        product => product.id === newProduct.id,
      );

      if (findProductIdx >= 0) {
        setProducts(
          products.map(product =>
            product.id === newProduct.id
              ? { ...newProduct, quantity: product.quantity + 1 }
              : product,
          ),
        );
      } else {
        setProducts([...products, { ...newProduct, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const findProductIdx = products.findIndex(product => product.id === id);

      if (findProductIdx >= 0) {
        setProducts(
          products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity + 1 }
              : product,
          ),
        );

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProductIdx = products.findIndex(product => product.id === id);

      if (findProductIdx >= 0) {
        if (products[findProductIdx].quantity > 1) {
          setProducts(
            products.map(product =>
              product.id === id
                ? { ...product, quantity: product.quantity - 1 }
                : product,
            ),
          );
        } else {
          setProducts(products.filter(product => product.id !== id));
        }

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
