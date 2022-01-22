<?php

namespace DISCOUNTX {

    // if direct access than exit the file.
    defined('ABSPATH') || exit;

    final class DISCOUNTX {

        /**
         * Holds the instance of the plugin currently in use.
         *
         * @since 1.0.0
         *
         * @var DISCOUNTX\DISCOUNTX
         */
        private static $instance = null;

        /**
         * Main Plugin Instance.
         *
         * Insures that only one instance of the addon exists in memory at any one
         * time. Also prevents needing to define globals all over the place.
         *
         * @since  1.0.0
         * @return DISCOUNTX
         */
        public static function getInstance() {
            if ( null === self::$instance || ! self::$instance instanceof self ) {
                self::$instance = new self();

                self::$instance->init();
            }

            return self::$instance;
        }

        private function init() {
            $this->includes();
            $this->preLoad();
            $this->loader();
        }

        private function includes() {
            $dependencies = [
                'app/includes/Database.php',
                'app/includes/Admin.php',
                'app/includes/Notices.php',
                'app/includes/Helpers.php',
                'app/includes/StyleGenerator.php',
                'app/includes/Popup.php',
                'app/includes/Cron.php',
                'app/includes/Strings.php',
                'app/includes/Options.php',
                'app/includes/Localizer.php',
                'app/includes/AppData.php',
                'app/includes/Rule.php',
                'app/includes/Ajax.php'
            ];

            foreach( $dependencies as $path ) {
                if ( ! file_exists( DISCOUNTX_PLUGIN_DIR . $path ) ) {
                    // Something is not right.
                    status_header( 500 );
                    wp_die( esc_html__( 'Plugin is missing required dependencies. Please contact support for more information.', 'discountx' ) );
                }

                require DISCOUNTX_PLUGIN_DIR . $path;
            }
        }

        private function loader() {
            $this->notices      = new \DISCOUNTX\Notices;
            $this->helpers      = new \DISCOUNTX\Helpers;
            $this->admin        = new \DISCOUNTX\Admin;
            $this->styles       = new \DISCOUNTX\StyleGenerator;
            $this->popup        = new \DISCOUNTX\Popup;
            $this->cron         = new \DISCOUNTX\Cron;
            $this->strings      = new \DISCOUNTX\Strings;
            $this->options      = new \DISCOUNTX\Options;
            $this->localizer    = new \DISCOUNTX\Localizer;
            $this->appData      = new \DISCOUNTX\AppData;
            $this->rule         = new \DISCOUNTX\Rule;
            $this->ajax         = new \DISCOUNTX\Ajax;
        }

        private function preLoad() {
            $this->db = new \DISCOUNTX\Database;
        }
    }
}

namespace {
    // if direct access than exit the file.
    defined('ABSPATH') || exit;

    /**
	 * This function is responsible for running the main plugin.
	 *
	 * @since  1.0.0
	 * @return object DISCOUNTX The plugin instance.
	 */
	function discountx() {
		return DISCOUNTX\DISCOUNTX::getInstance();
	}

}