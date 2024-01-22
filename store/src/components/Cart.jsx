import React, {useRef, useState} from 'react'
import { SfButton, SfDrawer, useTrapFocus, SfIconAdd, SfIconRemove, SfLoaderCircular, SfSelect, SfIconFavorite } from '@storefront-ui/react'
import { CSSTransition } from 'react-transition-group';
import { useWish } from '../hooks/useWishe'
import { useCart } from '../hooks/useCart'
import { useProducts } from '../hooks/useProducts'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { Icons } from './icons';
import { Skeleton } from './Skeleton';

const Cart = () => {
    const { cart, cartCount, addToCart, removeFromCart, getTotal, isOpen, setIsOpen, loading } = useCart()
    const { Wish, removeFromWish, isOpen: isWishOpen, setIsOpen: setWishOpen } = useWish()
    const nodeRef = useRef(null);
    const drawerRef = useRef(null);
    const { getByItemCode, isLoading } = useProducts()
    const navigate = useNavigate()

    // Ajouter un état pour l'intervalle
    const [intervalId, setIntervalId] = useState(null);


    const inputRefs = useRef({});


    const changeCart = (itemcode, qty) =>
    {
        let qtyStr = String(qty);
        if(qty == 0 || qty == '' || qty == null)
        {
            qtyStr = '1';
        }
        if(qtyStr.length > 3)
        {
            qtyStr = qtyStr.substring(1);
        }
        const qtyNum = Number(qtyStr);
        inputRefs.current[itemcode].value = qtyNum;
        addToCart(itemcode, qtyNum)
    }

    // Fonction pour commencer à augmenter la valeur
    const startIncreasing = (itemcode) => {
        const id = setInterval(() => {

            changeCart(itemcode, Number(inputRefs.current[itemcode].value) + 1);

        }, 100); // Augmenter la valeur toutes les 100 ms
        setIntervalId(id);
    };

    const startDecreasing = (itemcode) => {
        const id = setInterval(() => {
            
            changeCart(itemcode, Number(inputRefs.current[itemcode].value) - 1);

        }, 100); // Augmenter la valeur toutes les 100 ms
        setIntervalId(id);
    };



    // Fonction pour arrêter d'augmenter la valeur
    const stopIncreasing = () => {
        clearInterval(intervalId);
        setIntervalId(null);
    };

    
    //useTrapFocus(drawerRef, { activeState: isOpen });

    return (
        <CSSTransition
            ref={nodeRef}
            in={isOpen}
            timeout={500}
            unmountOnExit
            classNames={{
                enter: 'translate-x-full',
                enterActive: 'translate-x-0',
                enterDone: 'translate-x-0 transition duration-500 ease-in-out',
                exitDone: 'translate-x-0',
                exitActive: 'translate-x-full transition duration-500 ease-in-out',
            }}
        >
            <SfDrawer
                ref={drawerRef}
                placement='right'
                open
                onClose={() => setIsOpen(false)}
                className="bg-neutral-50 z-99 md:w-[408px] w-full box-border"
            >
                <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-4 px-3 py-[14px] border-b border-b-[#F4F4F4] items-center">
                            <div className="flex h-7 items-center">
                                <button onClick={() => setIsOpen(false)} type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">Close panel</span>
                                    <Icons.flipBackward />
                                </button>
                            </div>
                            <h2 className="text-basesm font-semibold text-gray-900 text-center whitespace-pre col-span-2 leading-[11px]" id="slide-over-title">ตะกร้าสินค้า</h2>
                            <div className="flex h-7 items-center justify-end">
                                <button onClick={() => {setIsOpen(false);setWishOpen(true)}} type="button">
                                    <SfIconFavorite />
                                </button>
                            </div>
                        </div>
                        {isLoading ? (
                            <div className='flex flex-col gap-y-2 p-6'>
                                <Skeleton className='h-6 w-full'/>
                                <Skeleton className='h-6 w-full'/>
                                <Skeleton className='h-6 w-full'/>
                            </div>
                        ) : (
                            <>
                            {cartCount > 0 ? (
                            <div className="mt-6">
                                <div className="flow-root px-6">
                                    <ul role="list" className="flex flex-col gap-y-9">
                                        {Object.entries(cart).map(([itemCode]) => {
                                                const product = getByItemCode(itemCode)
                                                if (!inputRefs.current[itemCode]) {
                                                    inputRefs.current[itemCode] = React.createRef();
                                                    inputRefs.current[itemCode].value = Number(cart[itemCode]);
                                                }
                                                return (
                                                    <li key={itemCode} className="flex">
                                                        <div className="h-[90px] w-[90px] flex-shrink-0">
                                                            <Link to={`/products/${product?.name}`}>
                                                                {product?.website_image ? (
                                                                    <img src={`${import.meta.env.VITE_ERP_URL ?? ""}${product?.website_image}`} alt={product?.item_name} className="h-full w-full object-cover object-center" />
                                                                ) : (
                                                                    <div className='w-[90px] h-[90px] bg-gray-200'/>
                                                                )}
                                                            </Link>
                                                        </div>

                                                        <div className="ml-[10px] flex flex-1 flex-col justify-between">
                                                            <div>
                                                                <div className="flex justify-between text-base font-medium text-gray-900">
                                                                    <h3 className='text-texttag hover:underline text-sm'>
                                                                        <Link to={`/products/${product?.name}`} >{product?.web_item_name}</Link>
                                                                    </h3>
                                                                    <p className="ml-4 whitespace-pre text-basesm font-bold">{product?.formatted_price}</p>
                                                                </div>
                                                                {/* <p className="mt-1 text-base text-gray-500">{product?.short_description}</p> */}
                                                            </div>

                                                            <div className="flex items-center justify-between text-base">
                                                                <div className="flex items-center justify-between mt-4 sm:mt-0">
                                                                    <div className="flex rounded-[7px] bg-[#F3F3F3]">
                                                                        <SfButton
                                                                            type="button"
                                                                            variant="tertiary"
                                                                            disabled={Number(inputRefs.current[itemCode].value) == 1 || loading}
                                                                            square
                                                                            className="rounded-r-none px-2 text-secgray"
                                                                            aria-controls={null}
                                                                            aria-label="Decrease value"
                                                                            onClick={() => changeCart(itemCode, Number(inputRefs.current[itemCode].value) - 1 )}
                                                                            // onMouseDown={() => startDecreasing(itemCode)}
                                                                            // onMouseUp={stopIncreasing}
                                                                            // onMouseLeave={stopIncreasing}
                                                                        >
                                                                            <Icons.minus color='#979797'/>
                                                                        </SfButton>
                                                                        <input
                                                                            ref={el => inputRefs.current[itemCode] = el}
                                                                            id={itemCode}
                                                                            type="number"
                                                                            role="spinbutton"
                                                                            className="text-sm text-secgray outline-none z-10 appearance-none w-6 h-[33px] text-center bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:display-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:display-none [&::-webkit-outer-spin-button]:m-0 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none disabled:placeholder-disabled-900"
                                                                            min={1}
                                                                            max={999}
                                                                            value={cart[itemCode]}
                                                                            onChange={(event) => changeCart(itemCode, Number(event.target.value))}
                                                                        />
                                                                        <SfButton
                                                                            type="button"
                                                                            variant="tertiary"
                                                                            disabled={Number(inputRefs.current[itemCode].value) == 999 || loading}
                                                                            square
                                                                            className="rounded-l-none px-2 text-secgray"
                                                                            aria-controls={null}
                                                                            aria-label="Increase value"
                                                                            onClick={() => changeCart(itemCode, Number(inputRefs.current[itemCode].value) + 1 )}
                                                                            // onMouseDown={() => startIncreasing(itemCode)}
                                                                            // onMouseUp={stopIncreasing}
                                                                            // onMouseLeave={stopIncreasing}

                                                                        >
                                                                            <Icons.plus color='#979797'/>
                                                                        </SfButton>
                                                                    </div>
                                                                </div>
                                                                <div className="flex">
                                                                    <button disabled={loading} onClick={() => removeFromCart(itemCode)} type="button" className="font-medium text-secondary disabled:text-maingray disabled:cursor-not-allowed">
                                                                        <Icons.trash01 color='#979797' className='w-5 h-5'/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                )
                                            })
                                        }
                                    </ul>
                                </div>
                            </div>
                            ) : (
                                <div className="h-1/2 text-center flex flex-col gap-y-3 justify-end px-4">
                                    <h1 className='font-bold text-lg'>Your cart is empty</h1>
                                    <p className='text-base'>Go to the store to browse the products.</p>
                                    <Link to='/home/all%20items'>
                                        <SfButton onClick={() => setIsOpen(false)} className='btn-primary rounded-xl'>Shop now</SfButton>
                                    </Link>
                                </div>
                            )}
                            </>
                        )}
                        
                    </div>

                    {cartCount > 0 && (
                        <div className="p-6 pb-[10px] flex flex-col gap-y-9">
                        <div className="flex justify-between text-basesm font-bold text-gray-900 leading-[10px]">
                            <p>ยอดชำระ</p>
                            <p>฿ {getTotal()}</p>
                        </div>
                        <div className='flex flex-col gap-y-4'>
                            {!loading ? (   
                                <SfButton className="w-full btn-primary h-[50px] flex items-center gap-x-[10px] rounded-xl" disabled={cartCount == 0} onClick={() => { setIsOpen(false); navigate("/checkout"); }}>
                                    ชำระเงิน
                                    <Icons.shoppingBag01 color='white' className='w-[22px] h-[22px]'/>
                                </SfButton>                             
                            ) : (
                                <Skeleton className='h-[50px] w-full'/>
                            )}
                            <p className="text-sm text-center text-gray-500 leading-[9px]">ค่าจัดส่งและภาษีคำนวณเมื่อชำระเงิน</p>
                        </div>
                    </div>
                    )}
                </div>
            </SfDrawer>
        </CSSTransition>
    );
}

export default Cart