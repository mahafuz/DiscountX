<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined( 'ABSPATH' ) || exit;

class AppData {

    public function get() {
        return [
            'nonce' => [
                'create_dxrule' => wp_create_nonce( '_discountx_create_dxrule_dx_' ),
                'clone_dxrule'  => wp_create_nonce( '_discountx_clone_dxrule_dx_' ),
                'status_dxrule'  => wp_create_nonce( '_discountx_set_status_dxrule_dx_' ),
                'update_dxrule' => wp_create_nonce( '_discountx_update_dxrule_dx_' ),
                'delete_dxrule' => wp_create_nonce( '_discountx_delete_dxrules_dx_' ),
            ],
            'ajaxurl'        => admin_url( 'admin-ajax.php' ),
            'adminurl'       => admin_url(),
            'siteurl'        => home_url(),
            'options'        => [
                'coupons'        => discountx()->helpers->getCouponList(),
                'products'       => discountx()->helpers->getProductsList(),
                'appearance'     => discountx()->options->getAppearance(),
                'cartTypes'      => discountx()->options->getCartTypes(),
                'conditionTypes' => discountx()->options->getConditionTypes(),
                'displayOptions' => discountx()->options->getDisplyOptions(),
                'themes'         => discountx()->options->getThemes()
            ],
            'translations'  => discountx()->strings->getStrings()
        ];
    }

}