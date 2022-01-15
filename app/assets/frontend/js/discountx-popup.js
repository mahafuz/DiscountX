(function($){
    /**
     * DiscountX popup js script.
     * 
     * @since  1.0.0
     * @author Mahafuz<m.mahfuz.me@gmail.com>
     */
    $(document).ready(function() {

        // handle popup close.
        $( '#discountx-close' ).on( 'click', function() {
            $('.discountx-overlay').fadeOut();

            $.ajax({
                type        : 'POST',
                url         : DISCOUNTX_POPUP.ajaxUrl,
                data        : {
                    action: 'discountx_close_popup'
                },
                success : function( response ) {
                    console.log( response );
                },
                error: function( error ) {
                    console.error( error );
                }
            });
        });

        // handle apply coupon
        $( '#discountx-apply-cupon' ).on( 'click', function(e) {
            e.preventDefault();

            $.ajax({
                type        : 'POST',
                url         : DISCOUNTX_POPUP.ajaxUrl,
                data        : {
                    action: 'discountx_apply_cupon_code'
                },
                success : function( response ) {
                },
                error: function( error ) {
                }
            });

            $('.discountx-overlay').fadeOut();

            setTimeout( function() {
                location.reload();
            }, 1000 );
        });
    });
})(jQuery);
