import { useState, useEffect, useMemo, useRef } from 'react';
import { SfCheckbox, SfButton, SfIconCheckCircle, SfIconClose, SfLink, SfInput, SfLoaderCircular, SfIconArrowBack, SfIconExpandMore, SfIconExpandLess, SfDrawer, SfIconArrowForward } from '@storefront-ui/react';
import { CSSTransition } from 'react-transition-group';
import { useCart } from '../hooks/useCart';
import PaymentMethods from '../components/PaymentMethods';
import AddressCard from '../components/AddressCard';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { useFormik } from 'formik';
import { orderSchema } from '../components/forms/orderSchema';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import BranchSelect from '../components/form-controls/BranchSelect';
import { useUser } from '../hooks/useUser';
import { getToken } from '../utils/helper';
import { SfRadio, SfListItem } from '@storefront-ui/react';
import AddressForm from '../components/forms/AddressForm';
import { Skeleton } from '../components/Skeleton';
import { useSetting } from '../hooks/useWebsiteSettings';
import defaultLogo from '../assets/defaultBrandIcon.svg'
import { Icons } from '../components/icons';
import classNames from 'classnames'

export default function Checkout(){
    const errorTimer = useRef(0);
    const positiveTimer = useRef(0);
    const informationTimer = useRef(0);
    const [addPromo, setAddPromo] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [informationAlert, setInformationAlert] = useState(false);
    const [positiveAlert, setPositiveAlert] = useState(false);
    const [errorAlert, setErrorAlert] = useState(false);
    const [checkedState, setCheckedState] = useState('');
    const [shippingRules, setShippingRules] = useState([]);
    const [randomKey, setrandomKey] = useState(0)
    const [showOrderSum, setShowOrderSum] = useState(true)
    const [moreAddresses, setMoreAddresses] = useState(false)
    const [morePayments, setMorePayments] = useState(false)

    const {appName, appLogo,defaultTaxe } = useSetting()
    const {call : CheckPromoCode, loading, error : codeError, result : codeResult, reset, isCompleted : PromoCompleted } = useFrappePostCall('webshop.webshop.shopping_cart.cart.apply_coupon_code');
    const {call : ApplyDeliveryFee, loading : deliveryLoading, result : deliveryResult, error : deliveryError} = useFrappePostCall('webshop.webshop.shopping_cart.cart.apply_shipping_rule');
    const {isLoading : shippingRuleLoading, } = useFrappeGetCall('webshop.webshop.api.get_shipping_methods',undefined, `shippingRules`, {
        isOnline: () => shippingRules.length === 0,
        onSuccess: (data) => setShippingRules(data.message)
    })
    const {call : deleteCoupon, loading : deleteLoading, result : deleteResult, error : deleteError} = useFrappePostCall('webshop.webshop.shopping_cart.cart.remove_coupon_code');

    const { data:addressList } = useFrappeGetCall('headless_e_commerce.api.get_addresses', null, `addresses-${randomKey}`)
    const [addNewAddress, setAddNewAddress] = useState(false);

    useEffect(() => {
        if (!deliveryResult && !deliveryError && !shippingRuleLoading && shippingRules.length > 0 && checkedState == '') {
            const deleteCouponAsync = async () => {
                await deleteCoupon();
            };
            deleteCouponAsync();
            ApplyDeliveryFee({'shipping_rule' : shippingRules[0].name })

            formik.setFieldValue('billing_address', addressList?.message[0]?.name);

            setCheckedState(shippingRules[0].name);
            formik.setFieldValue('shipping_method', shippingRules[0].name) 
        }
    }, [deliveryResult, deliveryError, shippingRuleLoading, shippingRules,addressList])

    useEffect(() => {
        clearTimeout(errorTimer.current);
        errorTimer.current = window.setTimeout(() => setErrorAlert(false), 5000);
        return () => {
          clearTimeout(errorTimer.current);
        };
      }, [codeError]);

      useEffect(() => {
        clearTimeout(positiveTimer.current);
        positiveTimer.current = window.setTimeout(() => setPositiveAlert(false), 5000);
        return () => {
          clearTimeout(positiveTimer.current);
        };
      }, [codeResult]);

      useEffect(() => {
        clearTimeout(informationTimer.current);
        informationTimer.current = window.setTimeout(() => setInformationAlert(false), 5000);
        return () => {
          clearTimeout(informationTimer.current);
        };
      }, [informationAlert]);

      const removePromoCode = async() => {
        reset()
        setInformationAlert(true);
        await deleteCoupon()
        ApplyDeliveryFee({'shipping_rule' : checkedState})
      };
    
      const checkPromoCode = (event) => {
        event.preventDefault();
        CheckPromoCode({"applied_code" : inputValue, "applied_referral_sales_partner" : false}) // change refereer here when we have it
      };

    const { user } =  useUser();
    const navigate = useNavigate();
    useEffect(() => {
      if (!getToken() && !user?.name) {
        navigate("/login");
      }
    }, [ user?.name]);

    const { getByItemCode, isLoading:isProductLoading, settingPage } = useProducts()
    const { cart, cartCount, getTotal, resetCart, loading:cartLoading } = useCart();

    const cartContents = useMemo(() => {
        return Object.entries(cart).reduce((acc, [item_code]) => {
            const product = getByItemCode(item_code);
            if (product?.item_group === 'Gift' || product?.item_group === 'Gift and Cards') {
                return {
                    ...acc,
                    hasGiftItem: true,
                }
            }
            return {
                ...acc,
                hasNormalItem: true,
            }
        }, {
            hasNormalItem: false,
            hasGiftItem: false,
        })
    }, [cart, getByItemCode])

    const { call, isCompleted, result, error } = useFrappePostCall('headless_e_commerce.api.place_order');

    const formik = useFormik({
        initialValues: {
            cartContents,
            billing_address: '',
            shipping_address: '',
            use_different_shipping: false,
            loyalty_points: 0,
            items: cart,
            payment_method: 'bank-transfer',
            branch: '',
        },
        validationSchema: orderSchema,
        validateOnChange: false,
        onSubmit: call
    });

    useEffect(() => {
        formik.setFieldValue('items', Object.entries(cart).map(([item_code, qty]) => ({ item_code, qty })))
        formik.setFieldValue('cartContents', cartContents)
    }, [cartCount, cartContents])

    useEffect(() => {
        if (isCompleted ) {
            if (result?.message?.name) {
                resetCart();
                navigate(`/thankyou?order_id=${result.message.name}&amount=${result.message.grand_total}`)
            }
        }
        if (error) { setErrorAlert(JSON.parse(JSON.parse(error?._server_messages)[0]).message) }
        if(deliveryError) { setErrorAlert(JSON.parse(JSON.parse(deliveryError?._server_messages)[0]).message) }
        if(codeError) { setErrorAlert(JSON.parse(JSON.parse(codeError?._server_messages)[0]).message) }
        if(PromoCompleted) { setPositiveAlert(true) }
    }, [isCompleted, error, PromoCompleted, codeError, deliveryError])

    const CouponAlert = () => {
        return (
            <>
                {/* {positiveAlert && (<p className="text-sm">Your promo code has been added.</p>)} */}
                {/* {informationAlert && (<p className="text-sm">Your promo code has been removed.</p>)} */}
                {errorAlert && (<p className="text-sm text-red-500">{errorAlert}</p>)}
            </>
        )
    }

    const UpdateAddresses = () => {
        setAddNewAddress(false);
        setrandomKey(randomKey + 1);
        setMoreAddresses(true);
    }

    const NewAddressForm = () => {
        return (
            <label className="w-full">
                {addressList?.message?.length > 0 ? (<div className='flex items-center justify-between mb-4'>
                    <legend className="font-medium text-basesm text-secgray">เพิ่มที่อยู่ใหม่</legend>
                    <a className='text-sm text-darkgray hover:underline cursor-pointer inline-block font-medium' onClick={() => setAddNewAddress(false)}>ยกเลิก</a>
                </div>) : null}
                <AddressForm onFormSubmit={() => UpdateAddresses() }/>
            </label>
        )
    }

    const handleAddNewAddress = () => {
        setAddNewAddress(true);
        setMoreAddresses(false)
    }

    console.log(shippingRules)

    return (
        <main className='main-section-small'>
            <div className='grid grid-cols-1 lg:grid-cols-2 justify-center gap-x-10'>
                <div className='w-full py-5 pr-[43px]'>

                    <div className='flex items-center gap-x-4 mb-16 h-10'>
                        <div onClick={() => navigate(-1)} className='cursor-pointer'>
                            <Icons.flipBackward color='#A9A9A9'/>
                        </div>
                        {appLogo === null ? (
                            <Skeleton className='h-8 w-[120px]'/>
                        ) : (
                            <picture>
                            <source srcSet={appLogo ? `${import.meta.env.VITE_ERP_URL ?? ''}${appLogo}` : defaultLogo} media="(min-width: 768px)" />
                            <img
                                src={appLogo ? `${import.meta.env.VITE_ERP_URL ?? ''}${appLogo}` : defaultLogo}
                                alt="Sf Logo"
                                className='max-h-[43px]'
                            />
                            </picture>
                        )}
                    </div>
                    <div className="flex justify-between items-center pb-6 lg:pb-0 border-b lg:border-0 lg:pl-[21px]">
                        <p className="text-sm text-secgray leading-[9px]">ยอดรวมทั้งหมด</p>
                        <div className='flex items-center gap-x-2'>

                            <h1 className='font-bold lg:hidden text-sm leading-[9px]'>{isProductLoading ? <Skeleton className='h-6 w-[100px]'/> : typeof codeResult?.message?.doc?.grand_total == 'undefined' ? `฿ ${codeResult?.message?.doc?.grand_total.toLocaleString()}` : `฿ ${deliveryResult?.message?.doc?.grand_total.toLocaleString()}`  }</h1>
                            {isProductLoading ? <Skeleton className='h-4 w-[100px]'/> : <p className="text-secgray text-sm font-medium">{cartCount} ชิ้น</p>}
                            <span onClick={() => setShowOrderSum(!showOrderSum)} className='lg:hidden cursor-pointer'>
                                {showOrderSum ? <SfIconExpandLess /> : <SfIconExpandMore />}
                            </span>
                        </div>
                    </div>
                    <div className={`${showOrderSum ? 'block' : 'hidden'} lg:!block lg:pl-[21px] lg:pr-[19px]`}>
                        <h1 className='text-[56px] font-bold pt-[26px] hidden lg:block leading-5'>{isProductLoading ? <Skeleton className='h-8 w-[100px]'/> : typeof codeResult?.message?.doc?.grand_total == 'undefined' ? deliveryResult?.message?.doc?.grand_total ? `฿ ${deliveryResult?.message?.doc?.grand_total.toLocaleString()}` : 'Change address' : `฿ ${codeResult?.message?.doc?.grand_total.toLocaleString()}` }</h1>
                        <div className="flex flex-col typography-text-basesm pt-[71px] pb-4">
                        {cartCount > 0 && (
                            <ul className='flex flex-col gap-y-4'>
                                {Object.entries(cart).map(([itemCode]) => {
                                    const product = getByItemCode(itemCode);
                                    return (
                                    <>
                                        {!isProductLoading ? (
                                            <li key={itemCode} className="flex pb-5">
                                                <div className="h-[53px] w-[53px] flex-shrink-0 overflow-hidden">
                                                    <img src={product?.website_image ? `${import.meta.env.VITE_ERP_URL || ""}${product.website_image}` : `${import.meta.env.VITE_ERP_URL || ""}${settingPage.default_product_image}`} className="h-full w-full object-cover object-center"/>
                                                </div>

                                                <div className="ml-[10px] flex flex-1 flex-col gap-y-0.5">
                                                    <div className="flex justify-between text-gray-900">
                                                        <h3 className='text-darkgray pr-8 text-basesm'>{product?.web_item_name}</h3>
                                                        <p className='whitespace-pre font-bold text-[20px] leading-5'>{product?.formatted_price.toLocaleString()}</p>
                                                    </div>

                                                    <div className="flex justify-between text-basesm text-black font-bold">
                                                        {cart[itemCode]} ชิ้น
                                                    </div>
                                                </div>
                                            </li>
                                        ) : (
                                            <div className='flex justify-between mb-4'>
                                                <div className='flex gap-x-2'>
                                                    <Skeleton className='h-[53px] w-[53px]'/>
                                                    <Skeleton className='h-4 w-[100px]'/>
                                                </div>
                                                <Skeleton className='h-4 w-[100px]'/>
                                            </div>
                                        )}
                                    </>
                                    )
                                })}
                            </ul>
                        )}
                        <div className='flex justify-between lg:ml-[98px] pt-[21px] border-t'>
                            <div className="flex flex-col pr-2 gap-y-[21px]">
                                <p className='text-[20px] leading-[10px]'>ยอดรวมย่อย</p>
                                <p className="text-maingray text-[20px] leading-[10px]">ค่าจัดส่ง</p>
                                <p className='text-maingray text-[20px] leading-[10px]'>
                                ภาษีสินค้า
                                {defaultTaxe && ` (${
                                    defaultTaxe?.rate !== 0 ? defaultTaxe?.rate+'%' : ''
                                }${
                                    defaultTaxe?.rate !== 0 && defaultTaxe?.amout !== 0 ? ' + ' : ''
                                }${
                                    defaultTaxe?.amout !== 0 ? +defaultTaxe?.amout + '฿' : ''
                                })`}
                                </p>
                            </div>
                            <div className="flex flex-col text-right gap-y-[21px]">
                                <p className='text-basesm font-bold leading-[10px]'>{isProductLoading ? <Skeleton className='h-4 w-[100px]'/> : deliveryResult?.message?.doc?.total ? `฿${deliveryResult?.message?.doc?.total.toLocaleString()}` : `฿${getTotal().toLocaleString()}`}</p>
                                <p className="text-basesm text-maingray font-bold leading-[10px]">
                                    {isProductLoading ? <Skeleton className='h-4 w-[100px]'/> : deliveryResult?.message?.doc?.total_taxes_and_charges ? `฿${deliveryResult?.message?.doc?.total_taxes_and_charges.toLocaleString()}` : "฿0"}
                                </p>
                                <p className='text-maingray text-basesm leading-[10px]'>-</p>
                            </div>
                        </div>
                    </div>
                        <div className='lg:ml-[98px]'>
                            {!isProductLoading ? (codeResult ? (
                                <div className='flex flex-col gap-y-2 my-[5px]'>
                                    <div className="flex items-center justify-between">
                                        <div className='bg-neutral-100 rounded-xl px-3 py-[10px] flex items-center gap-x-2 text-[20px] text-secgray leading-[10px] font-medium'>
                                            <div className='flex items-center gap-x-[5px]'>
                                                <Icons.ticket01 color="#979797" />
                                                <p>{codeResult.message.coupon_code.toUpperCase()}</p>
                                            </div>
                                            <SfButton size="sm" variant="tertiary" className='!p-0' onClick={removePromoCode}>
                                                <Icons.x color="#979797"/>
                                            </SfButton>
                                        </div>
                                        <p className='text-basesm'>{codeResult.message.coupon_code.toUpperCase()}</p>
                                    </div>
                                    <CouponAlert />
                                </div>
                            ) : addPromo ? (
                                <form className="flex flex-col gap-y-2 py-[5px]" onSubmit={checkPromoCode}>
                                    <div className='flex gap-x-[10px]'>
                                        <SfInput
                                            value={inputValue}
                                            placeholder="ใส่คูปองส่วนลด"
                                            wrapperClassName={`grow rounded-xl ${errorAlert ? 'border border-red-500/50' : ''}`}
                                            onChange={(event) => setInputValue(event.target.value)}
                                            onBlur={() => inputValue === "" && setAddPromo(false)}
                                            onKeyDown={e => e.key === 'Escape' && setAddPromo(false)}
                                            className='text-basesm'
                                        />
                                        <SfButton type="submit" className='btn-primary text-basesm rounded-xl'>
                                            ใช้งาน
                                        </SfButton>
                                    </div>
                                    <CouponAlert />
                                </form>
                            ) : (
                                <a className='text-secondary hover:underline cursor-pointer inline-block font-medium text-basesm pt-[22px] pb-[17px] leading-[10px]' onClick={() => setAddPromo(true)}>ใส่คูปองส่วนลด</a>
                            )) : <Skeleton className='h-6 w-[100px]'/>} 
                            {/*<p className="px-3 py-1.5 bg-secondary-100 text-secondary-700 typography-text-base rounded-xl text-center mb-4">
                                You are saving ${Math.abs(orderDetails.savings).toFixed(2)} on your order today!
                            </p>*/ }
                            </div>
                            <div className="flex justify-between typography-headline-4 md:typography-headline-3 py-4 lg:pt-4 lg:ml-[98px] border-y lg:border-b-0 mt-4 font-medium">
                                <p className='text-basesm leading-[10px] tracking-[-0.4px]'>ยอดชำระเงินทั้งหมด</p>
                                <p className='text-basesm leading-[10px]'>{isProductLoading ? <Skeleton className='h-4 w-[100px]'/> : typeof codeResult?.message?.doc?.grand_total == 'undefined' ? deliveryResult?.message?.doc?.grand_total ? `฿ ${deliveryResult?.message?.doc?.grand_total.toLocaleString()}` : 'Your address is not supported' : `฿ ${codeResult?.message?.doc?.grand_total.toLocaleString()}`}</p>
                            </div>
                        {/* <SfInput
                            placeholder='Enter loyalty points to redeem'
                            slotSuffix={<strong className='w-16'>of {user?.loyalty_points}</strong>}
                            maxLength={user?.loyalty_points?.toString().length}
                            name="loyalty_points"
                            value={formik.values.loyalty_points}
                            onChange={formik.handleChange}
                        /> */}
                    </div>
                </div>
                <form className="w-full flex flex-col gap-10 text-neutral-900 p-[60px] pt-[7.75em] min-h-screen checkout-shadow">
                    {cartContents.hasNormalItem ? (
                        <>
                            {addressList ? (
                                <>{addressList?.message?.length > 0 ? (
                                    <>
                                        <div className='w-full flex flex-col gap-y-2'>
                                            <label className="w-full">
                                                <legend className="font-bold text-darkgray text-base">ข้อมูลการจัดส่ง</legend>
                                                {!addNewAddress ? (
                                                    <div className='flex flex-col gap-y-2 mt-8'>
                                                        <h2 className="font-medium text-basesm text-secgray">ที่อยู่*</h2>
                                                        <div className='border border-lightgray rounded-xl bg-neutral-50 overflow-hidden'>
                                                            <a className='p-6 flex items-center justify-between w-full cursor-pointer' onClick={() => setMoreAddresses(true)}>
                                                                <div className='flex items-center gap-x-2'>
                                                                    <Icons.marketPin04 color='#666666' className='min-w-6'/>
                                                                    <span className='text-basesm font-bold text-darkgray'>{formik.values.billing_address ? formik.values.billing_address : 'เพิ่ม / เลือกที่อยู่การจัดส่ง'}</span>
                                                                </div>
                                                                <SfIconArrowForward />
                                                            </a>
                                                            {(formik.values.billing_address && !addNewAddress) && (
                                                                <>
                                                                    <div className='p-6 pt-0'>
                                                                        {addressList?.message?.filter(address => address.name === formik.values.billing_address).map(a => (
                                                                            <div className='flex flex-col gap-y-1'>
                                                                                {/* <h2 className='font-semibold text-base mb-2'>{a.address_title}</h2> */}
                                                                                <p className='text-basesm'>{a.phone}</p>
                                                                                <p className='text-basesm'>{a.state}</p>
                                                                                <p className='text-basesm'>{a.city}</p>
                                                                                <p className='text-basesm'>{a.country}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className='h-[9px] w-full post-gradient mt-[5px]'/>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </label>
                                        </div>
                                        <AddressDrawer isOpen={moreAddresses} setIsOpen={setMoreAddresses} title='เลือกที่อยู่'>
                                            <AddressOptions
                                                onChange={value => {formik.setFieldValue('billing_address', value); }}
                                                value={formik.values.billing_address}
                                                error={formik.errors.billing_address}
                                                randomKey={randomKey}
                                                onClick={() => {setMoreAddresses(false);setAddNewAddress(false)}}
                                            />
                                            <div className='fixed bottom-0 shadow-main p-6 left-0 w-full bg-white'>
                                                <SfButton className='btn-primary w-full text-base h-[50px]' variant='tertiary' onClick={handleAddNewAddress}>เพิ่มที่อยู่ใหม่</SfButton>
                                            </div>
                                        </AddressDrawer>
                                    </>
                                ) : <NewAddressForm />}</>
                            ) : (
                                <div>
                                    <Skeleton className='h-5 w-[100px] mb-8'/>
                                    <div className='flex flex-col gap-y-2'>
                                        <Skeleton className='h-5 w-[60px]'/>
                                        <Skeleton className='h-[72px] w-full'/>
                                    </div>
                                </div>
                            )}

                            {addNewAddress && (
                                <NewAddressForm />
                            )}
                            {/* <label className="w-full flex items-center gap-2">
                                <SfCheckbox
                                    name="use_different_shipping"
                                    onChange={formik.handleChange}
                                    checked={formik.values.use_different_shipping} />
                                Use different shipping address
                            </label>
                            {formik.values.use_different_shipping && (
                                <AddressOptions
                                    onChange={value => formik.setFieldValue('shipping_address', value)}
                                    value={formik.values.shipping_address}
                                    error={formik.errors.shipping_address}
                                    randomKey={randomKey}
                                />
                                <AddressForm onSuccess={() => setrandomKey(randomKey + 1)}/>
                            )} */}
                                {!shippingRuleLoading && addressList ?
                                (<>
                                <label className='w-full'>
                                    <legend className="mb-2 font-medium text-basesm text-secgray">ตัวเลือกการจัดส่ง</legend>
                                    <div className='border border-lightgray rounded-xl bg-neutral-50 overflow-hidden'>
                                        {shippingRules?.length > 0 ? (
                                            <a className='px-6 py-[18px] flex items-center justify-between w-full cursor-pointer' onClick={() => setMorePayments(true)}>
                                                <div className='flex items-center justify-between w-full'>
                                                    <div className='flex items-center gap-x-2'>
                                                        <Icons.truck01 color='#595959'/>
                                                        <span className='text-basesm font-bold text-darkgray'>{checkedState ? checkedState : 'หรือเลือกวิธีการจัดส่งที่ต้องการ'}</span>
                                                    </div>
                                                    <div className='flex items-center gap-x-2'>
                                                        <span className='text-basesm font-bold text-darkgray'>{checkedState ? `฿${shippingRules?.find(rule => rule.name === checkedState).shipping_amount.toLocaleString()}` : null}</span>
                                                        <SfIconArrowForward />
                                                    </div>
                                                </div>
                                            </a>
                                        ) : (
                                            <div className='px-6 py-[18px] flex items-center gap-x-2'>
                                                <Icons.truck01 color='#595959'/>
                                                <span className='text-basesm font-medium text-secgray'>ไม่มีตัวเลือกในการจัดส่ง</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <AddressDrawer isOpen={morePayments} setIsOpen={setMorePayments} title='เลือกการจัดส่ง'>
                                    <div className='flex flex-col gap-y-3 font-medium'>
                                        { shippingRules.map(({ name, shipping_amount }) => (
                                            <SfListItem
                                            as="label"
                                            key={name}
                                            disabled={isProductLoading}
                                            slotPrefix={
                                                <SfRadio
                                                name="delivery-options"
                                                value={name}
                                                Checked={checkedState == name}
                                                className='checked:bg-black !border border-primary flex hidden'
                                                onChange={() => {
                                                    setCheckedState(name);
                                                    formik.setFieldValue('shipping_method', name);
                                                    ApplyDeliveryFee({'shipping_rule' : name })
                                                }}
                                                />
                                            }
                                            slotSuffix={<span className="text-gray-900 text-basesm font-bold">฿{shipping_amount.toLocaleString()}</span>}
                                            className={classNames('w-full !gap-0 border rounded-xl border-neutral-100 !p-4 text-basesm bg-neutral-50 font-bold', {'outline outline-[1px]': checkedState == name})}
                                            >
                                            {name}
                                            </SfListItem>
                                        )) }
                                    </div>
                                </AddressDrawer>
                                </>
                                ) : (
                                    <div className='flex flex-col gap-y-2'>
                                        <Skeleton className='h-5 w-[100px]'/>
                                        <Skeleton className='h-[118px] w-full'/>
                                    </div>
                                )}
                                {cartContents.hasGiftItem && (
                                    <label className="w-full">
                                        <span className="pb-1 text-base font-medium text-neutral-900 font-body">Select Branch for Redemption</span>
                                        <BranchSelect
                                            name="branch"
                                            onChange={formik.handleChange}
                                            value={formik.values.branch}
                                            error={formik.errors.branch}
                                        />
                                    </label>
                                )}
                            {!shippingRuleLoading && addressList ? (
                                <>
                                    <PaymentMethods onChange={value => formik.setFieldValue('payment_method', value)} value={formik.values.payment_method} error={formik.errors.payment_method} />
                                    <div className='w-full'>
                                        <SfButton size="lg" className="w-full btn-primary text-base h-[50px] rounded-xl" onClick={formik.handleSubmit}>
                                            ชำระเงิน
                                        </SfButton>
                                        <div className="mt-3 text-sm text-secgray">
                                            เมื่อคลิก 'ชำระเงิน' คุณยินยอมให้ทำการชำระเงินตาม <SfLink href="#" className='text-linkblack no-underline'>นโยบายความเป็นส่วนตัว</SfLink> และ<SfLink href="#" className='text-linkblack no-underline'>เงื่อนไขการให้บริการของทางร้าน</SfLink>
                                        </div>
                                    </div>
                                    <div className='w-full flex justify-center h-10 items-center'>
                                        <button className='flex items-center gap-x-2 text-base font-medium'>
                                            <Icons.messageQuestionCircle />
                                            ขอความช่วยเหลือ
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <div className='flex flex-col gap-y-2 mb-10'>
                                        <Skeleton className='h-5 w-[100px]'/>
                                        <div className='flex gap-x-4'>
                                            <Skeleton className='h-[58px] w-full'/>
                                            <Skeleton className='h-[58px] w-full'/>
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-y-2'>
                                        <Skeleton className='h-[50px] w-full'/>
                                        <Skeleton className='h-4 w-full'/>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className='flex flex-col gap-y-8'>
                            <Skeleton className='h-4 w-[300px]'/>
                            <div className='flex flex-col gap-y-2'>
                                <Skeleton className='h-6 w-full'/>
                                <Skeleton className='h-6 w-full'/>
                                <Skeleton className='h-6 w-full'/>
                                <Skeleton className='h-12 w-full mt-6'/>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}

const AddressDrawer = ({isOpen, setIsOpen, children, title}) => {
    const nodeRef = useRef(null);
    const drawerRef = useRef(null);
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
                className="bg-neutral-50 z-99 md:w-[386px] w-full box-border"
            >
                <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex items-center gap-x-[10px] p-4 border-b">
                            <div className="flex h-7 items-center">
                                <button onClick={() => setIsOpen(false)} type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">Close panel</span>
                                    <Icons.flipBackward />
                                </button>
                            </div>
                            <h2 className="text-base font-medium text-gray-900 text-center whitespace-pre" id="slide-over-title">{title}</h2>
                        </div>
                        <div className="flow-root p-6 mb-24">
                            {children}
                        </div>
                    </div>
                </div>
            </SfDrawer>
        </CSSTransition>
    );
}

function AddressOptions({
    value,
    onChange,
    error,
    randomKey = 0,
    limit,
    onClick
}) {
    const { data } = useFrappeGetCall('headless_e_commerce.api.get_addresses', null, `addresses-${randomKey}`)
    const handleSelect = (val) => {
        onChange(val);
        onClick()
    }
    return (
        <>
            <div className="grid grid-cols-1 gap-3">
                {data?.message?.map(({ name: nameVal, address_title, address_line2 = null, city, state, country }) => (
                    <label key={nameVal} className="relative xs:w-full md:w-auto" onClick={() => handleSelect(nameVal)}>
                        <div className={`cursor-pointer rounded-xl -outline-offset-2 hover:border-primary-200 hover:bg-primary-100 peer-focus:border-primary-200 peer-focus:bg-primary-100 bg-neutral-50`}>
                            <AddressCard title={address_title} addressLine2={address_line2} city={city} state={state === "Select One" ? null : state} country={country} active={value === nameVal}/>
                        </div>
                    </label>
                )).slice(0, limit || data?.message?.length)}
            </div>
            {error && <p className="text-red-500 mt-3 text-base font-medium">Please select an address</p>}
        </>
    );
}