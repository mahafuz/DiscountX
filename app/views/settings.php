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
    <h1 class="screen-reader-text"><?php __( 'Cart Targeting Settings Page', 'cart-targeting' ); ?></h1>

    <div class="ct-options-box postbox">
        <h2 class="ct-options-box-header"><?php _e( 'Cart Targeting Settings', 'cart-targeting' ); ?></h2>
    </div>
</div>

<div class="ct-container ct-options-wrapper wrap">

    <form action="options.php" id="ct-settings-form">

        <div class="ct-options-box postbox">
            <h2 class="ct-options-box-header"><?php _e( 'General Settings', 'cart-targeting' ); ?></h2>
            <div class="ct-options-settings-section">
                <ul class="ct-flex">

                    <!-- Default Form Style Option Start-->
                    <li><?php _e( 'Appearance', 'cart-targeting' ); ?></li>
                    <li>
                        <select name="" id="">
                            <option value="show"><?php _e( 'Show', 'cart-targeting' ); ?></option>
                            <option value="dont-show"><?php _e( "Don't show", 'cart-targeting' ); ?></option>
                        </select>
                    </li><!-- -->

                    <!-- Floating form style option style-->
                    <li><?php _e( 'Cart type', 'cart-targeting' ); ?></li>
                    <li>
                        <select name="" id="">
                            <option value="money"><?php _e( 'Cart money value', 'cart-targeting' ); ?></option>
                            <option value="items"><?php _e( 'Number of cart items', 'cart-targeting' ); ?></option>
                            <option value="products"><?php _e( 'Products in the cart', 'cart-targeting' ); ?></option>
                        </select>
                    </li>

                    <!-- Floating form style option style-->
                    <li><?php _e( 'Condition', 'cart-targeting' ); ?></li>
                    <li>
                        <select name="" id="">
                            <option value="money"><?php _e( 'Over or equal', 'cart-targeting' ); ?></option>
                            <option value="items"><?php _e( 'Equal', 'cart-targeting' ); ?></option>
                            <option value="products"><?php _e( 'Under', 'cart-targeting' ); ?></option>
                        </select>
                    </li>

                    <!-- Floating form style option style-->
                    <li><?php _e( 'Number', 'cart-targeting' ); ?></li>
                    <li>
                        <input type="number" name="number" id="number" value="" />
                    </li>
                </ul>
            </div>
        </div>

        <input type="hidden" name="_wpnonce" value="<?php echo wp_create_nonce( 'pqfw_settings_form_action' ); ?>">
    </form>
