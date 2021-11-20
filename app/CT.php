<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

final class CT {

    /**
     * Holds the instance of the plugin currently in use.
     *
     * @since 1.0.0
     *
     * @var CT\CT
     */
    private static $instance = null;

    /**
     * Main Plugin Instance.
     *
     * Insures that only one instance of the addon exists in memory at any one
     * time. Also prevents needing to define globals all over the place.
     *
     * @since  1.0.0
     * @return CT
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
        $this->notices      = new \CT\Notices;
        $this->admin        = new \CT\Admin;
        $this->helpers      = new \CT\Helpers;
        $this->popup        = new \CT\Popup;
    }
}