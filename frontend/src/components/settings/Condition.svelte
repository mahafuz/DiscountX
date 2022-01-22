<script>
    import {
        translation,
        getCoupons,
        getAppearance,
        getCartTypes,
        getConditions,
        getAllProducts
    } from './../../Helper'

    export let handleProducts
    export let settings
    export let products = []

    const coupons     = getCoupons()
    const appearnace  = getAppearance()
    const cartTypes   = getCartTypes()
    const conditions  = getConditions()
    const allProducts = getAllProducts();

</script>
<div>
    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'condition-tab-label' ) }</h4>
            <p class="desc">{ translation( 'condition-tab-desc' ) }</p>
        </div>
        <div class="discountx-settings-control">
            {#if coupons.length}
            <select name="savedCoupon" id="savedCoupon">
                {#each coupons as coupon }
                <option selected={coupon.text === settings.savedCoupon} value="{coupon.text}">{ coupon.text }</option>
                {/each}
            </select>
            {/if}
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'appearence-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <select name="appearance" id="appearance">
                { #each Object.entries( appearnace ) as [ key, value ] }
                <option selected={key === settings.appearance} value="{key}">{value}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'cart-type-label' ) }</h4>
            <p class="desc">{ translation( 'cart-type-desc' ) }</p>
        </div>
        <div class="discountx-settings-control">
            <select name="cart_type" id="cart_type">
                {#each Object.entries(cartTypes) as [ key, value ]}
                <option selected={key === settings.cart_type} value="{ key }">{ value }</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'condition-label' ) }</h4>
            <p class="desc">{ translation( 'condition-desc' ) }.</p>
        </div>
        <div class="discountx-settings-control">
            <select name="condition" id="condition">
                {#each Object.entries(conditions) as [ key, value ]}
                <option selected={key === settings.condition} value="{ key }">{ value }</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'products-label' ) }</h4>
            <p class="desc">{ translation( 'products-desc' ) }</p>
        </div>
        <div class="discountx-settings-control">
            <select name="products" id="products" multiple bind:value={products} on:change={handleProducts(products)}>
                {#each allProducts as product }
                <option value="{product.id}">{product.text}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{translation( 'number-label' ) }</h4>
            <p class="desc">{ translation( 'number-desc' ) }</p>
        </div>
        <div class="discountx-settings-control">
            <input type="number" name="number" id="number" bind:value={settings.number} />
        </div>
    </div>

</div>