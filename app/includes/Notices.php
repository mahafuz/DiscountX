<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/**
 * Handle admin notices.
 * 
 * @since  1.0.0
 */
class Notices {

    /**
     * Class constructor.
     * 
     * @since 1.0.0
     */
    public function __construct() {
        add_action( 'admin_notices', array( $this, 'notice' ) );
    }

    /**
     * Check if a plugin is installed
     *
     * @since 1.0.0
     * 
     * @param  string $basename Plugin basename.
     * @return boolean          Plugin installed status.
     */
    public function isPluginInstalled( $basename ) {
        if ( ! function_exists( 'get_plugins' ) ) {
            include_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        return isset( $plugins[ $basename ] );
    }

    /**
	 * Checks for plugin active or not
	 *
	 * @since 1.0.0
     * 
	 * @param  string $plugin Plugin name.
	 * @return bool           Plugin activate status.
	 */
    public function isPluginActive( $plugin ) {
        if ( ! function_exists( 'is_plugin_active' ) ){
            require_once( ABSPATH . '/wp-admin/includes/plugin.php' );
        }

        return is_plugin_active( $plugin );
    }

    /**
     * Displays admin notices.
     * 
     * @since  1.0.0
     * @return void
     */
    public function notice() {
        $plugin = 'woocommerce/woocommerce.php';

        if ( $this->isPluginInstalled( $plugin ) && ! $this->isPluginActive( $plugin ) ) {
            $activation_url = wp_nonce_url( 'plugins.php?action=activate&amp;plugin=' . $plugin . '&amp;plugin_status=all&amp;paged=1&amp;s', 'activate-plugin_' . $plugin );
            $message = __( '<strong>Cart Targeting Plugin</strong> requires <strong>Woocommerce</strong> plugin to be active. Please active.', 'cart-targeting' );
            $button_text = __( 'Activate Woocommerce', 'cart-targeting' );
        } elseif ( ! $this->isPluginInstalled( $plugin ) ) {
            $activation_url = wp_nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=woocommerce' ), 'install-plugin_woocommerce' );
            $message = sprintf(__('<strong>Cart Targeting</strong> requires <strong>Woocommerce</strong> plugin to be installed and activated. Please install Woocommerce to continue.', 'cart-targeting'), '<strong>', '</strong>');
            $button_text = __('Install Woocommerce', 'cart-targeting');
        }

		if( ! empty( $activation_url ) ){
			$button = '<p><a href="' . $activation_url . '" class="button-primary">' . $button_text . '</a></p>';
			printf( '<div class="error"><p>%1$s</p>%2$s</div>', __( $message ), $button );
		}
    }
}