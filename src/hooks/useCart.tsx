import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    } 

    return [];
  });

  const updateStorageCart = (newStorage: Product[]) => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newStorage));
  }

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const { data: stock } = await api.get(`/stock/${productId}`);

      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const {data: product} = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product,
          amount: 1
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      updateStorageCart(updatedCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      if (!productExists) {
        throw new Error('Erro na remoção do produto')
      }
      const updatedCart = [...cart];
      updatedCart.filter(product => product.id !== productId)
      
      setCart(updatedCart);
      updateStorageCart(updatedCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0){
        console.log("To no primeiro IFFFF")
        return;
      }
      
      const { data: stock } = await api.get(`/stock/${productId}`);

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const copyCart = [...cart];
      const updatedCart = copyCart.map(product => product.id === productId ? { ...product, amount } : product)

      setCart(updatedCart);
      updateStorageCart(updatedCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
