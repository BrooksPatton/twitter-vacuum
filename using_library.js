require('dotenv').config()

const Twit = require('twit')
const monk = require('monk')('localhost:32768/frontendframeworks')

const twitter = new Twit({
    consumer_key: process.env.OAUTH_CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.OAUTH_TOKEN_SECRET,
    timeout_ms: 1000 * 60 * 5
})
const query = {
    q: '#reactjs',
    count: 100
}
const reactHashTagsDb = monk.get('reacthashtags')
const getNewTweetsEvery = 1000 * 60 * 15
const processTweetQueueEvery = 2005 // we get 450 calls per 15 minutes, so setting this to 2005 to be safe

const tweetQueue = TweetQueue()

// twitter.get('search/tweets', query)
// .then(results => results.data.statuses)
// .then(handleTweets)
// .catch(err => console.error('error getting tweets', err))

twitter.get('statuses/show/995792386356736001')
.then(results => results.data)
.then(console.log)
.catch(err => console.error('error getting tweets', err))

async function handleTweets(tweets) {
    // For every tweet
    for(let tweet of tweets) {
        // Get the previous tweets from database
        try{
            const previousTweet = await reactHashTagsDb.findOne({id_str: tweet.id_str}, {sort: {_id: -1}})
            // console.log(previousTweet)
            if(previousTweet) {
                console.log('duplicate found in database', previousTweet.has_changed)
                // Has this tweet changed
                    if(tweet.retweet_count > previousTweet.retweet_count || tweet.favorite_count > previousTweet.favorite_count) {
                        // If yes, add true to changed recently to tweet
                        tweet.has_changed = true
                    } else {
                        // If no, add false to changed recently to tweet
                        tweet.has_changed = false
                    }
            }
        } catch (err) {
            console.error('error getting the previous tweet', err)
        }
        // Put it in the database
        try {
            await reactHashTagsDb.insert(tweet)
        } catch (err) {
            console.error('error inserting tweet', err)
        }
        // If tweet is less than three days old or if tweet has changed
        const now = new Date()
        const tweetTime = new Date(tweet.created_at)
        const threeDays = 1000 * 60 * 60 * 24 * 3
        if(now - tweetTime < threeDays || tweet.hasChanged) {
            // Add tweet to get queue
            tweetQueue.add(tweet)
        }
    }
}

function TweetQueue() {
    const queue = []

    return {
        add(tweet) {queue.push(tweet)},
        length() {return queue.length}
    }
}