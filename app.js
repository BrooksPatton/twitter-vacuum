require('dotenv').config()
const crypto = require('crypto')
const axios = require('axios')

const oauth_consumer_key = process.env.OAUTH_CONSUMER_KEY
const consumer_secret = process.env.CONSUMER_SECRET
const oauth_token_secret = process.env.OAUTH_TOKEN_SECRET
const oauth_nonce = generateNonce(64)
const oauth_signature_method = 'HMAC-SHA1'
const oauth_timestamp = Date.now()
const oauth_token = process.env.ACCESS_TOKEN
const oauth_version = 1.0
const method = 'get'
const baseUrl = 'https://stream.twitter.com/1.1/statuses/filter.json'
const include_entities = true
const signatureParameterString = createSignatureString({
    include_entities,
    oauth_consumer_key,
    oauth_nonce,
    oauth_signature_method,
    oauth_timestamp,
    oauth_token,
    oauth_version
})
const signatureBaseString = createSignatureBaseString({baseUrl, method, signatureParameterString})
const signingKey = `${encodeURIComponent(consumer_secret)}&${encodeURIComponent(oauth_token_secret)}`

const hmac = crypto.createHmac('sha256', signingKey)

hmac.update(signatureBaseString)
oauth_signature = hmac.digest('base64')

const authorizationHeader = createAuthorizationHeader({
    oauth_consumer_key,
    oauth_nonce,
    oauth_signature,
    oauth_signature_method,
    oauth_timestamp,
    oauth_token,
    oauth_version
})


axios({
    method,
    url: baseUrl,
    headers: {
        Authorization: authorizationHeader
    }
})
.then(data => {
    console.log(data)
})
.catch(err => {
    console.log("booo, we got an error", err.message)
})


function generateNonce(length) {
    const possibleCharacters = alphaNumerals()
    
    const result = []

    for(let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * possibleCharacters.length)
        result.push(possibleCharacters[randomIndex])
    }

    return result.join('')
}

function alphaNumerals() {
    const result = []

    for(let i = 0; i < 10; i++) {
        result.push(i)
    }

    for(let i = 'A'.charCodeAt(); i <= 'Z'.charCodeAt(); i++) {
        const char = String.fromCharCode(i)
        result.push(char)
        result.push(char.toLowerCase())
    }

    return result
}

function createSignatureString(urlParams) {
    const keys = Object.keys(urlParams)
    keys.sort()
    return keys.reduce((result, key) => {
        result.push(`${key}=${urlParams[key]}`)
        return result
    }, []).join('&')
}

function createSignatureBaseString({method, baseUrl, signatureParameterString}) {
    let result = []

    result.push(method.toUpperCase())
    result.push(encodeURIComponent(baseUrl))
    result.push(encodeURIComponent(signatureParameterString))

    return result.join('&')
}

function createAuthorizationHeader(oauthParameters) {
    const result = []

    for(let key in oauthParameters) {
        const value = oauthParameters[key]
        result.push(`${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
    }

    return `OAuth ${result.join(', ')}`
}