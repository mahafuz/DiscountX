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
	 * Plugin constructor
	 *
	 * @since 1.0.0
	 */
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'admin_menu' ] );
        add_action( 'admin_init', [ $this, 'redirect' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'scripts' ] );
		add_action( 'in_admin_header', [ $this, 'remove_notice' ], 1000 );
	}

	/**
     * Remove all notice in setup wizard page
     */
    public function remove_notice() {
        if ( isset($_GET[ 'page' ]) && $_GET[ 'page' ] == 'gst-form' ) {
            remove_all_actions( 'admin_notices' );
            remove_all_actions( 'all_admin_notices' );
        }
    }

	/**
	 * Registering admin menus.
	 *
	 * @since 1.0.0
	 */
    public function admin_menu() {
        add_menu_page(
            __( 'Cart Targeting', 'gs-pinterest' ),
            __( 'Cart Targeting', 'gs-pinterest' ),
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

		if ( 'toplevel_page_ct-settings' === $screen->id ) {
			wp_enqueue_style( 'pqfw-admin', CT_PLUGIN_URI . '/app/assets/admin/css/style.css' );
		}
	}

	public function display() {
		include CT_PLUGIN_DIR . 'app/views/settings.php';
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