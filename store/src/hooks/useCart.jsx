import React, { useEffect, createContext, useContext, useState } from 'react'
import { useProducts } from './useProducts'
import { useFrappePutCall } from 'frappe-react-sdk'
import { useUser } from './useUser'

const CartContext = createContext([])

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({})
    const [isOpen, _] = useState(false)
    const {user} = useUser()

    const {call, result} = useFrappePutCall('webshop.webshop.shopping_cart.cart.update_cart')


    const cartCount = Object.keys(cart).reduce((total, itemCode) => {
        return total + cart[itemCode]
    }, 0)
    const { getByItemCode } = useProducts()

    useEffect(() => {
        // get cart state from local storage
        const cartStorage = localStorage.getItem('cart')
        if(Object.keys(cart).length === 0)
        {
            setCart(JSON.parse(cartStorage))
            Object.entries(JSON.parse(cartStorage)).forEach(( [itemCode, value]) => {
                call({"item_code" : itemCode, 'qty' :value})
            })
        }
    }, [])

    useEffect(() => {
        // get cart state from local storage
        if( user && Object.keys(cart).length !== 0){
            Object.entries(cart).forEach(( [itemCode, value]) => {
                call({"item_code" : itemCode, 'qty' :value})
            })
        }
    }, [user, cart])

    const setIsOpen = (value) => {
        if (value !== undefined || value !== null) {
            return _(value)
        }
        return _(!isOpen)
    }


    const addToCart = async (itemCode, quantity) => {
        setCart({ ...cart, [itemCode]: quantity ?? (cart[itemCode] ?? 0) + 1 })
        // store cart state in local storage
        localStorage.setItem('cart', JSON.stringify({ ...cart, [itemCode]: quantity ?? (cart[itemCode] ?? 0) + 1 }))
    }

    const removeFromCart = (itemCode) => {
        const newCart = { ...cart }
        delete newCart[itemCode]
        setCart(newCart)
        // store cart state in local storage
        localStorage.setItem('cart', JSON.stringify(newCart))
    }

    const resetCart = () => {
        setCart({})
        // store cart state in local storage
        localStorage.setItem('cart', JSON.stringify({}))
    }


    const getTotal = () => {
        return Object.keys(cart).reduce((total, itemCode) => {
            const product = getByItemCode(itemCode)
            if (product) {
                return total + product.price_list_rate * cart[itemCode]
            }
        }, 0)
    }


    return (
        <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, resetCart, getTotal, isOpen, setIsOpen }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
