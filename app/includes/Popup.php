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
        // add_action( 'woocommerce_before_cart', [ $this, 'displayPopup' ] );
        add_action( 'woocommerce_cart_updated', [ $this, 'displayPopup'] );
        add_action( 'wp_enqueue_scripts', [ $this, 'scripts' ] );
        add_action( 'wp_ajax_ct_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_nopriv_ct_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_ct_apply_cupon_code', [ $this, 'applyCupon' ] );
        add_action( 'wp_ajax_nopriv_ct_apply_cupon_code', [ $this, 'applyCupon' ] );
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
        $popupStatus     = ct()->helpers->getPopupStatus();

        $coupon          = ct()->helpers->getSettings( 'coupon_code' );
        $isApplied       = ct()->helpers->isCouponApplied( $coupon );

        $showPopup       = false;

        if ( 'products' === $cartType ) {
            $showPopup = ct()->helpers->showPopupByProductIds( $cartProductIds, $savedProductIds );
        }

        if ( 'items' === $cartType ) {
            $showPopup = ct()->helpers->showPopupByProductCounts( $condition, $cartCount, $numbers );
        }

        if ( 'money' === $cartType ) {
            $showPopup = ct()->helpers->showPopupByCartAmount( $condition, $cartTotal, $numbers );
        }

        // if ( 'show' === $appearance && 'show' === $popupStatus ) {
        if ( 'show' === $appearance && ! $isApplied ) {
            if ( $showPopup ) {
                add_action( 'wp_footer', [ $this, 'display' ] );
            } else {
                $this->unApplyCoupon( $coupon );
            }
        }

        if ( 'dont-show' === $appearance && ! $isApplied ) {
            if ( ! $showPopup ) {
                add_action( 'wp_footer', [ $this, 'display' ] );
            } else {
                $this->unApplyCoupon( $coupon );
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
        if ( is_user_logged_in() ) {
            update_user_meta( get_current_user_id(), 'ct_popup_close_status', 'dont-show' );
        } else {
            WC()->session->set( 'ct_popup_close_status', 'dont-show' );
        }
    }

    /**
     * Loading popup assets on the frontend.
     * 
     * @since  1.0.0
     * @return void
     */
    public function scripts() {
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
            ct()->helpers->setPopupStatus();
            wp_send_json_success( [ 'message' => __( 'Successfully applied coupon.' ) ] );
        } else {
            ct()->helpers->setPopupStatus();
        }
    }

    public function unApplyCoupon( $coupon ) {
        if ( ct()->helpers->isCouponApplied( $coupon ) ) {
            WC()->cart->remove_coupon( $coupon );
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