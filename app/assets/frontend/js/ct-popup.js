(function($){
    $(document).ready(function() {
        $( '#ct-close' ).on( 'click', function() {
            $('.ct-overlay').fadeOut();

            $.ajax({
                type        : 'POST',
                url         : CT_POPUP.ajaxUrl,
                data        : {
                    action: 'ct_close_popup'
                },
                success : function( response ) {
                    console.log( response );
                },
                error: function( error ) {
                    console.error( error );
                }
            });
        });

        $( '#ct-apply-cupon' ).on( 'click', function(e) {
            e.preventDefault();

            $.ajax({
                type        : 'POST',
                url         : CT_POPUP.ajaxUrl,
                data        : {
                    action: 'ct_apply_cupon_code'
                },
                success : function( response ) {
                },
                error: function( error ) {
                }
            });

            $('.ct-overlay').fadeOut();

            setTimeout( function() {
                location.reload();
            }, 1000 );
        });
    });
})(jQuery);