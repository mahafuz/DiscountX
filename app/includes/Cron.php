<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/**
 * Handles plugin cron job.
 * 
 * @since 1.0.0
 */
class Cron {

    /**
     * Class constructor.
     * 
     * @since 1.0.0
     */
    public function __construct() {
        add_action( 'wp', [ $this, 'clearCtUserMeta' ] );
        add_action( 'clear_ct_user_meta', [ $this, 'runCronJob' ] );
    }

    /**
     * Registers cron hook.
     * 
     * @since 1.0.0
     */
    public function clearCtUserMeta() {
        if ( ! wp_next_scheduled( 'clear_ct_user_meta') ) {
            wp_schedule_event( time(), 'hourly', 'clear_ct_user_meta' );
        }
    }

    /**
     * Run the cron job updates usermeta.
     * 
     * @since 1.0.0
     */
    public function runCronJob() {
        update_user_meta( get_current_user_id(), 'ct_popup_close_status', 'show' );
    }
}