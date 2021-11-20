<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/*
 * Handles plugins admin area.
 *
 * @since 1.0.0
 */
class Popup {

	/*
	 * Plugin constructor
	 *
	 * @since 1.0.0
	 */
    public function __construct() {
        add_action( 'woocommerce_before_cart', [ $this, 'displayPopup' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'scripts' ] );
        add_action( 'wp_ajax_ct_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_ct_apply_cupon_code', [ $this, 'applyCupon' ] );
	}

    /**
     * Handles display popup condition.
     * 
     * @since 1.0.0
     */
    public function displayPopup() {
        $cartTotal      = WC()->cart->cart_contents_total;
        $cartProductIds = ct()->helpers->getCartProductIds();
        $cartCount      = WC()->cart->cart_contents_count;

        $appearance      = ct()->helpers->getSettings( 'appearance' );
        $cartType        = ct()->helpers->getSettings( 'cart_type' );
        $condition       = ct()->helpers->getSettings( 'condition' );
        $numbers         = ct()->helpers->getSettings( 'number' );
        $savedProductIds = ct()->helpers->getSavedProductIds();
        $popupStatus     = get_user_meta( get_current_user_id(), 'ct_popup_close_status', true );
        $popupStatus     = 'show' === $popupStatus || '' == $popupStatus ? 'show' : 'dont-show';
        $showPopup       = false;

        if ( 'show' === $appearance && 'show' === $popupStatus ) {

            if ( 'products' === $cartType ) {
                $match = array_intersect( $cartProductIds, $savedProductIds );
                if ( count( $match ) > 0 ) {
                    $showPopup = true;
                }
            }

            if ( 'items' === $cartType ) {
                if ( 'under' === $condition ) {
                    if ( $cartCount < absint( $numbers ) ) {
                        $showPopup = true;
                    }
                }
                if ( 'equal' === $condition ) {
                    if ( $cartCount == absint( $numbers ) ) {
                        $showPopup = true;
                    }
                }
                if ( 'over_or_equal' === $condition ) {
                    if ( $cartCount >= absint( $numbers ) ) {
                        $showPopup = true;
                    }
                }
            }

            if ( 'money' === $cartType ) {
                if ( 'under' === $condition ) {
                    if ( $cartTotal < absint( $numbers ) ) {
                        $showPopup = true;
                    }
                }
                if ( 'equal' === $condition ) {
                    if ( $cartTotal == absint( $numbers ) ) {
                        $showPopup = true;
                    }
                }
                if ( 'over_or_equal' === $condition ) {
                    if ( $cartTotal >= absint( $numbers ) ) {
                        $showPopup = true;
                    }
                }
            }

            if ( $showPopup ) {
                add_action( 'wp_footer', [ $this, 'display' ] );
            }
        }
    }

    /**
     * Set popup close status.
     * 
     * @since  1.0.0
     * @return void
     */
    public function setPopupClose() {
        update_user_meta( get_current_user_id(), 'ct_popup_close_status', 'dont-show' );
    }

    /**
     * Loading popup assets on the frontend.
     * 
     * @since  1.0.0
     * @return void
     */
    public function scripts() {
        if ( is_cart() ) {
            wp_enqueue_style(
                'ct-popup',
                CT_PLUGIN_URI . '/app/assets/frontend/css/ct-popup.css',
                '',
                '1.0.0',
                'all'
            );

            wp_enqueue_script(
                'ct-popup',
                CT_PLUGIN_URI . '/app/assets/frontend/js/ct-popup.js',
                '',
                '1.0.0',
                false
            );

            wp_localize_script(
                'ct-popup',
                'CT_POPUP',
                [ 'ajaxUrl' => admin_url( 'admin-ajax.php' ) ]
            );
        }
    }

    /**
     * Handles applying coupon on the cart.
     * 
     * @since  1.0.0
     * @return void
     */
    public function applyCupon() {
        $coupon = ct()->helpers->getSettings( 'coupon_code' );

        if ( empty( $coupon ) ) {
            wp_send_json_error( [ 'message' => __( 'Coupon code is empty' ) ] );
        }

        // apply coupon
        $applied = WC()->cart->apply_coupon( $coupon );

        if ( $applied ) {
            update_user_meta( get_current_user_id(), 'ct_popup_close_status', 'dont-show' );
            wp_send_json_success( [ 'message' => __( 'Successfully applied coupon.' ) ] );
        } else {
            update_user_meta( get_current_user_id(), 'ct_popup_close_status', 'dont-show' );
        }
    }

    /**
     * Displays popup on the fronend.
     * 
     * @since 1.0.0
     */
    public function display() {
        $html = '<div class="ct-overlay">';
            $html .= '<div class="ct-popup">';
            
            $html .= '<div id="ct-close"></div>';
            $html .= '<div class="ct-popup-inner">';
                $html .= '<div class="content">';
                    $html .= '<h2>Get 15% coupon now</h2>';
                    $html .= '<p>Enjoy our amazing products for a 15% discount code</p>';
                    $html .= sprintf( '<button id="ct-apply-cupon">%s</button>', __( 'Apply Coupon', 'cart-targeting' ) );
                $html .= '</div>';
            $html .= '</div>';

            $html .= '</div>';
        $html .= '</div>';

        echo $html;
    }
}