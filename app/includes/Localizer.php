<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined( 'ABSPATH' ) || exit;

class Localizer {

    protected $localize = [];

    public function add( $data ) {
        if ( empty( $data ) || ! is_array( $data ) ) {
            return WP_Error(
                'invalid_data_to_localize',
                __( 'Invalid data to localize', 'discountx' )
            );
        }

        $this->localize = $data;
        return $this;
    }

    public function get() {
        return $this->localize;
    }

    public function run( $handle, $objectName ) {
        if ( empty( $handle ) || ! is_string( $handle ) ) {
            return WP_Error(
                'invalid_localize_data_handle_name',
                __( 'Invalid or empty localize data handle name.', 'discountx' )
            );
        }

        if ( empty( $objectName ) || ! is_string( $objectName ) ) {
            return WP_Error(
                'invalid_localize_data_object_name',
                __( 'Invalid or empty localize data object name.', 'discountx' )
            );
        }
        
        wp_localize_script( $handle, $objectName, $this->localize );
    }
}