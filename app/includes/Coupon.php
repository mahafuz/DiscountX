<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/**
 * Creates coupon code programatically.
 * 
 * @since 1.0.0
 */
class Coupon {

    /**
     * Coupon code to create.
     * 
     * @since  1.0.0
     * @access public
     */
    public $code = 'CT15DISCOUNTCODE';

    /**
     * Discount amount.
     * 
     * @since  1.0.0
     * @access public
     */
    public $amount = '15';

    /**
     * Discount type.
     * 
     * @since  1.0.0
     * @access public
     */
    public $type = 'percent'; // Type: fixed_cart, percent, fixed_product, percent_product

    public function create() {
        $coupon = [
            'post_title'   => $this->code,
            'post_content' => '',
            'post_status'  => 'publish',
            'post_author'  => 1,
            'post_type'    => 'shop_coupon'
        ];

        $couponId = wp_insert_post( $coupon );

        // Add meta
        update_post_meta( $couponId, 'discount_type', $this->type );
        update_post_meta( $couponId, 'coupon_amount', $this->amount );
        update_post_meta( $couponId, 'individual_use', 'no' );
        update_post_meta( $couponId, 'product_ids', '' );
        update_post_meta( $couponId, 'exclude_product_ids', '' );
        update_post_meta( $couponId, 'usage_limit', '' );
        update_post_meta( $couponId, 'expiry_date', '' );
        update_post_meta( $couponId, 'apply_before_tax', 'yes' );
        update_post_meta( $couponId, 'free_shipping', 'no' );

        update_option( 'ct_coupon_created', true );
    }
}