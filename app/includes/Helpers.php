<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/*
 * Handles plugins helper methods.
 *
 * @since 1.0.0
 */
class Helpers {

    /**
     * Retrives product list from db.
     *
     * @since  1.0.0
     * @return        Products list with id and title.
     */
	public function getProductsList() {
        global $wpdb;

        $result = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, post_title AS text FROM $wpdb->posts WHERE post_status = '%s' AND post_type = '%s';",
                'publish', 'product'
            )
        );

        return $result;
	}

    /**
     * Retrives coupon list from db.
     *
     * @since  1.0.0
     * @return        Coupons list with id and title.
     */
    function getCouponList() {
        global $wpdb;

        return $wpdb->get_results(
            "SELECT id, post_title AS text FROM $wpdb->posts WHERE post_type = 'shop_coupon' AND post_status = 'publish' ORDER BY post_name ASC"
        );
    }

    /**
     * Retrives cart product ids.
     *
     * @since  1.0.0
     * @return       Product ids.
     */
    public function getCartProductIds() {
        $cart = WC()->cart->get_cart();
        $ids = [];

        foreach( $cart as $product ) {
            $ids[] = $product['product_id'];
        }

        return $ids;
    }

    /**
     * Retrive settings from the options.
     *
     * @since 1.0.0
     *
     * @param  string $key     The settings key.
     * @param  mixed  $default The default value to return.
     * @return                  Retrived setting value.
     */
    public function getSettings( $key = '', $default = '' ) {
        $settings = get_option( 'discountx_settings', [] );

        if ( ! empty( $settings ) ) {
            $settings = (array) $settings;

            if ( $key ) {
                if ( ! empty( $settings[$key] ) ) {
                    return $settings[$key];
                }
            } else {
                return $settings;
            }
        } else {
            if ( $default ) {
                return $default;
            }
        }
    }

    /**
     * Retrives saved product ids.
     *
     * @since  1.0.0
     * @return array Saved product ids.
     */
    public function getSavedProductIds() {
        $ids = $this->getSettings( 'products' );
        return array_map( 'intval', explode( ',', $ids ) );
    }

    /**
     * Returns popup close status.
     *
     * @since  1.0.0
     * @return boolean Popup status.
     */
    public function getPopupStatus() {
        if ( is_user_logged_in() ) {
            $popupStatus = get_user_meta( get_current_user_id(), 'discountx_popup_close_status', true );
        } else {
            $popupStatus = WC()->session->get( 'discountx_popup_close_status' );
        }
        $popupStatus = 'show' === $popupStatus || '' == $popupStatus ? 'show' : 'dont-show';

        return $popupStatus;
    }

    /**
     * Set popup close status.
     *
     * @since  1.0.0
     * @return void
     */
    public function setPopupStatus() {
        if ( is_user_logged_in() ) {
            update_user_meta( get_current_user_id(), 'discountx_popup_close_status', 'dont-show' );
        } else {
            WC()->session->set( 'discountx_popup_close_status', 'dont-show' );
        }
    }

    /**
     * Displays popup by product ids.
     *
     * @since  1.0.0
     * @return bool
     */
    public function showPopupByProductIds( $cartProductIds, $savedProductIds ) {
        $show  = false;
        $match = array_intersect( $cartProductIds, $savedProductIds );

        if ( count( $match ) > 0 ) {
            $show = true;
        }

        return $show;
    }

    /**
     * Displays popup by products counts
     *
     * @since  1.0.0
     * @return bool
     */
    public function showPopupByProductCounts( $condition, $cartCount, $count ) {
        $show = false;

        if ( 'under' === $condition ) {
            if ( $cartCount < absint( $count ) ) {
                $show = true;
            }
        }

        if ( 'equal' === $condition ) {
            if ( $cartCount == absint( $count ) ) {
                $show = true;
            }
        }

        if ( 'over_or_equal' === $condition ) {
            if ( $cartCount >= absint( $count ) ) {
                $show = true;
            }
        }

        return $show;
    }

    /**
     * Displays popup by cart amount
     *
     * @since  1.0.0
     * @return bool
     */
    public function showPopupByCartAmount( $condition, $cartTotal, $count ) {
        $show = false;

        if ( 'under' === $condition ) {
            if ( $cartTotal < absint( $count ) ) {
                $show = true;
            }
        }

        if ( 'equal' === $condition ) {
            if ( $cartTotal == absint( $count ) ) {
                $show = true;
            }
        }

        if ( 'over_or_equal' === $condition ) {
            if ( $cartTotal >= absint( $count ) ) {
                $show = true;
            }
        }

        return $show;
    }

    /**
     * Checks if the coupon is applied on the cart.
     *
     * @since  1.0.0
     * @return bool
     */
    public function isCouponApplied( $coupon ) {
        $appliedCoupons = WC()->cart->get_applied_coupons();

        if ( empty( $appliedCoupons ) || empty( $coupon ) ) {
            return false;
        }

        return in_array( strtolower( $coupon ), $appliedCoupons, true );
    }

    /**
     * Generates the view render path.
     *
     * @since  1.0.0
     * @return string
     */
	public function view( $file = '' ) {
		if ( empty( $file ) ) {
			throw new \Error( 'View file not found!' );
		}

		return sprintf( '%s/app/views/%s.php', trailingslashit( DISCOUNTX_PLUGIN_DIR ), $file );
	}
}
