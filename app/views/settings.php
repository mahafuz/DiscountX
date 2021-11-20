<?php

/**
 * Responsible for displaying settings page.
 *
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly
?>

<div class="ct-container ct-options-wrapper wrap">
    <form action="options.php" id="ct-settings-form">

        <div class="ct-options-box">
            <h2 class="ct-options-box-header"><i class="dashicons-before dashicons-cart"></i> <?php _e( 'Cart Targeting Settings', 'cart-targeting' ); ?></h2>
            <div class="ct-options-settings-section">
                <div class="ct-flex">

                    <div class="ct-settings-panel coupon-code-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Coupon Code', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input type="text" name="coupon_code" id="coupon_code" value="<?php echo $settings->coupon_code; ?>" />
                        </div>
                    </div>

                    <div class="ct-settings-panel appearance-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Appearance', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <select name="appearance" id="appearance">
                                <option value="show" <?php selected( $settings->appearance, 'show' ); ?>><?php _e( 'Show', 'cart-targeting' ); ?></option>
                                <option value="dont-show" <?php selected( $settings->appearance, 'dont-show' ); ?>><?php _e( "Don't show", 'cart-targeting' ); ?></option>
                            </select>
                        </div>
                    </div>

                    <div class="ct-settings-panel cart-type-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Cart type', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <select name="cart_type" id="cart_type">
                                <option value="money" <?php selected( $settings->cart_type, 'money' ); ?>><?php _e( 'Cart money value', 'cart-targeting' ); ?></option>
                                <option value="items" <?php selected( $settings->cart_type, 'items' ); ?>><?php _e( 'Number of cart items', 'cart-targeting' ); ?></option>
                                <option value="products" <?php selected( $settings->cart_type, 'products' ); ?>><?php _e( 'Products in the cart', 'cart-targeting' ); ?></option>
                            </select>
                        </div>
                    </div>

                    <div class="ct-settings-panel condition-setting<?php echo ( 'products' === $settings->cart_type ) ? ' hidden' : '' ?>">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Condition', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <select name="condition" id="condition">
                                <option value="over_or_equal" <?php selected( $settings->condition, 'over_or_equal' ); ?>><?php _e( 'Over or equal', 'cart-targeting' ); ?></option>
                                <option value="equal" <?php selected( $settings->condition, 'equal' ); ?>><?php _e( 'Equal', 'cart-targeting' ); ?></option>
                                <option value="under" <?php selected( $settings->condition, 'under' ); ?>><?php _e( 'Under', 'cart-targeting' ); ?></option>
                            </select>
                        </div>
                    </div>

                    <div class="ct-settings-panel products-setting<?php echo ( 'products' === $settings->cart_type ) ? '' : ' hidden' ?>">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Products', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <?php if ( ! empty( $products ) ) : ?>
                            <select name="products[]" id="products" class="products" multiple="true">
                                <?php foreach( $products as $product ) {
                                    printf(
                                        '<option value="%d" %s>%s</option>',
                                        $product->id,
                                        in_array( absint( $product->id ), $productIds ) ? 'selected="selected"' : '',
                                        $product->text
                                    );
                                } ?>
                            </select>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="ct-settings-panel number-setting<?php echo ( 'products' === $settings->cart_type ) ? ' hidden' : '' ?>">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Number', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input type="number" name="number" id="number" value="<?php echo $settings->number; ?>" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="ct-save-changes">
            <button type="submit" id="save-ct-settings" class="button button-primary">
                <div class="ct-loading-spinner">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>
                <?php _e( 'Save Changes', 'cart-targeting' ); ?>
            </button>
        </div>

        <input type="hidden" name="nonce" id="nonce" value="<?php echo wp_create_nonce( 'ct_save_settings_action' ); ?>">
    </form>
