<script>
    import { onMount } from "svelte"
    import { getAjaxURL, getNonce } from "./../Helper"

    let result = ''

    const syncData = async () => {
        const res = await fetch( getAjaxURL() + '?action=discountx_get_rules')
        const json = await res.json()
        result = json.data
    }

    onMount( syncData )

    const handleDelete = ( id ) => {
        const data = new FormData();
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
        const data = new FormData();
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
</script>

<div class="discountx-popups-wrap">
    <div class="discountx-popups-wrap-head">
        <h2>Popups</h2>
        <p>All popups</p>
    </div>

    <div class="discountx-popups-wrap-body">
        <table class="discountx-table wp-list-table widefat fixed striped table-view-list posts">
            <thead>
                <td class="manage-column column-cb check-column">
                    <input type="checkbox" name="selectShortcode" value="false"> <span class="input-ui"></span>
                </td>
                <th>Name</th>
                <th>Action</th>
            </thead>
            <tbody>

                {#each Object.entries( result ) as [key, rule ] }
                <tr>
                    <th class="check-column">
                        <input type="checkbox" name="selectPopup" value="false"> <span class="input-ui"></span>
                    </th>
                    <td>{ rule.name }</td>
                    <td class="popup-actions">
                        <a href="#/rule/{rule.id}" class=""><span class="hidden-xs">Edit</span></a>
                        <a href="#" class="popup-clone" on:click|preventDefault={handleClone(rule.id)}><span class="hidden-xs">Clone</span></a>
                        <a href="#" class="popup-delete" on:click|preventDefault={handleDelete(rule.id)}><span class="hidden-xs">Delete</span></a>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>