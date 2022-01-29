<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

class Strings {

    public function getStrings() {
        return [
            'menu-item-home'            => __( 'Home', 'discountx' ),
            'menu-item-create'          => __( 'Create', 'discountx' ),
            'rules-title'               => __( 'All Rules', 'discountx' ),
            'status-title'              => __( 'Status', 'discountx' ),
            'actions-title'             => __( 'Actions', 'discountx' ),
            'table-action-edit'         => __( 'Edit', 'discountx' ),
            'table-action-clone'        => __( 'Clone', 'discountx' ),
            'table-action-delete'       => __( 'Delete', 'discountx' ),
            'select-upload-popup-image' => __( 'Select or upload popup image', 'discountx' ),
            'use-this-image'            => __( 'Use this image', 'discountx' ),
            'create-title'              => __( 'Create', 'discountx' ),
            'create-desc'               => __( 'Create Popup', 'discountx' ),
            'popup-name'                => __( 'Name:', 'discountx' ),
            'save-button'               => __( 'Save', 'discountx' ),
            'condition-tab-label'       => __( 'Condition', 'discountx' ),
            'settings-tab-label'        => __( 'Settings', 'discountx' ),
            'style-tab-label'           => __( 'Style', 'discountx' ),
            'coupon-code-label'         => __( 'Coupon Code', 'discountx' ),
            'coupon-code-desc'          => __( 'Select coupon code to apply when user will click on the popup apply button.', 'discountx' ),
            'appearence-label'          => __( 'Appearence', 'discountx' ),
            'cart-type-label'           => __( 'Cart Type', 'discountx' ),
            'cart-type-desc'            => __( 'Select Cart Type condition.', 'discountx' ),
            'condition-label'           => __( 'Condition', 'discountx' ),
            'condition-desc'            => __( 'Select the condition.', 'discountx' ),
            'products-label'            => __( 'Products', 'discountx' ),
            'products-desc'             => __( 'Choose products.', 'discountx' ),
            'number-label'              => __( 'Number', 'discountx' ),
            'number-desc'               => __( 'The number to set the condition.', 'discountx' ),
            'display-on-label'          => __( 'Display On', 'discountx' ),
            'theme-label'               => __( 'Theme', 'discountx' ),
            'image-label'               => __( 'Image', 'discountx' ),
            'pre-title-label'           => __( 'Pre Title', 'discountx' ),
            'title-label'               => __( 'Title', 'discountx' ),
            'content-label'             => __( 'Content', 'discountx' ),
            'button-text-label'         => __( 'Button Text', 'discountx' ),
            'title-fontsize-label'      => __( 'Title Font Size', 'discountx' ),
            'title-color-label'         => __( 'Title Color', 'discountx' ),
            'content-fontsize-label'    => __( 'Content Font Size', 'discountx' ),
            'content-color-label'       => __( 'Content Color', 'discountx' ),
            'button-color-label'        => __( 'Button Color', 'discountx' ),
            'normal-label'              => __( 'Normal', 'discountx' ),
            'hover-label'               => __( 'Hover', 'discountx' ),
            'color-label'               => __( 'Color', 'discountx' ),
            'background-label'          => __( 'Background', 'discountx' ),
            'hover-color-label'         => __( 'Hover Color', 'discountx' ),
            'hover-background-label'    => __( 'Hover Background', 'discountx' ),
            'popup-background-label'    => __( 'Popup Background', 'discountx' ),
        ];
    }

}