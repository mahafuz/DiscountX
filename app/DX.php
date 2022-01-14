<?php

namespace DX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

final class DX {

    /**
     * Holds the instance of the plugin currently in use.
     *
     * @since 1.0.0
     *
     * @var DX\DX
     */
    private static $instance = null;

    /**
     * Main Plugin Instance.
     *
     * Insures that only one instance of the addon exists in memory at any one
     * time. Also prevents needing to define globals all over the place.
     *
     * @since  1.0.0
     * @return DX
     */
	public static function getInstance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

    /**
     * Class constructor.
     *
     * @since 1.0.0
     */
    public function __construct() {
        $this->notices      = new \DX\Notices;

        if ( class_exists( 'WooCommerce' ) ) {
            $this->admin        = new \DX\Admin;
            $this->helpers      = new \DX\Helpers;
            $this->styles       = new \DX\StyleGenerator;
            $this->popup        = new \DX\Popup;
            $this->cron         = new \DX\Cron;
        }
    }
}
