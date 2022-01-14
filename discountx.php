<?php
/**
 * Plugin Name:     DiscountX
 * Plugin URI:      http://wpdiscountx.com/
 * Description:     Best Woocommerce coupon apply popup plugin.
 * Author:          Mahafuz<m.mahfuz.me@gmail.com>
 * Author URI:      http://wpdiscountx.com/about
 * Text Domain:     discountx
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
define( 'DX_VERSION', '1.9.1' );
define( 'DX_MENU_POSITION', 32 );
define( 'DX_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DX_PLUGIN_URI', plugins_url( '', __FILE__ ) );
define( 'DX_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Including necessary files.
require_once DX_PLUGIN_DIR . 'app/includes/Admin.php';
require_once DX_PLUGIN_DIR . 'app/includes/Notices.php';
require_once DX_PLUGIN_DIR . 'app/includes/Helpers.php';
require_once DX_PLUGIN_DIR . 'app/includes/StyleGenerator.php';
require_once DX_PLUGIN_DIR . 'app/includes/Popup.php';
require_once DX_PLUGIN_DIR . 'app/includes/Cron.php';
require_once DX_PLUGIN_DIR . 'app/DX.php';

/**
 * Activation redirects and default settings.
 *
 * @since 1.0.0
 */
register_activation_hook( __FILE__, function () {
    add_option( 'dx_activation_redirect', true );
});

if ( ! function_exists( 'DX' ) ) {
	/**
	 * This function is responsible for running the main plugin.
	 *
	 * @since  1.0.0
	 * @return object DX The plugin instance.
	 */
	function DX() {
		return DX\DX::getInstance();
	}

    add_action( 'plugins_loaded', function() {
        DX();
    });
}
