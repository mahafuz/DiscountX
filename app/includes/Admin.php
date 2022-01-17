<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/*
 * Handles plugins admin area.
 *
 * @since 1.0.0
 */
class Admin {

	/*
	 * Class constructor
	 *
	 * @since 1.0.0
	 */
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'adminMenu' ] );
        add_action( 'admin_init', [ $this, 'redirect' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'scripts' ] );
        add_action( 'wp_ajax_discountx_save_settings', [ $this, 'save' ] );
	}

	/**
	 * Registering admin menus.
	 *
	 * @since 1.0.0
	 */
    public function adminMenu() {
        add_menu_page(
            __( 'DiscountX', 'discountx' ),
            __( 'DiscountX', 'discountx' ),
            'manage_options',
            'discountx-settings',
            [ $this, 'display' ],
            'dashicons-cart',
            DISCOUNTX_MENU_POSITION
        );
    }

    /**
	 * Loading admin css.
	 *
	 * @since 1.0.0
	 */
	public function scripts() {

		$screen = get_current_screen();
		if ( 'toplevel_page_discountx-settings' !== $screen->id ) {
			return;
		}

        wp_enqueue_script(
            'discountx-admin-app',
            DISCOUNTX_PLUGIN_URI . '/frontend/public/build/bundle.js',
            null,
            '4.1.0',
            true
        );

        wp_enqueue_style(
            'discountx-app-global',
            DISCOUNTX_PLUGIN_URI . '/frontend/public/global.css',
            '',
            '4.1.0',
            'all'
        );

        wp_enqueue_style(
            'discountx-admin-app',
            DISCOUNTX_PLUGIN_URI . '/frontend/public/build/bundle.css',
            '',
            '4.1.0',
            'all'
        );

        // wp_enqueue_media();
        // wp_enqueue_style( 'wp-color-picker' );
        // wp_enqueue_script( 'wp-color-picker' );

        // // Stylesheets
        // wp_enqueue_style(
        //     'select2',
        //     DISCOUNTX_PLUGIN_URI . '/app/assets/admin/libs/select2/select2.min.css',
        //     '',
        //     '4.1.0',
        //     'all'
        // );

        // wp_enqueue_style(
        //     'discountx-admin',
        //     DISCOUNTX_PLUGIN_URI . '/app/assets/admin/css/discountx-admin.css',
        //     '',
        //     '1.0.0',
        //     'all'
        // );

        // // Scripts
        // wp_enqueue_script(
        //     'select2',
        //     DISCOUNTX_PLUGIN_URI . '/app/assets/admin/libs/select2/select2.min.js',
        //     [ 'jquery' ],
        //     '4.1.0',
        //     true
        // );

        // wp_enqueue_script(
        //     'discountx-admin',
        //     DISCOUNTX_PLUGIN_URI . '/app/assets/admin/js/discountx-admin.js',
        //     [ 'jquery' ],
        //     '4.1.0',
        //     true
        // );

        // wp_localize_script( 'discountx-admin', 'DISCOUNTX_ADMIN', [
        //     'ajaxUrl' => admin_url( 'admin-ajax.php' )
        // ] );
	}

    /**
     * Displays plugin settings page.
     * 
     * @since  1.0.0
     * @return void
     */
	public function display() {
        $products   = discountx()->helpers->getProductsList();
        $settings   = discountx()->helpers->getSettings();
        $productIds = discountx()->helpers->getSavedProductIds();

		include DISCOUNTX_PLUGIN_DIR . 'app/views/settings.php';
	}

    /**
     * Handles saving settings.
     * 
     * @since 1.0.0
     */
    public function save() {
        if ( empty( $_REQUEST['nonce'] ) || ! wp_verify_nonce( $_REQUEST['nonce'], 'discountx_save_settings_action' ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid request.', 'discountx' ) ] );
		}

        if ( ! is_array( $_REQUEST ) ) {
            wp_send_json_error( [ 'message' => __( 'Invalid data.', 'discountx' ) ] );
        }

        unset( $_REQUEST['nonce'] );
        unset( $_REQUEST['action'] );
        unset( $_REQUEST['woocommerce-login-nonce'] );
        unset( $_REQUEST['_wpnonce'] );
        unset( $_REQUEST['woocommerce-reset-password-nonce'] );

        $request = array_map( 'sanitize_text_field', $_REQUEST );
        $saved   = update_option( 'discountx_settings', $request );

        if ( $saved ) {
            update_user_meta( get_current_user_id(), 'discountx_popup_close_status', 'show' );

            wp_send_json_success([
                'message' => __( 'Settings successfully saved.', 'discountx' )
            ]);
        }
        die();
    }

    /**
     * Redirect to options page
     *
     * @since v1.0.0
     */
    public function redirect() {
        if ( get_option( 'discountx_activation_redirect', false ) ) {
            delete_option( 'discountx_activation_redirect' );

            if ( ! isset( $_GET[ 'activate-multi' ] ) ) {
                wp_redirect("admin.php?page=discountx-settings");
            }
        }
    }
}