<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

class Ajax {

    public function __construct() {
        add_action( 'wp_ajax_discountx_create_rule', [ $this, 'createRule' ] );
        add_action( 'wp_ajax_discountx_update_rule', [ $this, 'updateRule' ] );
        add_action( 'wp_ajax_discountx_clone_rule', [ $this, 'cloneRule' ] );
        add_action( 'wp_ajax_discountx_get_rule', [ $this, 'getRule' ] );
        add_action( 'wp_ajax_discountx_get_rules', [ $this, 'getRules' ] );
        add_action( 'wp_ajax_discountx_delete_rules', [ $this, 'deleteRule' ] );
    }

    public function createRule() {
        if ( ! isset( $_REQUEST[ 'nonce' ] ) || ! wp_verify_nonce( $_REQUEST['nonce'], '_discountx_create_dxrule_dx_' ) || ! current_user_can( 'manage_options') ) {
            wp_send_json_error( __( 'Unauthorised Request', 'discountx' ), 401 );
        }

        $settings = ! empty( $_REQUEST['settings'] ) ? json_decode( wp_unslash( $_REQUEST['settings'] ), true ) : '';
        if ( empty( $settings ) || ! is_array( $settings ) ) {
            wp_send_json_error( [ 'message' => __( 'Please configure the settings properly', 'discountx' ) ], 206 );
        }

        $settings = discountx()->helpers->validateSettings( $settings );
        $insertId = discountx()->rule->insert( $settings );

        if ( $insertId ) {
            wp_send_json_success( [ 'message' => __( 'Rule successfully created!', 'discountx' ), 'insertId' => $insertId ] );
        }
    }

    public function updateRule() {
        if ( ! isset( $_REQUEST[ 'nonce' ] ) || ! wp_verify_nonce( $_REQUEST['nonce'], '_discountx_update_dxrule_dx_' ) || ! current_user_can( 'manage_options') ) {
            wp_send_json_error( __( 'Unauthorised Request', 'discountx' ), 401 );
        }

        $settings = ! empty( $_REQUEST['settings'] ) ? json_decode( wp_unslash( $_REQUEST['settings'] ), true ) : '';
        if ( empty( $settings ) || ! is_array( $settings ) ) {
            wp_send_json_error( [ 'message' => __( 'Please configure the settings properly', 'discountx' ) ], 206 );
        }

        $settings = discountx()->helpers->validateSettings( $settings );
        $updated  = discountx()->rule->update( $settings );

        if ( $updated ) {
            wp_send_json_success([
                'message'   => __( 'Rule updated', 'discountx' )
            ]);
        }
    }

    public function cloneRule() {
        if ( ! isset( $_REQUEST[ 'nonce' ] ) || ! wp_verify_nonce( $_REQUEST['nonce'], '_discountx_clone_dxrule_dx_' ) || ! current_user_can( 'manage_options') ) {
            wp_send_json_error( __( 'Unauthorised Request', 'discountx' ), 401 );
        }

        if ( empty( $_REQUEST['id'] ) ) {
            wp_send_json_error( 'message', __( 'Invalid rule id to clone.', 'discountx' ) );
        }

        discountx()->rule->clone( absint( $_REQUEST[ 'id' ] ) );
    }

    public function deleteRule() {
        if ( ! isset( $_REQUEST[ 'nonce' ] ) || ! wp_verify_nonce( $_REQUEST['nonce'], '_discountx_delete_dxrules_dx_' ) || ! current_user_can( 'manage_options') ) {
            wp_send_json_error( __( 'Unauthorised Request', 'discountx' ), 401 );
        }

        if ( empty( $_REQUEST['ids'] ) ) {
            wp_send_json_error( 'message', __( 'Invalid rule id', 'discountx' ) );
        }

        discountx()->rule->delete( $_REQUEST['ids'] );
    }

    public function getRule() {
        $id   = ! empty( $_REQUEST['id'] ) ? absint( $_REQUEST['id'] ) : null;
        $rule = discountx()->rule->get( $id );

        wp_send_json_success( $rule );
    }

    public function getRules() {
        $rules = discountx()->rule->getAll();
        wp_send_json_success( $rules );
    }
}