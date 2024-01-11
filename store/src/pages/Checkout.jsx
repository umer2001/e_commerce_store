import { useState, useEffect, useMemo, useRef } from 'react';
import { SfCheckbox, SfButton, SfIconCheckCircle, SfIconClose, SfLink, SfInput, SfLoaderCircular } from '@storefront-ui/react';
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

const Checkout = () => {
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

    const {call : CheckPromoCode, loading, error : codeError, result : codeResult, reset, isCompleted : PromoCompleted } = useFrappePostCall('webshop.webshop.shopping_cart.cart.apply_coupon_code');
    const {call : ApplyDeliveryFee, loading : deliveryLoading, result : deliveryResult, error : deliveryError} = useFrappePostCall('webshop.webshop.shopping_cart.cart.apply_shipping_rule');
    const {isLoading : shippingRuleLoading, } = useFrappeGetCall('webshop.webshop.api.get_shipping_methods',undefined, `shippingRules`, {
        isOnline: () => shippingRules.length === 0,
        onSuccess: (data) => setShippingRules(data.message)
    })
    const {call : deleteCoupon, loading : deleteLoading, result : deleteResult, error : deleteError} = useFrappePostCall('webshop.webshop.shopping_cart.cart.remove_coupon_code');

    const { data:addressList } = useFrappeGetCall('headless_e_commerce.api.get_addresses', null, `addresses-${randomKey}`)
    const [addNewAddress, setAddNewAddress] = useState(addressList?.message?.length > 0 ? false : true);

    console.log(deliveryResult?.message)

    useEffect(() => {
        if (!deliveryResult && !deliveryError && !shippingRuleLoading && shippingRules.length > 0 && checkedState == '') {
            const deleteCouponAsync = async () => {
                await deleteCoupon();
            };
            deleteCouponAsync();
            ApplyDeliveryFee({'shipping_rule' : shippingRules[0].name })
            setCheckedState(shippingRules[0].name)
        }
    }, [deliveryResult, deliveryError, shippingRuleLoading, shippingRules])

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

    const { user } = useUser();
    const navigate = useNavigate();
    useEffect(() => {
      if (!getToken() && !user?.name) {
        navigate("/login");
      }
    }, [ user?.name]);

    const { getByItemCode } = useProducts()
    const { cart, cartCount, getTotal, resetCart } = useCart();

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
                {positiveAlert && (<p className="text-sm">Your promo code has been added.</p>)}
                {informationAlert && (<p className="text-sm">Your promo code has been removed.</p>)}
                {errorAlert && (<p className="text-sm text-negative-800">{errorAlert}</p>)}
            </>
        )
    }

    return (
        <main className='main-section'>
            <div className='grid grid-cols-1 lg:grid-cols-2 justify-center lg:gap-x-7'>
            <div className='p-4 w-full'>
                    <div>
                        <div className="flex justify-between items-end bg-neutral-100 md:bg-transparent py-2 px-4 md:p-0">
                            <p className="typography-headline-4 font-bold md:typography-headline-3">Order Summary</p>
                            <p className="typography-text-base font-medium">(Items: {cartCount})</p>
                        </div>
                        <h1 className='text-4xl font-bold pt-2'>{deliveryLoading ? <SfLoaderCircular/> : typeof codeResult?.message?.doc?.grand_total == 'undefined' ? deliveryResult?.message?.doc?.grand_total? `฿ ${deliveryResult?.message?.doc?.grand_total + getTotal()}` : `฿ ${getTotal()}` : `฿ ${codeResult?.message?.doc?.grand_total}`}</h1>
                        <div className="flex flex-col typography-text-base py-4">
                            {cartCount > 0 ? (
                                <ul className='flex flex-col gap-y-2'>
                                    {Object.entries(cart).map(([itemCode]) => {
                                        const product = getByItemCode(itemCode)
                                        // console.log(product)
                                        return (
                                        <li key={itemCode} className="flex pb-6">
                                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                <img src={product?.website_image} alt={product?.item_name} className="h-full w-full object-cover object-center" />
                                            </div>

                                            <div className="ml-4 flex flex-1 flex-col">
                                                <div>
                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                        <h3 className='text-texttag'>{product?.web_item_name}</h3>
                                                        <p className="ml-4">{product?.formatted_price}</p>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500">{product?.short_description}</p>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    {cart[itemCode]} {cart[itemCode] === 1 ? 'item' : 'items'}
                                                </div>
                                            </div>
                                        </li>
                                        )
                                    })}
                                </ul>
                            ) : <SfLoaderCircular />}
                        <div className='flex justify-between ml-28'>
                            <div className="flex flex-col grow pr-2">
                                <p>Items Subtotal</p>
                                <p className="my-2">Delivery</p>
                                <p>Estimated Sales Tax</p>
                            </div>
                            <div className="flex flex-col text-right">
                                <p>{deliveryLoading ? <SfLoaderCircular/> : deliveryResult?.message?.doc?.total ? `฿${deliveryResult?.message?.doc?.total}` : `฿${getTotal()}`}</p>
                                <p className="my-2">
                                    {deliveryLoading ? <SfLoaderCircular/> : deliveryResult?.message?.doc?.total_taxes_and_charges ? `฿${deliveryResult?.message?.doc?.total_taxes_and_charges}` : "฿0"}
                                </p>
                                <p></p>
                            </div>
                        </div>
                    </div>
                         <div className='ml-28'>
                            { !loading ? (codeResult ? (
                                <div className='flex flex-col gap-y-2 border-y border-neutral-200 mb-5 py-5'>
                                    <div className="flex items-center">
                                        <p>PromoCode</p>
                                        <SfButton size="sm" variant="tertiary" className="ml-auto mr-2" onClick={removePromoCode}>
                                            Remove
                                        </SfButton>
                                        <p>{codeResult.message.coupon_code.toUpperCase()}</p>
                                    </div>
                                    <CouponAlert />
                                </div>
                            ) : addPromo ? (
                                <form className="flex flex-col gap-y-2 py-4 border-y border-neutral-200" onSubmit={checkPromoCode}>
                                    <div className='flex gap-x-2'>
                                        <SfInput
                                            value={inputValue}
                                            placeholder="Enter promo code"
                                            wrapperClassName="grow"
                                            onChange={(event) => setInputValue(event.target.value)}
                                            onBlur={() => inputValue === "" && setAddPromo(false)}
                                            onKeyDown={e => e.key === 'Escape' && setAddPromo(false)}
                                        />
                                        <SfButton type="submit" className='bg-btn-primary text-btn-primary-foreground'>
                                            Apply
                                        </SfButton>
                                    </div>
                                    <CouponAlert />
                                </form>
                            ) : (
                                <a className='text-secondary hover:underline cursor-pointer inline-block' onClick={() => setAddPromo(true)}>Add promo code</a>
                            ))
                            : <SfLoaderCircular/>} 
                            {/*<p className="px-3 py-1.5 bg-secondary-100 text-secondary-700 typography-text-sm rounded-md text-center mb-4">
                                You are saving ${Math.abs(orderDetails.savings).toFixed(2)} on your order today!
                            </p>*/ }
                            <div className="flex justify-between typography-headline-4 md:typography-headline-3 font-bold pt-4">
                                <p>Total</p>
                                <p>{deliveryLoading ? <SfLoaderCircular/> : typeof codeResult?.message?.doc?.grand_total == 'undefined' ? deliveryResult?.message?.doc?.grand_total? `฿ ${deliveryResult?.message?.doc?.grand_total + getTotal()}` : `฿ ${getTotal()}` : `฿ ${codeResult?.message?.doc?.grand_total}`}</p>
                            </div>
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
                <form className="p-4 w-full flex gap-4 flex-wrap text-neutral-900">
                    {cartContents.hasNormalItem && (
                        <>
                            <label className="w-full">
                                <legend className="mb-4 font-bold text-neutral-900 text-lg">Billing and shipping address</legend>
                                <AddressOptions
                                    onChange={value => formik.setFieldValue('billing_address', value)}
                                    value={formik.values.billing_address}
                                    error={formik.errors.billing_address}
                                    randomKey={randomKey}
                                />
                                {!addNewAddress && <a className='text-secondary hover:underline cursor-pointer inline-block pt-4' onClick={() => setAddNewAddress(true)}>Add a new billing and shipping address</a>}
                            </label>
                            {addNewAddress && (
                                <label className="w-full">
                                    <div className='flex items-center justify-between mb-4'>
                                        <legend className="font-bold text-neutral-900 text-lg">Add a new billing and shipping address</legend>
                                        {addressList?.message?.length > 0 ? <a className='text-secondary hover:underline cursor-pointer inline-block' onClick={() => setAddNewAddress(false)}>Cancel</a> : null}
                                    </div>
                                    <AddressForm onSuccess={() => setrandomKey(randomKey + 1)}/>
                                </label>
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
                            <PaymentMethods onChange={value => formik.setFieldValue('payment_method', value)} value={formik.values.payment_method} error={formik.errors.payment_method} />

                        </>
                    )}
                    {!shippingRuleLoading ?
                    (<label className='w-full'>
                        <legend className="mb-4 font-bold text-neutral-900">Shipping methods</legend>
                        <div className='flex flex-col gap-y-2 mb-2'>
                            { shippingRules.map(({ name, shipping_amount }) => (
                                <SfListItem
                                as="label"
                                key={name}
                                disabled={deliveryLoading}
                                slotPrefix={
                                    <SfRadio
                                    name="delivery-options"
                                    value={name}
                                    Checked={checkedState == name}
                                    className='checked:bg-primary'
                                    onChange={() => {
                                        setCheckedState(name);
                                        ApplyDeliveryFee({'shipping_rule' : name })
                                    }}
                                    />
                                }
                                slotSuffix={<span className="text-gray-900">{shipping_amount}฿</span>}
                                className="!items-start w-full border rounded-md border-neutral-200"
                                >
                                {name}
                                </SfListItem>
                            )) }
                        </div>
                    </label>
                    ) : <SfLoaderCircular/>}
                    {cartContents.hasGiftItem && (
                        <label className="w-full">
                            <span className="pb-1 text-sm font-medium text-neutral-900 font-body">Select Branch for Redemption</span>
                            <BranchSelect
                                name="branch"
                                onChange={formik.handleChange}
                                value={formik.values.branch}
                                error={formik.errors.branch}
                            />
                        </label>
                    )}
                    <SfButton size="lg" className="w-full mt-4 bg-btn-primary text-btn-primary-foreground" onClick={formik.handleSubmit}>
                        Place Order
                    </SfButton>
                    <div className="typography-text-sm mt-4 text-center text-primary">
                        By placing my order, you agree to our <SfLink href="#" className='text-secondary'>Terms and Conditions</SfLink> and our{' '}
                        <SfLink href="#" className='text-secondary'>Privacy Policy.</SfLink>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default Checkout

function AddressOptions({
    value,
    onChange,
    error,
    randomKey = 0
}) {
    const { data } = useFrappeGetCall('headless_e_commerce.api.get_addresses', null, `addresses-${randomKey}`)

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data?.message?.map(({ name: nameVal, address_title, address_line2 = null, city, state, country }) => (
                    <label key={nameVal} className="relative xs:w-full md:w-auto" onClick={() => onChange(nameVal)}>
                        <div className={`cursor-pointer rounded-md -outline-offset-2 hover:border-primary-200 hover:bg-primary-100 peer-focus:border-primary-200 peer-focus:bg-primary-100 ${value == nameVal ? "border-primary-300 bg-primary-100 outline outline-2 outline-primary-700" : ""}`}>
                            <AddressCard title={address_title} addressLine2={address_line2} city={city} state={state === "Select One" ? null : state} country={country} />
                        </div>
                    </label>
                ))}
            </div>
            {error && <p className="text-negative-600">Please select an address</p>}
        </>
    );
}