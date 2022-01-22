<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

class Options {

    public function getAppearance() {
        return [
            'show'      => __( 'Show', '' ),
            'dont-show' => __( 'Don\'t show', '' ),
        ];
    }

    public function getCartTypes() {
        return [
            'money'    => __( 'Cart money value', 'discountx' ),
            'items'    => __( 'Number of cart items', 'discountx' ),
            'products' => __( 'Products in the cart', 'discountx' ),
        ];
    }

    public function getConditionTypes() {
        return [
            'over_or_equal' => __( 'Over or equal', 'discountx' ),
            'equal'         => __( 'Equal', 'discountx' ),
            'under'         => __( 'Under', 'discountx' ),
        ];
    }

    public function getDisplyOptions() {
        return [
            'cart_page'  => __( 'Cart Page', 'discountx' ),
            'every_page' => __( 'Every Page', 'discountx' )
        ];
    }

    public function getThemes() {
        return [
            [
                'label' => __( 'Theme 1', 'discountx' ),
                'value' => 'theme-1'
            ],
            [
                'label' => __( 'Theme 2 (PRO)', 'discountx' ),
                'value' => 'theme-2'
            ],
            [
                'label' => __( 'Theme 3 (PRO)', 'discountx' ),
                'value' => 'theme-3'
            ],
            [
                'label' => __( 'Theme 4 (PRO)', 'discountx' ),
                'value' => 'theme-4'
            ]
        ];
    }

}