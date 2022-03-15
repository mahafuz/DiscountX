<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

class Rule {
    public function insert( $args = [] ) {
        global $wpdb;

        $name = ! empty( $args['name'] ) ? sanitize_text_field( $args['name'] ) : __( 'Untitled', 'discountx' );
        unset( $args['name'] );

        if ( empty( $name ) ) {
            wp_send_json_error( [ 'message' => __( 'You must provide a name.', 'discountx' ) ] );
        }

        $defaults = [
            'name'     => '',
            'settings' => ''
        ];

        $data = wp_parse_args([
            'name'     => $name,
            'settings' => wp_json_encode( $args )
        ], $defaults );

        $inserted = $wpdb->insert(
            discountx()->db->getTableName(),
            $data,
            [
                '%s',
                '%s'
            ]
        );

        if ( ! $inserted ) {
            wp_send_json_error( [ 'message' => __( 'Failed to insert data', 'discountx' ) ] );
        }

        return $wpdb->insert_id;
    }

    public function update( $args = [] ) {
        global $wpdb;

        if ( empty( $args['id'] ) ) {
            wp_send_json_error( 'message', __( 'Invalid rule id', 'discountx' ) );
        }

        $id = absint( $args['id'] );
        unset( $args['id'] );

        $name = ! empty( $args['name'] ) ? sanitize_text_field( $args['name'] ) : '' ;
        unset( $args['name'] );

        if ( empty( $name ) ) {
            wp_send_json_error( [ 'message' => __( 'You must provide a name.', 'discountx' ) ] );
        }

        $defaults = [
            'name'       => '',
            'settings'    => ''
        ];

        $data = wp_parse_args([
            'name'     => $name,
            'settings' => wp_json_encode( $args )
        ], $defaults );

        $updated = $wpdb->update(
            discountx()->db->getTableName(),
            $data,
            [ 'id' => $id ],
            [
                '%s',
                '%s',
            ],
            [ '%d' ]
        );

        if ( discountx()->db->error() ) {
            wp_send_json_error( sprintf( __( 'Database Error: %s' ), $wpdb->last_error ) );
        }

        if ( ! $updated ) {
            wp_send_json_error( [ 'message' => __( 'Nothing to update.', 'discountx' ) ] );
        }

        return $updated;
    }

    public function get( $id ) {
        global $wpdb;
        if ( empty( $id ) ) {
            wp_send_json_error( 'message', __( 'Invalid rule id', 'discountx' ) );
        }
        
        $table = discountx()->db->getTableName();
        $rule  = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ),
            ARRAY_A
        );

        return $rule;
    }

    public function getAll( $ids = [], $minimal = false ) {
        global $wpdb;

        $fields    = $minimal ? 'id, shortcode_name' : '*';
        $tableName = discountx()->db->getTableName();

        if ( empty( $ids ) ) {
            $rules = $wpdb->get_results(
                $wpdb->prepare( "SELECT {$fields} FROM {$tableName} ORDER BY id DESC", $ids )
            , ARRAY_A );
        } else {
            $how_many     = count( $ids );
            $placeholders = array_fill( 0, $how_many, '%d' );
            $format       = implode( ', ', $placeholders );
            $query        = "SELECT {$fields} FROM {$tableName} WHERE id IN($format)";
            $rules        = $wpdb->get_results( $wpdb->prepare( $query, $ids ), ARRAY_A );
        }

        if ( discountx()->db->error() ) {
            wp_send_json_error( sprintf( __( 'Database Error: %s' ), $wpdb->last_error ) );
        }

        return $rules;
    }

    public function delete( $ids ) {
        global $wpdb;
        $table = discountx()->db->getTableName();
        $count = count( $ids );

        if ( is_array( $ids ) ) {
            $ids   = implode( ',', array_map( 'absint', $_REQUEST['ids'] ) );
            $wpdb->query( "DELETE FROM {$table} WHERE ID IN($ids)" );
        } else {
            $id = absint( $_REQUEST['ids'] );
            $wpdb->query( $wpdb->prepare( "DELETE FROM {$table} WHERE ID = %d", $id ) );
        }

        if ( discountx()->db->error() ) {
            wp_send_json_error( sprintf( __( 'Database Error: %s' ), $wpdb->last_error ), 500 );
        }

        $m = _n( 'Rule has been deleted', 'Rules have been deleted', $count, 'discountx' ) ;
        wp_send_json_success([ 'message' => $m ]);
    }

    public function clone( $id ) {
        global $wpdb;

        $cloned = $this->get( $id );

        if ( empty( $cloned ) ) {
            wp_send_json_error( [ 'message' => __( 'No rule found to clone.', 'discountx' ) ], 404 );
        }

        $settings = discountx()->helpers->validateSettings( $cloned[ 'settings' ] );
        $name     = $cloned[ 'name' ] .' '. __( '- Cloned', 'discountx' );
        $table    = discountx()->db->getTableName();

        $data = [
            'name'     => $name,
            'settings' => json_encode($settings)
        ];

        $clonded = $wpdb->insert(
            $table,
            $data,
            [
                '%s',
                '%s'
            ]
        );

        if ( discountx()->db->error() ) {
            wp_send_json_error( 'message', sprintf( __( 'Database Error: %s' ), $wpdb->last_error ), 500 );
        }

        // Get the cloned rule
        $rule = $this->get( $wpdb->insert_id );

        // send success response with inserted id
        wp_send_json_success( array(
            'message' => __( 'Rule cloned successfully', 'discounx' ),
            'rule'    => $rule,
        ));
    }

    public function updateStatus( $id, $status ) {
        global $wpdb;

        $defaults = [
            'status' => 0
        ];

        $data = wp_parse_args([
            'status' => $status
        ], $defaults );

        $updated = $wpdb->update(
            discountx()->db->getTableName(),
            $data,
            [ 'id' => $id ],
            [ '%d' ],
            [ '%d' ]
        );

        if ( discountx()->db->error() ) {
            wp_send_json_error( sprintf( __( 'Database Error: %s' ), $wpdb->last_error ) );
        }

        if ( ! $updated ) {
            wp_send_json_error( [ 'message' => __( 'Nothing to update.', 'discountx' ) ] );
        }

        return $updated;
    }
}