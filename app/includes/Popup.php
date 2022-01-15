<?php

namespace DISCOUNTX;

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
        add_action( 'wp_ajax_discountx_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_nopriv_discountx_close_popup', [ $this, 'setPopupClose' ] );
        add_action( 'wp_ajax_discountx_apply_cupon_code', [ $this, 'applyCoupon' ] );
        add_action( 'wp_ajax_nopriv_discountx_apply_cupon_code', [ $this, 'applyCoupon' ] );
	}

    /**
     * Place the popup on the page based on the setting.
     *
     * @since  1.0.0
     * @return void
     */
	public function displayPopupOnDemand() {
		$theme = discountx()->helpers->getSettings( 'displayOn' );

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
        $cartTotal       = WC()->cart->cart_contents_total;
        $cartProductIds  = discountx()->helpers->getCartProductIds();
        $cartCount       = WC()->cart->cart_contents_count;
        $appearance      = discountx()->helpers->getSettings( 'appearance' );
        $cartType        = discountx()->helpers->getSettings( 'cart_type' );
        $condition       = discountx()->helpers->getSettings( 'condition' );
        $numbers         = discountx()->helpers->getSettings( 'number' );
        $savedProductIds = discountx()->helpers->getSavedProductIds();
        $popupStatus     = discountx()->helpers->getPopupStatus();
        $coupon          = discountx()->helpers->getSettings( 'savedCoupon' );
        $isApplied       = discountx()->helpers->isCouponApplied( $coupon );
        $showPopup       = false;

        if ( 'products' === $cartType ) {
            $showPopup = discountx()->helpers->showPopupByProductIds( $cartProductIds, $savedProductIds );
        }

        if ( 'items' === $cartType ) {
            $showPopup = discountx()->helpers->showPopupByProductCounts( $condition, $cartCount, $numbers );
        }

        if ( 'money' === $cartType ) {
            $showPopup = discountx()->helpers->showPopupByCartAmount( $condition, $cartTotal, $numbers );
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
            update_user_meta( get_current_user_id(), 'discountx_popup_close_status', 'dont-show' );
        } else {
            WC()->session->set( 'discountx_popup_close_status', 'dont-show' );
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
            'discountx-popup',
            DISCOUNTX_PLUGIN_URI . '/app/assets/frontend/css/discountx-popup.css',
            '',
            '1.0.0',
            'all'
        );

		$generatedStyles = discountx()->styles->generatePopupStyles();
        wp_add_inline_style( 'discountx-popup', $generatedStyles );


        wp_enqueue_script(
            'discountx-popup',
            DISCOUNTX_PLUGIN_URI . '/app/assets/frontend/js/discountx-popup.js',
            '',
            '1.0.0',
            false
        );

        wp_localize_script(
            'discountx-popup',
            'DISCOUNTX_POPUP',
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
        $coupon = discountx()->helpers->getSettings( 'savedCoupon' );

        if ( empty( $coupon ) ) {
            wp_send_json_error( [ 'message' => __( 'Coupon code is empty' ) ] );
        }

        // apply coupon
        $applied = WC()->cart->apply_coupon( $coupon );

        if ( $applied ) {
            discountx()->helpers->setPopupStatus();
            wp_send_json_success( [ 'message' => __( 'Successfully applied coupon.' ) ] );
        } else {
            discountx()->helpers->setPopupStatus();
        }
    }

    /**
     * Helps to unapply the coupon.
     *
     * @since  1.0.0
     * @return void
     */
    public function unApplyCoupon( $coupon ) {
        if ( discountx()->helpers->isCouponApplied( $coupon ) ) {
            WC()->cart->remove_coupon( $coupon );
        }
    }

    /**
     * Displays popup on the fronend.
     *
     * @since 1.0.0
     */
    public function display() {
		$theme = discountx()->helpers->getSettings( 'theme' );

		include discountx()->helpers->view( sprintf( 'themes/%s', $theme ) );
    }
}
