<?php
/**
 * Plugin Name:     Cart Targeting
 * Plugin URI:      PLUGIN SITE HERE
 * Description:     PLUGIN DESCRIPTION HERE
 * Author:          YOUR NAME HERE
 * Author URI:      YOUR SITE HERE
 * Text Domain:     cart-targeting
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         Cart
 */

// if direct access than exit the file.
defined('ABSPATH') || exit;

/**
 * Defining constants
 */
define( 'CT_VERSION', '1.9.1' );
define( 'CT_MENU_POSITION', 32 );
define( 'CT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CT_PLUGIN_URI', plugins_url( '', __FILE__ ) );
define ( 'CT_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

require_once CT_PLUGIN_DIR . 'app/includes/Admin.php';
require_once CT_PLUGIN_DIR . 'app/includes/Helpers.php';
require_once CT_PLUGIN_DIR . 'app/includes/Popup.php';
require_once CT_PLUGIN_DIR . 'app/CT.php';

/**
 * Activation redirects
 *
 * @since 1.0.0
 */
register_activation_hook( __FILE__, function () {
    add_option( 'ct_activation_redirect', true );
    add_option( 'ct_settings', '{"appearance":"show","cart_type":"items","condition":"equal","products":"","number":"5","woocommerce-login-nonce":null,"_wpnonce":null,"woocommerce-reset-password-nonce":null}' );
});

if ( ! function_exists( 'ct' ) ) {
	/**
	 * This function is responsible for running the main plugin.
	 * 
	 * @since  1.0.0
	 * @return object CT The plugin instance.
	 */
	function ct() {
		return CT\CT::getInstance();
	}

    add_action( 'plugins_loaded', function() {
        ct();
    });
}
