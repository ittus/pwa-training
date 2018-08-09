var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var fetchedLocation = {lat: 0, lng: 0};

locationBtn.addEventListener('click', function (event) {
  if (!('geolocation' in navigator)) {
    return
  }
  var sawAlert = false;

  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';
  navigator.geolocation.getCurrentPosition(function(position) {
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    fetchedLocation = { lat: position.coords.latitude, lng: 0 }
    locationInput.value = 'In Tokyo';
    document.querySelector('#manual-location').classList.add('is-focused');
  }, function (err) {
    console.error(err);
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    if (!sawAlert) {
      sawAlert = true;
      alert('Could not fetch location, please enter manually!');
    }
    fetchedLocation = { lat: 0, lng: 0 };
  }, { timeout: 7000 })
});

function initizalizeLocation() {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
}

function initizalizeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {}
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      })
    }
  }

  navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(function(stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function(err) {
      imagePickerArea.style.display = 'block';
    });
}

captureButton.addEventListener('click', function(event) {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop()
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});


imagePicker.addEventListener('change', function(event) {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function() {
    createPostArea.style.transform = 'translateY(0)';
    initizalizeMedia();
    initizalizeLocation();
  }, 1)

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = 'none'
  videoPlayer.style.display = 'none'
  canvasElement.style.display = 'none'
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
      console.log('Stop video');
      track.stop();
    })
  }
  setTimeout(function() {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1)
  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function onSaveButtonClick(event) {
  console.log('click');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      })
  }
}

function clearCard() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}
function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("' + data.image + '")';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClick);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCard();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url = 'https://try-pwa-73a1a.firebaseio.com/posts.json'
var networkDataReceived = false

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true
    console.log('From web', data);
    var dataArray = [];
    for (let key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        console.log('From cache', data);
        updateUI(data);
      }
    })
}

function sendData() {
  var id = new Date().toISOString()
  var postData = new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location',locationInput.value);
  postData.append('file', picture, id + '.png');
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  fetch('https://us-central1-try-pwa-73a1a.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
  })
  .then(res => {
    console.log('Sent data', res)
  })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data');
    return;
  }
  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(sw => {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          rawLocation: fetchedLocation
        }
        writeData('sync-posts', post)
          .then(() => {
            return sw.sync.register('sync-new-posts');
          })
          .then(() => {
            var snackBarContainer = document.querySelector('#confirmation-toast');
            var data = { message: 'Your post was saved for syncing!' }
            snackBarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(err => {
            console.log(err);
          })
      })
  } else {
    sendData();
  }
});
