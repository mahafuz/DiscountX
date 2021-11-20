(function( $ ) {
    $(document).ready(function() {
        

        // appearance
        $( '#appearance' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // cart-type
        $( '#cart_type' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // condition
        $( '#condition' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // products
        var $products = $( '#products' );
        $products.select2({
            multiple: true,
            width: 'resolve'
        });

        $( '#cart_type' ).on( 'change', function(e) {
            if ( 'products' === e.target.value ) {
                $( '.products-setting' ).removeClass( 'hidden' );
                $( '.number-setting' ).addClass( 'hidden' );
                $( '.condition-setting' ).addClass( 'hidden' );
            } else {
                $( '.products-setting' ).addClass( 'hidden' );
                $( '.number-setting' ).removeClass( 'hidden' );
                $( '.condition-setting' ).removeClass( 'hidden' );
            }
        });


        $( '#save-ct-settings' ).on( 'click', function(e) {
            e.preventDefault();

            var $button = $(this);

            $button.addClass('loading');

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
                    setTimeout( function() {
                        $button.removeClass('loading');
                    }, 500 );
                },
                error: function( error ) {
                    console.error( error );
                }
            });
        });
    });
} )(jQuery);