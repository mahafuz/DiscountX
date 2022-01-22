<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;


/**
 * Represents as a database utilites.
 * 
 * @since 1.0.1
 */
class Database {

    /**
     * Returns the plugin database shortcodes table name.
     * 
     * @since  1.0.1
     * @return string Database table name.
     */
    public function getTableName() {
        global $wpdb;
        return $wpdb->prefix . 'discounx_rules';
    }

    /**
     * Returns the database charset.
     * 
     * @since  1.0.1
     * @return string Database charset.
     */
    public function getCharset() {
        global $wpdb;
        return $wpdb->get_charset_collate();
    }

    /**
     * Create database tables on plugin activation.
     * 
     * @since  1.0.1
     * @return void
     */
    public function migration() {
        $this->createRulesTable();
    }

    /**
     * Creates a database table for storing rules data.
     * 
     * @since  1.0.1
     * @return void
     */
    public function createRulesTable() {
        global $wpdb;
        $tableName = $this->getTableName();
        $charset   = $this->getCharset();

        $sql = "CREATE TABLE IF NOT EXISTS {$tableName} (
            id BIGINT(20) unsigned NOT NULL AUTO_INCREMENT,
            name TEXT NOT NULL,
            settings LONGTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )".$charset.";";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta( $sql );
    }

    /**
     * Checks for database errors.
     * 
     * @since  1.1.0
     * @return bool true/false based on the error status.
     */
    public function error() {
        global $wpdb;
        return ( '' !== $wpdb->last_error );
    }
}