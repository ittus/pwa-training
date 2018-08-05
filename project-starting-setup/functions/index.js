var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
var webpush = require('web-push');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

var serviceAccount = require("./ServiceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://try-pwa-73a1a.firebaseio.com/'
})
exports.storePostData = functions.https.onRequest((request, response) => {
 cors(request, response, function() {
   admin.database().ref('posts').push({
     id: request.body.id,
     title: request.body.title,
     location: request.body.location,
     image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=477ae5a62fd5ade3f1e3a08c013af882&auto=format&fit=crop&w=1352&q=80"
   })
   .then(function() {
     webpush.setVapidDetails('mailto:test@gmail.com',
       'BF7nFPba2LicRT9d-YFdEURzQjmn6ea8DRpuFVS6U_LypcWf9pbVeHmSneo5JMYvbnyrDJKZUCDc2l9f2nCZjVc',
       functions.config().webpush.privatekey
     )
     return admin.database().ref('subscriptions').once('value');
   })
   .then(function(subscriptions) {
     subscriptions.forEach(function(sub) {
       var pushConfig = {
         endpoint: sub.val().endpoint,
         keys: {
           auth: sub.val().keys.auth,
           p256dh: sub.val().keys.p256dh
         }
       }

       webpush.sendNotification(pushConfig, JSON.stringify({
         title: 'New Post',
         content: 'New Post added!',
         openUrl: '/help'
       }))
         .catch(function(err) {
           console.error(err)
         })
     })
     response.status(201).json({message: 'Data stored', id: request.body.id })
   })
   .catch(function(err) {
     console.error(err);
     response.status(500).json({ error: err })
   })
 })
});
