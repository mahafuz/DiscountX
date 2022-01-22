const config = Object.assign({}, window.DISCOUNTX);
const translations = Object.assign({}, window.DISCOUNTX.translations);


delete window.DISCOUNTX.nonce;
delete window.DISCOUNTX.siteurl;
delete window.DISCOUNTX.ajaxurl;
delete window.DISCOUNTX.adminurl;
delete window.DISCOUNTX.options;
delete window.DISCOUNTX.translations;

export function getOptions() {
    return config.options;
}

export function getCoupons() {
    return config.options.coupons;
}

export function getAppearance() {
    return config.options.appearance;
}

export function getCartTypes() {
    return config.options.cartTypes;
}

export function getConditions() {
    return config.options.conditionTypes;
}

export function getAllProducts() {
    return config.options.products;
}

export function getDisplayOptions() {
    return config.options.displayOptions;
}

export function getThemes() {
    return config.options.themes;
}

export function convertBooleanToString(val) {
    return val === true ? 'true' : 'false'
}

export function convertStringToBoolean(val) {
    return val === 'true' ? true : false;
}

export function getSiteURL() {
    return config.siteurl;
}

export function getNonce(action) {
    return config.nonce[action];
}

export function getAjaxURL() {
    return config.ajaxurl;
}

export function getAdminURL() {
    return config.adminurl;
}

export function isEmptyObject(data) {
    for (var prop in data) {
        return !data.hasOwnProperty(prop);
    }

    return JSON.stringify(data) === JSON.stringify({});
}

export function isArray(data) {
    return typeof data && Array.isArray(data);
}

export function isObject(data) {
    return typeof data && !Array.isArray(data);
}

export function nonReactive(data) {
    return JSON.parse(JSON.stringify(data));
}

export function translation(key = null) {
    return key && key in translations ? translations[key] : '';
}