<?php

namespace DX;

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
        add_action( 'woocommerce_cart_updated', [ $this, 'displayPopup'] );
        add_action( 'wp_enqueue_scripts', [ $this, 'scripts' ] );
        add_action( 'wp_ajax_dx_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_nopriv_dx_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_dx_apply_cupon_code', [ $this, 'applyCoupon' ] );
        add_action( 'wp_ajax_nopriv_dx_apply_cupon_code', [ $this, 'applyCoupon' ] );
	}

	public function displayPopupOnDemand() {
		$theme = DX()->helpers->getSettings( 'displayOn' );

		if ( 'cart_page' === $theme ) {
			add_action( 'woocommerce_before_cart', [ $this, 'display' ] );
		} else {
			add_action( 'wp_footer', [ $this, 'display' ] );
		}
	}

    /**
     * Handles display popup condition.
     *
     * @since 1.0.0
     */
    public function displayPopup() {
        $cartTotal      = WC()->cart->cart_contents_total;
        $cartProductIds = DX()->helpers->getCartProductIds();
        $cartCount      = WC()->cart->cart_contents_count;
        $appearance      = DX()->helpers->getSettings( 'appearance' );
        $cartType        = DX()->helpers->getSettings( 'cart_type' );
        $condition       = DX()->helpers->getSettings( 'condition' );
        $numbers         = DX()->helpers->getSettings( 'number' );
        $savedProductIds = DX()->helpers->getSavedProductIds();
        $popupStatus     = DX()->helpers->getPopupStatus();
        $coupon          = DX()->helpers->getSettings( 'savedCoupon' );
        $isApplied       = DX()->helpers->isCouponApplied( $coupon );
        $showPopup       = false;

        if ( 'products' === $cartType ) {
            $showPopup = DX()->helpers->showPopupByProductIds( $cartProductIds, $savedProductIds );
        }

        if ( 'items' === $cartType ) {
            $showPopup = DX()->helpers->showPopupByProductCounts( $condition, $cartCount, $numbers );
        }

        if ( 'money' === $cartType ) {
            $showPopup = DX()->helpers->showPopupByCartAmount( $condition, $cartTotal, $numbers );
        }

        if ( $showPopup && ! $isApplied && 'show' === $appearance && 'show' === $popupStatus ) {
            $this->displayPopupOnDemand();
        }

        if ( ! $showPopup && ! $isApplied && 'dont-show' === $appearance && 'show' === $popupStatus ) {
            $this->displayPopupOnDemand();
        }

        if ( ! $showPopup && $isApplied ) {
            $this->unApplyCoupon( $coupon );
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
            update_user_meta( get_current_user_id(), 'dx_popup_close_status', 'dont-show' );
        } else {
            WC()->session->set( 'dx_popup_close_status', 'dont-show' );
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
            'dx-popup',
            DX_PLUGIN_URI . '/app/assets/frontend/css/dx-popup.css',
            '',
            '1.0.0',
            'all'
        );

		$generatedStyles = DX()->styles->generatePopupStyles();
        wp_add_inline_style( 'dx-popup', $generatedStyles );


        wp_enqueue_script(
            'dx-popup',
            DX_PLUGIN_URI . '/app/assets/frontend/js/dx-popup.js',
            '',
            '1.0.0',
            false
        );

        wp_localize_script(
            'dx-popup',
            'DX_POPUP',
            [ 'ajaxUrl' => admin_url( 'admin-ajax.php' ) ]
        );
    }

    /**
     * Handles applying coupon on the cart.
     *
     * @since  1.0.0
     * @return void
     */
    public function applyCoupon() {
        $coupon = DX()->helpers->getSettings( 'savedCoupon' );

        if ( empty( $coupon ) ) {
            wp_send_json_error( [ 'message' => __( 'Coupon code is empty' ) ] );
        }

        // apply coupon
        $applied = WC()->cart->apply_coupon( $coupon );

        if ( $applied ) {
            DX()->helpers->setPopupStatus();
            wp_send_json_success( [ 'message' => __( 'Successfully applied coupon.' ) ] );
        } else {
            DX()->helpers->setPopupStatus();
        }
    }

    public function unApplyCoupon( $coupon ) {
        if ( DX()->helpers->isCouponApplied( $coupon ) ) {
            WC()->cart->remove_coupon( $coupon );
        }
    }

    /**
     * Displays popup on the fronend.
     *
     * @since 1.0.0
     */
    public function display() {
		$theme = DX()->helpers->getSettings( 'theme' );

		include DX()->helpers->view( sprintf( 'themes/%s', $theme ) );
    }
}
