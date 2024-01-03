import React, { useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import { useFrappeAuth } from 'frappe-react-sdk';
import { useParams } from 'react-router-dom';

const Home = () => {
    const { updateCurrentUser } = useFrappeAuth();
    const { products } = useProducts()

    const idFromUrl = useParams().itemsgroup;

    useEffect(() => {
        updateCurrentUser();
    }, [updateCurrentUser]);

    return (
        <>
            <main className='main-section'>
              <h1 className="mb-4 primary-heading">{idFromUrl.toUpperCase()}</h1>
                    <div
                       className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 place-items-center"
                        >
                            {(products ?? []).filter((product) => idFromUrl === 'all items' || idFromUrl === product.item_group).map((product) => (
                                <ProductCard
                                    key={product.item_code}
                                    title={product.web_item_name}
                                    productId={product.name}
                                    description={product.short_description}
                                    itemCode={product.item_code}
                                    price={product.formatted_price}
                                    thumbnail={product.website_image}
                                    isGift={product?.item_group === "Gift" || product?.item_group === "Gift and Cards"}
                                />
                            ))}
                    </div>
            </main>
        </>
    )
}

export default Home