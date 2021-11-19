<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/*
 * Handles plugins helper methods.
 *
 * @since 1.0.0
 */
class Helpers {

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

    public function getCartProductIds() {
        $cart = WC()->cart->get_cart();
        $ids = [];

        foreach( $cart as $product ) {
            $ids[] = $product['product_id'];
        }

        return $ids;
    }

    public function getSettings( $key = '', $default = '' ) {
        $settings = json_decode( get_option( 'ct_settings', [] ) );

        if ( $key ) {
            if ( ! empty( $settings->{$key} ) ) {
                return $settings->{$key};
            } else {
                if ( $default ) {
                    return $default;
                }
            }
        } else {
            return $settings;
        }
    }

    public function getSavedProductIds() {
        $ids = $this->getSettings( 'products' );
        return array_map( 'intval', explode(',', $ids ));
    }

}