/**
 * Created by Dell on 11/19/2016.
 */
(function () {
    var config = {
        apiKey: "AIzaSyDyqUSoUuZOTghgbbzhN-w038De3e8ZAw8",
        authDomain: "khmer-original-song.firebaseapp.com",
        databaseURL: "https://khmer-original-song.firebaseio.com",
        storageBucket: "khmer-original-song.appspot.com",
        messagingSenderId: "497158289318"
    };
    firebase.initializeApp(config);

    angular
        .module('app', ['ngMaterial', 'firebase', 'ngRoute', 'duScroll', 'ngFileUpload'])
        .config(["$routeProvider", function ($routeProvider) {
            $routeProvider.when("/", {
                controller: "HomeCtrl",
                templateUrl: "views/home/index.html"
            }).when("/home", {
                controller: "HomeCtrl",
                templateUrl: "views/home/index.html"
            }).when("/music", {
                controller: "MusicCtrl",
                templateUrl: "views/music/index.html"
            }).when("/music/add", {
                controller: "SongCtrl",
                templateUrl: "views/music/song_add.html"
            }).otherwise({
                redirectTo: '/'
            });
        }])
        .controller("AuthCtrl", ["$scope", "$firebaseAuth",
            function ($scope, $firebaseAuth) {
                var auth = $firebaseAuth();
                $scope.signIn = function () {
                    $scope.firebaseUser = null;
                    $scope.error = null;
                    auth.$signInAnonymously().then(function (firebaseUser) {
                        $scope.firebaseUser = firebaseUser;
                    }).catch(function (error) {
                        $scope.error = error;
                    });
                };
            }
        ])
        .controller('AppCtrl', function ($scope, $timeout, $mdSidenav, $log) {
            $scope.toggleLeft = buildDelayedToggler('left');
            $scope.toggleRight = buildToggler('right');
            $scope.isOpenRight = function () {
                return $mdSidenav('right').isOpen();
            };

            function debounce(func, wait, context) {
                var timer;
                return function debounced() {
                    var context = $scope,
                        args = Array.prototype.slice.call(arguments);
                    $timeout.cancel(timer);
                    timer = $timeout(function () {
                        timer = undefined;
                        func.apply(context, args);
                    }, wait || 10);
                };
            }

            function buildDelayedToggler(navID) {
                return debounce(function () {
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                            $log.debug("toggle " + navID + " is done");
                        });
                }, 200);
            }

            function buildToggler(navID) {
                return function () {
                    $mdSidenav(navID)
                        .toggle()
                        .then(function () {
                            $log.debug("toggle " + navID + " is done");
                        });
                }
            }
        })
        .controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
            $scope.close = function () {
                $mdSidenav('left').close()
                    .then(function () {
                        $log.debug("close LEFT is done");
                    });
            };
        })
        .controller('RightCtrl', function ($scope, $timeout, $mdSidenav, $log) {
            $scope.close = function () {
                $mdSidenav('right').close()
                    .then(function () {
                        $log.debug("close RIGHT is done");
                    });
            };
        })
        .controller('HomeCtrl', function ($firebaseObject) {
            const rootRef = firebase.database().ref().child("songs");
            this.object = $firebaseObject(rootRef);
        })
        .controller('SongCtrl', function ($scope, $mdDialog, $firebaseArray) {
            var rootRef = firebase.database().ref().child("songs");
            var genreRef = firebase.database().ref().child("genre");
            var artistRef = firebase.database().ref().child("artist");

            $scope.songs = [];

            genreRef.on('value', function (dataSnapShot) {
                $scope.genres = dataSnapShot.val();
            });

            artistRef.on('value', function (dataSnapShot) {
                $scope.artists = dataSnapShot.val();
            });

            $scope.addGenre = function () {
                var key = genreRef.push().key;
                genreRef.child(key).set($scope.genre);
            };

            $scope.addArtist = function () {
                var key = toHex($scope.artist.name);
                artistRef.child(key).set($scope.artist);
            };

            $scope.showAddGenre = function (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'views/dialog/genre_add.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                }).then(function (answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                }, function () {
                    $scope.status = 'You cancelled the dialog.';
                });
            };

            $scope.showAddArtist = function (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'views/dialog/artist_add.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                }).then(function (answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                }, function () {
                    $scope.status = 'You cancelled the dialog.';
                });
            };

            $scope.generateMp3InputTag = function (element) {
                $scope.$apply(function (scope) {
                    var listFile = element.files;
                    if (listFile.length > 0)
                        $scope.songs = [];
                    angular.forEach(listFile, function (f, k) {
                        $scope.songs.push({
                            title: f.name,
                            file: f,
                            url: '',
                            size: f.size,
                            type: f.type,
                            genre: {},
                            artist: {},
                            description: ''
                        });
                    });
                });
            };

            $scope.addSong = function () {
                var storageRef = firebase.storage().ref().child("MP3");
                angular.forEach($scope.songs, function (s, k) {
                    var timeStamp =new Date().getTime()+"";
                    console.log(timeStamp);
                    storageRef.child(timeStamp).put(s.file).then(function (snapshot) {
                        console.log(snapshot);
                        var key = rootRef.push().key;
                        rootRef.child(key).set({
                            title: s.title,
                            duration: 0,
                            url: snapshot.downloadURL,
                            size: s.size,
                            type: s.type,
                            genre: {
                                name: s.genre.name,
                                description: s.genre.description
                            },
                            artist: {
                                name: s.artist.name,
                                photo: s.artist.photo,
                                description: s.artist.description
                            },
                            description: s.description
                        });
                    });
                });
            }

            function DialogController($scope, $mdDialog) {
                $scope.hide = function () {
                    $mdDialog.hide();
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.answer = function (answer) {
                    $mdDialog.hide(answer);
                };
            }

            function toHex(str) {
                var hex = '';
                for (var i = 0; i < str.length; i++) {
                    hex += '' + str.charCodeAt(i).toString(16);
                }
                return hex;
            }
        })
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('docs-dark', 'default').primaryPalette('yellow').dark();
        })
        .controller("MusicCtrl", function ($scope, $firebaseArray, $mdDialog) {
            var rootRef = firebase.database().ref().child("songs");
            rootRef.on('value', function (snapshot) {
                $scope.songs = snapshot.val();
            });

            $scope.playSong = function (song) {
                // $scope.selectedSong = song.url;
                var audio = document.getElementById("player");
                audio.setAttribute("src", song.url);
                audio.play();

            }

            $scope.showAdvanced = function (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'views/dialog/song_add.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                }).then(function (answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                }, function () {
                    $scope.status = 'You cancelled the dialog.';
                });
            };

            function DialogController($scope, $mdDialog) {
                $scope.hide = function () {
                    $mdDialog.hide();
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.answer = function (answer) {
                    $mdDialog.hide(answer);
                };
            }
        });
}());
