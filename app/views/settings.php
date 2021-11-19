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

        <div class="ct-options-box postbox">
            <h2 class="ct-options-box-header"><?php _e( 'Cart Targeting Settings', 'cart-targeting' ); ?></h2>
            <div class="ct-options-settings-section">
                <ul class="ct-flex">

                    <!-- Default Form Style Option Start-->
                    <li><?php _e( 'Appearance', 'cart-targeting' ); ?></li>
                    <li>
                        <select name="appearance" id="appearance">
                            <option value="show" <?php selected( $settings->appearance, 'show' ); ?>><?php _e( 'Show', 'cart-targeting' ); ?></option>
                            <option value="dont-show" <?php selected( $settings->appearance, 'dont-show' ); ?>><?php _e( "Don't show", 'cart-targeting' ); ?></option>
                        </select>
                    </li><!-- -->

                    <!-- Floating form style option style-->
                    <li><?php _e( 'Cart type', 'cart-targeting' ); ?></li>
                    <li>
                        <select name="cart_type" id="cart_type">
                            <option value="money" <?php selected( $settings->cart_type, 'money' ); ?>><?php _e( 'Cart money value', 'cart-targeting' ); ?></option>
                            <option value="items" <?php selected( $settings->cart_type, 'items' ); ?>><?php _e( 'Number of cart items', 'cart-targeting' ); ?></option>
                            <option value="products" <?php selected( $settings->cart_type, 'products' ); ?>><?php _e( 'Products in the cart', 'cart-targeting' ); ?></option>
                        </select>
                    </li>

                    <!-- Floating form style option style-->
                    <li><?php _e( 'Condition', 'cart-targeting' ); ?></li>
                    <li>
                        <select name="condition" id="condition">
                            <option value="over_or_equal" <?php selected( $settings->condition, 'over_or_equal' ); ?>><?php _e( 'Over or equal', 'cart-targeting' ); ?></option>
                            <option value="equal" <?php selected( $settings->condition, 'equal' ); ?>><?php _e( 'Equal', 'cart-targeting' ); ?></option>
                            <option value="under" <?php selected( $settings->condition, 'under' ); ?>><?php _e( 'Under', 'cart-targeting' ); ?></option>
                        </select>
                    </li>

                    <li class="products-label<?php echo ( 'products' === $settings->cart_type ) ? '' : ' hidden' ?>"><?php _e( 'Products', 'cart-targeting' ); ?></li>
                    <li class="products-container<?php echo ( 'products' === $settings->cart_type ) ? '' : ' hidden' ?>">
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
                    </li>

                    <!-- Floating form style option style-->
                    <li class="number-label<?php echo ( 'products' === $settings->cart_type ) ? ' hidden' : '' ?>"><?php _e( 'Number', 'cart-targeting' ); ?></li>
                    <li class="number-container<?php echo ( 'products' === $settings->cart_type ) ? ' hidden' : '' ?>">
                        <input type="number" name="number" id="number" value="<?php echo $settings->number; ?>" />
                    </li>
                </ul>
            </div>
        </div>

        <div class="ct-options-box postbox">
            <div class="ct-options-settings-section">
                <ul class="ct-flex">
                    <!-- Default Form Style Option Start-->
                    <li><?php _e( 'Save Settings', 'cart-targeting' ); ?></li>
                    <li>
                        <input type="submit" id="save-ct-settings" value="Save" class="button button-primary" />
                    </li><!-- -->
                </ul>
            </div>
        </div>

        <input type="hidden" name="nonce" id="nonce" value="<?php echo wp_create_nonce( 'ct_save_settings_action' ); ?>">
    </form>
