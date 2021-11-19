(function( $ ) {
    $(document).ready(function() {
        

        // appearance
        $( '#appearance' ).select2({
            minimumResultsForSearch: Infinity
        });

        // cart-type
        $( '#cart-type' ).select2({
            minimumResultsForSearch: Infinity
        });

        // condition
        $( '#condition' ).select2({
            minimumResultsForSearch: Infinity
        });

        // products
        var $products = $( '#products' );
        $products.select2({
            multiple: true
        });

        $( '#cart_type' ).on( 'change', function(e) {
            if ( 'products' === e.target.value ) {
                $( '.products-label' ).css( 'display', 'block' );
                $( '.products-container' ).css( 'display', 'block' );
                $( '.number-label' ).css( 'display', 'none' );
                $( '.number-container' ).css( 'display', 'none' );
            } else {
                $( '.products-label' ).css( 'display', 'none' );
                $( '.products-container' ).css( 'display', 'none' );
                $( '.number-label' ).css( 'display', 'block' );
                $( '.number-container' ).css( 'display', 'block' );
            }
        });


        $( '#save-ct-settings' ).on( 'click', function(e) {
            e.preventDefault();

            var formData = new FormData();
            formData.append('action', 'ct_save_settings');
            formData.append('appearance', $( '#appearance' ).val() );
            formData.append('cart_type', $( '#cart_type' ).val() );
            formData.append('condition', $( '#condition' ).val() );
            formData.append('products', $( '#products' ).val() );
            formData.append('number', $( '#number' ).val() );
            formData.append('nonce', $( '#nonce' ).val() );

            $.ajax({
                type        : 'POST',
                url         : CT_ADMIN.ajaxUrl,
                data        : formData,
                contentType : false,
			    processData : false,
                success : function( response ) {
                    console.log( response );
                },
                error: function( error ) {
                    console.error( error );
                }
            });
        });
    });
} )(jQuery);