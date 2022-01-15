<?php

namespace DISCOUNTX;

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
        $this->notices      = new \DISCOUNTX\Notices;

        if ( class_exists( 'WooCommerce' ) ) {
            $this->admin        = new \DISCOUNTX\Admin;
            $this->helpers      = new \DISCOUNTX\Helpers;
            $this->styles       = new \DISCOUNTX\StyleGenerator;
            $this->popup        = new \DISCOUNTX\Popup;
            $this->cron         = new \DISCOUNTX\Cron;
        }
    }
}
