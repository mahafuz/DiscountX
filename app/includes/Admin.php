<?php

namespace CT;

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
        add_action( 'wp_ajax_ct_save_settings', [ $this, 'save' ] );
	}

	/**
	 * Registering admin menus.
	 *
	 * @since 1.0.0
	 */
    public function adminMenu() {
        add_menu_page(
            __( 'Cart Targeting', 'cart-targeting' ),
            __( 'Cart Targeting', 'cart-targeting' ),
            'manage_options',
            'ct-settings',
            [ $this, 'display' ],
            'dashicons-cart',
            CT_MENU_POSITION
        );
    }

    /**
	 * Loading admin css.
	 *
	 * @since 1.0.0
	 */
	public function scripts() {

		$screen = get_current_screen();
		if ( 'toplevel_page_ct-settings' !== $screen->id ) {
			return;
		}

        wp_enqueue_style( 'wp-color-picker' );
        wp_enqueue_script( 'wp-color-picker' );

        // Stylesheets
        wp_enqueue_style(
            'select2',
            CT_PLUGIN_URI . '/app/assets/admin/libs/select2/select2.min.css',
            '',
            '4.1.0',
            'all'
        );

        wp_enqueue_style(
            'ct-admin',
            CT_PLUGIN_URI . '/app/assets/admin/css/ct-admin.css',
            '',
            '1.0.0',
            'all'
        );

        // Scripts
        wp_enqueue_script(
            'select2',
            CT_PLUGIN_URI . '/app/assets/admin/libs/select2/select2.min.js',
            [ 'jquery' ],
            '4.1.0',
            true
        );

        wp_enqueue_script(
            'ct-admin',
            CT_PLUGIN_URI . '/app/assets/admin/js/ct-admin.js',
            [ 'jquery' ],
            '4.1.0',
            true
        );

        wp_localize_script( 'ct-admin', 'CT_ADMIN', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' )
        ] );
	}

    /**
     * Displays plugin settings page.
     * 
     * @since  1.0.0
     * @return void
     */
	public function display() {
        $products   = ct()->helpers->getProductsList();
        $settings   = ct()->helpers->getSettings();
        $productIds = ct()->helpers->getSavedProductIds();

		include CT_PLUGIN_DIR . 'app/views/settings.php';
	}

    /**
     * Handles saving settings.
     * 
     * @since 1.0.0
     */
    public function save() {
        if ( empty( $_REQUEST['nonce'] ) || ! wp_verify_nonce( $_REQUEST['nonce'], 'ct_save_settings_action' ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid request.', 'cart-targeting' ) ] );
		}

        if ( ! is_array( $_REQUEST ) ) {
            wp_send_json_error( [ 'message' => __( 'Invalid data.', 'cart-targeting' ) ] );
        }

        unset( $_REQUEST['nonce'] );
        unset( $_REQUEST['action'] );

        $saved = update_option( 'ct_settings', wp_json_encode( $_REQUEST ) );

        if ( $saved ) {
            update_user_meta( get_current_user_id(), 'ct_popup_close_status', 'show' );

            wp_send_json_success([
                'message' => __( 'Settings successfully saved.', 'cart-targeting' )
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
        if ( get_option( 'ct_activation_redirect', false ) ) {
            delete_option( 'ct_activation_redirect' );

            if ( ! isset( $_GET[ 'activate-multi' ] ) ) {
                wp_redirect("admin.php?page=ct-settings");
            }
        }
    }
}