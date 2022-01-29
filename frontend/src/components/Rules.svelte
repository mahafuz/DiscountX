<script>
    import { onMount } from "svelte"
    import { getAjaxURL, getNonce, translation } from "./../Helper"
    import Switch from './../controls/Switch.svelte'

    let result   = [],
        selected = false,
        checkdClass

    const syncData = async () => {
        const res  = await fetch( getAjaxURL() + '?action=discountx_get_rules')
        const json = await res.json()
            result = json.data

        result = result.map( rule => ( { ...rule, selected: false } ) )
    }

    onMount( syncData )

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
        checkdClass = ! checkdClass
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

    const toggleAllSelection = (e) => {
        result = result.map( rule => ({...rule, selected : e.target.checked } ) )
    }

    const detectSelection = ( e, id ) => {
        result = result.map( rule => rule.id === id ? ({ ...rule, selected: e.target.checked }) : rule )
    }

    const handleChecked = (status) => {
        console.log( !status );
    }
</script>

<div class="discountx-rules-wrap">

    <div class="discountx-rules-wrap-body">
        <div class="discountx-rules-list">
            <div class="discountx-single-rule rules-head">
                <div class="check-column">
                    <input
                        type="checkbox"
                        name="selectAllRules"
                        bind:checked={selected}
                        on:input={(e) => toggleAllSelection(e)}
                    >
                </div>
                <div class="rule-name" style="text-align: left;">{translation( 'rules-title' )}</div>
                <div class="rule-status">{translation( 'status-title' )}</div>
                <div class="rule-actions">{translation( 'actions-title' )}</div>
            </div>
            {#each Object.entries( result ) as [key, rule ] }
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
                    <Switch
                        bind:checked={rule.status}
                        on:change={e => handleRuleStatus( e, rule.id )}
                    />
                </div>
                <div class="rule-actions rule-actions-wrap">
                    <a
                        href="#/rule/{rule.id}"
                        clone="rule-edit"
                    >
                        <svg width="17" height="17" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.82429 14.3947H0V10.5704L10.3066 0.263893C10.4756 0.0949226 10.7048 0 10.9438 0C11.1828 0 11.412 0.0949226 11.581 0.263893L14.1308 2.81372C14.2998 2.98274 14.3947 3.21195 14.3947 3.45095C14.3947 3.68995 14.2998 3.91916 14.1308 4.08818L3.82429 14.3947ZM0 16.1974H16.2237V18H0V16.1974Z" fill="#B2BFD8"/>
                        </svg>
                        <span class="hidden-xs">{translation( 'table-action-edit' )}</span>
                    </a>
                    <a
                        href=":javascript;"
                        class="rule-clone"
                        on:click|preventDefault={handleClone(rule.id)}
                    >
                        <svg width="16" height="16" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4V1C4 0.734784 4.10536 0.48043 4.29289 0.292893C4.48043 0.105357 4.73478 0 5 0H17C17.2652 0 17.5196 0.105357 17.7071 0.292893C17.8946 0.48043 18 0.734784 18 1V15C18 15.2652 17.8946 15.5196 17.7071 15.7071C17.5196 15.8946 17.2652 16 17 16H14V19C14 19.552 13.55 20 12.993 20H1.007C0.875127 20.0008 0.744397 19.9755 0.622322 19.9256C0.500247 19.8757 0.389233 19.8022 0.295659 19.7093C0.202084 19.6164 0.127793 19.5059 0.0770543 19.3841C0.0263156 19.2624 0.000129374 19.1319 0 19L0.00300002 5C0.00300002 4.448 0.453 4 1.01 4H4ZM6 4H14V14H16V2H6V4Z" fill="#B2BFD8"/>
                        </svg>
                        <span class="hidden-xs">{translation( 'table-action-clone' )}</span>
                    </a>
                    <a
                        href=":javascript;"
                        class="rule-delete"
                        on:click|preventDefault={handleDelete(rule.id)}
                    >
                        <svg width="18" height="18" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.7778 17H19.7778V19H10.7778L6.77979 19.002L0.292786 12.515C0.105315 12.3274 0 12.0731 0 11.808C0 11.5428 0.105315 11.2885 0.292786 11.101L10.8978 0.49397C10.9907 0.400994 11.1009 0.327235 11.2223 0.276911C11.3437 0.226586 11.4739 0.200684 11.6053 0.200684C11.7367 0.200684 11.8668 0.226586 11.9882 0.276911C12.1096 0.327235 12.2199 0.400994 12.3128 0.49397L20.0908 8.27197C20.2783 8.4595 20.3836 8.71381 20.3836 8.97897C20.3836 9.24413 20.2783 9.49844 20.0908 9.68597L12.7778 17ZM14.4348 12.515L17.9698 8.97897L11.6058 2.61497L8.07079 6.15097L14.4348 12.515Z" fill="#E25454"/>
                        </svg>
                        <span class="hidden-xs">{translation( 'table-action-delete' )}</span>
                    </a>
                </div>
            </div>
            {/each}
        </div>
    </div>
</div>

<style lang="scss">
    .discountx-single-rule {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
        min-height: 80px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        background: #FFFFFF;
        box-shadow: 0px 1px 2px rgba(23, 57, 97, 0.1);
        border-radius: 5px;

        &.rules-head {
            .rule-name, .rule-status, .rule-actions {
                font-weight: 600;
                font-size: 20px;
                line-height: 20px;
                color: #041137;
                text-align: center;
            }
        }
        .check-column {
            width: 100px;
            text-align: center;
        }
        .rule-name {
            width: calc(50% - 150px);
            font-size: 18px;
            line-height: 20px;
            color: #041137;
            font-weight: 400;
        }
        .rule-status {
            width: 150px;
            text-align: center;
        }
        .rule-actions {
            width: calc(50% - 100px);
            text-align: right;

            &.rule-actions-wrap {
                display: flex;
                align-items: center;
                justify-content: center;

                & > a {
                    font-size: 16px;
                    line-height: 20px;
                    color: #041137;
                    text-decoration: none;
                    margin-left: 32px;

                    svg {
                        margin-right: 5px;
                    }
                }
            }
        }
    }
</style>