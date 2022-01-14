(function($){
    $(document).ready(function() {
        $( '#dx-close' ).on( 'click', function() {
            $('.dx-overlay').fadeOut();

            $.ajax({
                type        : 'POST',
                url         : DX_POPUP.ajaxUrl,
                data        : {
                    action: 'dx_close_popup'
                },
                success : function( response ) {
                    console.log( response );
                },
                error: function( error ) {
                    console.error( error );
                }
            });
        });

        $( '#dx-apply-cupon' ).on( 'click', function(e) {
            e.preventDefault();

            $.ajax({
                type        : 'POST',
                url         : DX_POPUP.ajaxUrl,
                data        : {
                    action: 'dx_apply_cupon_code'
                },
                success : function( response ) {
                },
                error: function( error ) {
                }
            });

            $('.dx-overlay').fadeOut();

            setTimeout( function() {
                location.reload();
            }, 1000 );
        });
    });
})(jQuery);
