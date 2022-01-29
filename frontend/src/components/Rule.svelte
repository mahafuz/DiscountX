<script>
    export let rule = '';
    export let status = '';

    const handleDelete = ( id ) => {
        const data = new FormData()
        data.append( 'action', 'discountx_delete_rules' )
        data.append( 'nonce', getNonce( 'delete_dxrule' ) )
        data.append( 'ids', id )

        fetch( getAjaxURL(), {
            method: 'POST',
            body: data
        })
        .then( res => {
            if ( res.ok ) {
                syncData()
            }
        })
    }

    const handleClone = ( id ) => {
        const data = new FormData()
        data.append( 'action', 'discountx_clone_rule' )
        data.append( 'nonce', getNonce( 'clone_dxrule' ) )
        data.append( 'id', id )

        fetch( getAjaxURL(), {
            method: 'POST',
            body: data
        })
        .then( res => {
            if ( res.ok ) {
                syncData()
            }
        })
    }

    const handleRuleStatus = (e, id) => {
        const data = new FormData()
        data.append( 'action', 'discountx_set_rule_status' )
        data.append( 'nonce', getNonce( 'status_dxrule' ) )
        data.append( 'status', e.target.checked  )
        data.append( 'id', id )

        fetch( getAjaxURL(), {
            method: 'POST',
            body: data
        })
        .then( res => {
            console.log( res );
        })
    }

    const detectSelection = ( e, id ) => {
        result = result.map( rule => rule.id === id ? ({ ...rule, selected: e.target.checked }) : rule )
    }
</script>

<div class="discountx-single-rule">
    <div class="check-column">
        <input
            type="checkbox"
            name="selectRule"
            on:input={e => detectSelection(e, rule.id)}
            bind:checked={rule.selected}
        >
    </div>
    <div class="rule-name">{ rule.name }</div>
    <div class="rule-status">
        <input
            type="checkbox"
            on:change|preventDefault={e => handleRuleStatus( e, rule.id )}
            name="rule-status"
            id="rule-status"
        >
    </div>
    <div class="rule-actions">
        <a href="#/rule/{rule.id}">
            <span class="hidden-xs">{translation( 'table-action-edit' )}</span>
        </a>
        <a
            href=":javascript;"
            class="popup-clone"
            on:click|preventDefault={handleClone(rule.id)}
        >
            <span class="hidden-xs">{translation( 'table-action-clone' )}</span>
        </a>
        <a
            href=":javascript;"
            class="popup-delete"
            on:click|preventDefault={handleDelete(rule.id)}
        >
            <span class="hidden-xs">{translation( 'table-action-delete' )}</span>
        </a>
    </div>
</div>
