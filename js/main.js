// Globals
var _scope;

var PROXY = "https://data.fm/proxy?uri={uri}";
var AUTH_PROXY = "https://rww.io/auth-proxy?uri=";
var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
var LDP = $rdf.Namespace("http://www.w3.org/ns/ldp#");
var POSIX = $rdf.Namespace("http://www.w3.org/ns/posix/stat#");
var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
var SPACE = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
var ACL = $rdf.Namespace("http://www.w3.org/ns/auth/acl#");
var KANG = $rdf.Namespace("http://example.org/kanguluru#");
$rdf.Fetcher.crossSiteProxyTemplate=PROXY;
var TIMEOUT = 90000;

// Angular
var uluru = angular.module('Kanguluru', ['ui', 'ui.router']);
uluru.config( function AppConfig ( $stateProvider, $urlRouterProvider ) {
  $urlRouterProvider.otherwise( '/' );
  $stateProvider.state( 'home', {
    url: '/:game/:pid',
    views: {
      "main": {
        controller: 'Main'
      }
    },
    data:{ pageTitle: 'Kanguluru' }
  });
});
uluru.run( function run () {} );
// filters
uluru.filter('toString', function() {
  return function(arr) {
    return arr.toString();
  };
});
uluru.filter('atob', function() {
  return function(str) {
    return unescape(decodeURIComponent(window.atob(str)));
  };
});
uluru.filter('btoa', function() {
  return function(str) {
    return window.btoa(encodeURIComponent(escape(str)));
  };
});

//controller
uluru.controller('Main', function MainCtrl ($scope, $http, $state, $stateParams) {
    // init
    $scope.providedBoard = 'https://shamblokus.databox.me/Games/';
    $scope.appuri = window.location.origin +window.location.pathname+'#/';
    $scope.selectPlayers = [{id:1, name:"1 player"}, {id:2, name:"2 players"}, {id:3, name:"3 players"}, {id:4, name:"4 players"}];
    $scope.defaultNrPlayers = 1;
    $scope.playersJoined = 0;
    $scope.myId = 0;
    
	//controllers for div display 
    $scope.createGameState = true;
    $scope.personalizeUserState = false;
    $scope.waitForPlayersState = false;
    $scope.startGameState = false;
    $scope.resultsState = false;
    $scope.playState = false;
	$scope.gameEndState = false;
	$scope.playing = false;
	$scope.soundOn = false;
	$scope.players = [];
 

  $scope.connectToSocket = function() {
    var parser = document.createElement('a');
    parser.href = $scope.gameURI;
    parser.host; // => "example.com"
    parser.pathname; // => "/pathname/"

    var wss = 'wss://'+parser.host;
    wss += parser.pathname;
    console.log("WSS URI: "+wss);

    $scope.socket = new WebSocket(wss);
    $scope.socket.onopen = function(){
      this.send('sub ' + $scope.gameURI);
    }
    $scope.socket.onmessage = function(msg){
      if (msg.data && msg.data.slice(0, 3) === 'pub') {
        // resource updated
        $scope.gameUpdated(msg.data.slice(4, msg.data.length));
      }
    }
    $scope.socket.onclose = function() {
      console.log("Websocket connection closed. Restarting...");
      $scope.connectToSocket();
    }
  }

  $scope.sendSPARQLPatch = function (uri, query) {
    return new Promise(function(resolve) {
      $http({
        method: 'PATCH',
        url: uri,
        headers: {
          'Content-Type': 'application/sparql-update'
        },
        withCredentials: true,
        data: query
      }).success(function(data, status, headers) {
        resolve('success');
      }).error(function(data, status, headers) {
        console.log(data, status, headers);
        resolve('error');
      });
    })
  };

//  $scope.createGameSpace = function(uri) {
//    return new Promise(function(resolve) {
//      $http({
//        method: 'PUT',
//        url: uri,
//        headers: {
//          'Content-Type': 'text/turtle',
//          'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"' 
//        },
//        withCredentials: true,
//        data: ''
//      }).success(function(data, status, headers) {
//        console.log("Created new game space at "+uri);
//        $scope.userProfile.boardsURI = uri;
//        $scope.configBoardSpace();
//        resolve(headers('Location'));
//      }).error(function(data, status, headers) {
//        console.log('Could not create board space: HTTP '+status);
//        resolve('');
//      });
//    });
//  }

  // configure where to store all the games
//  $scope.configBoardSpace = function () {
//    if ($scope.userProfile.storage && $scope.userProfile.storage.length > 0) {
//      var shamURI = $scope.userProfile.storage+'shamblokus/';
//
//      $http({
//      method: 'HEAD',
//      url: shamURI,
//      withCredentials: true
//      }).success(function(data, status, headers) {
//        console.log("Found games space "+shamURI);        
//        $scope.userProfile.boardsURI = shamURI;
//        $scope.saveCredentials();
//      }).error(function(data, status, headers) {
//        if (status == 404) {
//          console.log("Game space doesn't exist, creating..");
//          $scope.createGameSpace(shamURI);
//        }
//      });
//    } else {
//      console.log("It appears you don't have storage space");
//    }
//  };

  

  // initialize by retrieving user info from sessionStorage
  // retrieve from sessionStorage
//  if (sessionStorage.getItem($scope.appuri)) {
//    var app = JSON.parse(sessionStorage.getItem($scope.appuri));
//    if (app.userProfile) {
//      if (!$scope.userProfile) {
//        $scope.userProfile = {};
//      }
//      $scope.userProfile = app.userProfile;
//      $scope.authenticated = true;
//    } else {
//      // clear sessionStorage in case there was a change to the data structure
//      sessionStorage.removeItem($scope.appuri);
//    }
//  }

  // $scope.prepareGame = function() {
    // $scope.userProfile.boardsURI = $scope.providedBoard;
  // };

  $scope.newGame = function() {
    var now = new Date().getTime();
    var g = new $rdf.graph();
    g.add($rdf.sym(''), RDF("type"), KANG("Shamblokus"));
    
    for (var i=0; i < $scope.deck.length; i++) {
        g.add($rdf.sym('#deck'+i), RDF("type"), KANG('Deck'));
        g.add($rdf.sym('#deck'+i), KANG('id'), $rdf.lit(i));      
        g.add($rdf.sym('#deck'+i), KANG('colorId'), $rdf.lit($scope.deck[i].colorId));
        g.add($rdf.sym('#deck'+i), KANG('constraintId'), $rdf.lit($scope.deck[i].constraintId));
    }
    
    var s = new $rdf.Serializer(g).toN3(g);
    var gameURI = $scope.providedBoard+'game-'+now;
    console.log(gameURI, s);  
    $http({
      method: 'PUT',
      url: gameURI,
      withCredentials: true,
      headers: {
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"' 
      },
      data: s
    }).success(function(data, status, headers) {      
      $scope.configNewGame(gameURI);
    }).error(function(data, status, headers) {
      console.log('Could not create new game file: HTTP '+status);
    });
  };


//  $scope.gameUpdated = function(gameURI) {
//    console.log("Received updated game state from: "+gameURI);
//
//    // fetch the game state (and board) from the server
//    var g = $rdf.graph();
//    var f = $rdf.fetcher(g, TIMEOUT);
//
//    f.nowOrWhenFetched(gameURI,undefined,function(ok, body, xhr) {
//      if (!ok) {
//        console.log('Could not fetch game state: HTTP '+xhr.status);
//      } else {
//        // get activePlayerId
//        var activePlayerId = g.any($rdf.sym(gameURI), SHAM('activePlayer'));
//        if (activePlayerId) {
//            $scope.activePlayerId = parseInt(activePlayerId.value, 10);
//            console.log("Received active player ID: ", $scope.activePlayerId);
//        }
//
//        // get all players
//        var players = g.statementsMatching(undefined, RDF("type"), SHAM("Player"));
//        if (!$scope.nrPlayers) {
//          $scope.nrPlayers = players.length;
//        }
//        if ($scope.playersJoined < $scope.nrPlayers) {
//          players.forEach(function(player){
//            var joined = g.any(player.subject, SHAM("playerJoined"));
//            var name = g.any(player.subject, SHAM("playerName"));
//            var pid = g.any(player.subject, SHAM("playerId"));
//            if (pid !== undefined && pid.value) {
//              pid = parseInt(pid.value, 10);
//              if (!$scope.players) {
//                $scope.players = [];
//              }
//              $scope.players[pid] = new Player([]);
//              var colors = g.any(player.subject, SHAM("playerColors"));
//              if (colors && colors.value) {
//                $scope.players[pid].colors = colors.value.split(',')
//              }
//              $scope.players[pid].name = (name && name.value)?name.value:'';
//              if (joined && (joined.value == '1' || joined.value == 'true')) {
//                $scope.playersJoined++;
//              }
//            }
//          });
//        }
//
//        // get board pieces
//        var playedPieces = [];
//        var pieces = g.statementsMatching(undefined, RDF("type"), SHAM("Piece"));
//        pieces.forEach(function(piece) {
//          var id = g.any(piece.subject, SHAM("colorId")).value;
//          var sq = g.any(piece.subject, SHAM("squares")).value.split(',');
//          if(sq == ""){
//              playedPieces.push({
//                colorId: id,
//                squaresIds: []
//              });
//          }
//          else{
//              playedPieces.push({
//                colorId: id,
//                squaresIds: sq
//              });
//          }
//        });
//
//        
//        var started = g.any($rdf.sym(gameURI), SHAM("gameStarted"));
//        if ($scope.playersJoined == $scope.nrPlayers && started === undefined) {
//            $scope.boardReady = true;
//            $scope.waitingForStart = false;
//
//
//            // also init the board for the first player
//            if ($scope.myId === 0) {
//              $scope.initGame();
//            }
//        }
//
//        if (started) {
//          $scope.gameStarted = true;
//        }
//        $scope.$apply();
//      }
//    });
//  };

  // save bags + pieces on the server for all players and init board
//  $scope.waitForPlayers = function() {
//    $scope.personalizeUser = false;
//    $scope.waitingForStart = true;
//
//    // create board for other players
//    if ($scope.myId !== 0) {
//      $scope.initGame();
//    }
//    // start listening for updates
//    $scope.connectToSocket();
//
//    $scope.$apply();
//    console.log("Waiting for other players...");    
//  }

//  $scope.joinGame = function () {
//    var query = '';
//    var setJoined = new $rdf.st(
//      $rdf.sym('#player'+$scope.myId), 
//      SHAM("playerJoined"),
//      $rdf.lit('true', undefined, $rdf.sym('http://www.w3.org/2001/XMLSchema#boolean'))
//    );
//    var setName = new $rdf.st(
//        $rdf.sym('#player'+$scope.myId),
//        SHAM('playerName'),
//        $rdf.lit($scope.myName)
//      );
//
//    query += 'INSERT DATA { ' + setJoined.toNT() + " } ;\n";
//    query += 'INSERT DATA { ' + setName.toNT() + '}';
//    $scope.sendSPARQLPatch($scope.gameURI, query).then(function(status) {
//      if (status == 'success') {
//        $scope.waitForPlayers();
//      }
//    });
//  };



//    $scope.endTurn = function(lastPlayedPiece) {
//
//    $scope.myPlayer.bag[$scope.activeBagId].setAvailability(false);
//    $scope.myPlayer.bag[$scope.activeBagId].setStandBy(true);
//    $scope.activeBagId = ($scope.activeBagId+1)% $scope.myPlayer.bag.length;
//    $scope.myPlayer.bag[$scope.activeBagId].setAvailability(true);
//      
//    var lastPlayerId = $scope.activePlayerId;
//    $scope.activePlayerId = ($scope.activePlayerId + 1) % $scope.players.length;
//
//    var query = '';
//    // next player
//    query += 'DELETE DATA { <'+$scope.gameURI+'> <'+SHAM("activePlayer").value+'> "'+ lastPlayerId +'" . } ;\n';
//    query += 'INSERT DATA { <'+$scope.gameURI+'> <'+SHAM("activePlayer").value+'> "'+ $scope.activePlayerId +'" . }';
//      // piece
//    if (lastPlayedPiece) {
//      query += " ;\n";
//      var pieceID = '#'+Date.now();
//      query += 'INSERT DATA { <'+pieceID+'> <'+RDF('type').value+'> <'+SHAM("Piece").value+'> . } ;\n';
//      query += 'INSERT DATA { <'+pieceID+'> <'+SHAM('colorId').value+'> "'+lastPlayedPiece.colorId+'" . } ;\n';
//      query += 'INSERT DATA { <'+pieceID+'> <'+SHAM('squares').value+'> "'+lastPlayedPiece.squaresIds.toString()+'" . }';
//    }
//    //@@TODO end timer
//
//    $scope.sendSPARQLPatch($scope.gameURI, query);
//  }

  // check if we came through link (this is ugly)
//  $scope.state = $state;
//  $scope.$watch('state.params', function(newVal, oldVal) {
//    if (newVal.game && newVal.pid && newVal.colors && !$scope.myPlayer) {
//      $scope.personalizeUser = true;
//      $scope.gameURI = unescape(decodeURIComponent(window.atob($state.params.game)));
//      $scope.myId = $state.params.pid;
//      $scope.myName = '';
//      $scope.myPlayer = new Player($state.params.colors.split(','))
//      $scope.activeBagId = 0;
//      $scope.myPlayer.bag[$scope.activeBagId].setAvailability(true);
//
//    }
//  });

//  $scope.$watch('userProfile.name', function(newVal, oldVal) {
//    if (newVal && newVal !== undefined && newVal.length > 0) {
//      $scope.noPlayerName = false;
//    } else {
//      $scope.noPlayerName = true;
//    }
//  });


    

    

    ////// CANVAS CODE BEGINS HERE ///////    
$scope.CanvasState = function(canvas) {

    this.canvas = canvas;
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = Math.max(window.innerHeight, 450);
    this.ctx = canvas.getContext('2d');


    // This complicates things a little but fixes mouse co-ordinate problems
    // when there's a border or padding. See getMouse for more detail
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
        this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
        this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
        this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
    }

    // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
    // They will mess up mouse coordinates and this fixes that
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    // **** Keep track of state! ****

    this.valid = false;     // when set to false, the canvas will redraw everything
    this.dragging = false;  // Keep track of when we are dragging

    // the current selected object. 
    this.selection = null;
    this.dragoffx = 0; // See mousedown and mousemove events for explanation
    this.dragoffy = 0;
      
    //clear canvas
    this.clear = function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    //draw everything
    this.draw = function() {
		if(this.selection){
			if(!$scope.playing){
				canvas.deselectPiece();
			}
		}
        // if our state is invalid, redraw and validate!
        if (!this.valid){ 
			//when playing
			if($scope.playState){
				var ctx = this.ctx;
				this.clear();
				
				//write round no
				ctx.font = "bold 15px Verdana";
				ctx.fillStyle = "rgba(255, 255, 255, 1)";
				ctx.fillText("Round " + $scope.round + " / " + $scope.noOfRounds, 10, 20);
				
				//draw board
				ctx.drawImage($scope.boardImg, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height);
				
				//write time
				if($scope.time >=0){
					fontHeight = Math.floor($scope.boardImg.height/4);
					ctx.font = "bold "+fontHeight+"px Verdana";
					if($scope.time > 3)
						ctx.fillStyle = "rgba(200, 250, 150, 0.5)";
					else
						ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
					ctx.fillText($scope.time+"\"", $scope.boardImgX + $scope.boardImg.width/2 - fontHeight, $scope.boardImgY + $scope.boardImg.height/2 + fontHeight/2, 2*fontHeight);
				}
				
				//draw pieces
				for(var cp = 0; cp < $scope.pieces.length; cp++){
					$scope.pieces[cp].draw(this.ctx, $scope.colors);
				}
				
						   
				this.valid = true;
			}
			//when seeing results
			else{
				var ctx = this.ctx;
				this.clear();

                //write round no
                ctx.font = "bold 15px Verdana";
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText("Round " + $scope.round + " / " + $scope.noOfRounds, 10, 20);

                for(cpl = 0; cpl < $scope.players.length; cpl++){

                    //draw board
					X = window.innerWidth/$scope.players.length * (cpl+0.5) - $scope.resultBoardImg.width/2;
					Y = 30;
					ctx.drawImage($scope.resultBoardImg, X, Y, $scope.resultBoardImg.width, $scope.resultBoardImg.height);

                    //write score
					fontHeight = Math.floor($scope.resultBoardImg.height/10);
					ctx.font = "bold "+fontHeight+"px Verdana";
					ctx.fillStyle = "rgba(200, 250, 150, 1)";
					var text = $scope.players[cpl].name + ": " + $scope.players[cpl].newPoints + " ("+$scope.players[cpl].score+")";
					ctx.fillText(text, X + $scope.resultBoardImg.width/4, Y + $scope.resultBoardImg.height/2 + fontHeight/2);
					
					//draw pieces
					for(var cp = 0; cp < $scope.players[cpl].pieces.length; cp++){
                        var cPiece = $scope.players[cpl].pieces[cp];
						if(cPiece.placeId != -1){cPiece.x = X + $scope.resultBoardImg.width * $scope.places[cPiece.placeId].xp;
                            cPiece.y = Y + $scope.resultBoardImg.height *$scope.places[cPiece.placeId].yp;
                            cPiece.radius = $scope.radius * $scope.resultBoardImg.width/ $scope.boardImg.width;
                            cPiece.draw(this.ctx, $scope.colors);
                            if(!cPiece.ok){
								ctx.strokeStyle = "rgba(150, 0, 0, 0.8)";
								ctx.lineWidth=5;
								ctx.beginPath();
								ctx.lineTo(cPiece.x - cPiece.radius, cPiece.y - cPiece.radius);
								ctx.lineTo(cPiece.x + cPiece.radius, cPiece.y + cPiece.radius);
								ctx.stroke();
								ctx.beginPath();
								ctx.lineTo(cPiece.x + cPiece.radius, cPiece.y - cPiece.radius);
								ctx.lineTo(cPiece.x - cPiece.radius, cPiece.y + cPiece.radius);
								ctx.stroke();
							}
                            cPiece.radius = $scope.radius
						}
					}
				}
						   
				this.valid = true;
			}
		}
    }
      
    //returns mouse coordinates
    this.getMouse = function(e) {
        var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

        // Compute the total offset
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        // Add padding and border style widths to offset
        // Also add the <html> offsets in case there's a position:fixed bar
        offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
        offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        // We return a simple javascript object (a hash) with x and y defined
        return {x: mx, y: my};
    }
    
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

    var myState = this;
    
    canvas.selectPiece = function(e){
		if(!$scope.playing)	//out of time ==> no more movements
			return;
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var cPiece;
        for(var cp = $scope.pieces.length-1; cp >= 0; cp--){
            cPiece = $scope.pieces[cp];
            if(cPiece.contains(mx, my)){
                myState.dragoffx = mx - cPiece.x;
                myState.dragoffy = my - cPiece.y;
                myState.dragging = true;
                $scope.pieces.splice(cp, 1);
                $scope.pieces.push(cPiece);		//bring to front
                myState.selection = cPiece;
				if(myState.selection.placeId != -1)		//test if it was in place
					$scope.places[myState.selection.placeId].free = true;	//the place is free now
				myState.selection.placeId = -1;
                myState.valid = false;      //Piece brought to front ==> redraw
                return;
            }
        }

		// havent returned means we have failed to select anything.
		// If there was an object selected, we deselect it
        if (myState.selection) {
            myState.selection = null;
        }
    }
    
    canvas.deselectPiece = function(){
       if(myState.selection){
           if(myState.selection.fitInPlace($scope.places)){     //fit
               myState.valid = false;
           }
       }
        myState.dragging = false;
    }

    // double click
    canvas.addEventListener('dblclick', function(e) {
        console.log(myState.dragging);
        if(myState.dragging)
            canvas.deselectPiece();
        else
            canvas.selectPiece(e);
    }, true);     //end of 'mousedown'

    
    // mousedown
    canvas.addEventListener('mousedown', function(e) {
        canvas.selectPiece(e);
    }, true);     //end of 'mousedown'
    

    // mouse move    
    canvas.addEventListener('mousemove', function(e) {
        if (myState.dragging){
            var mouse = myState.getMouse(e);
            myState.selection.x = mouse.x - myState.dragoffx;
            myState.selection.y = mouse.y - myState.dragoffy;   
            myState.valid = false;      // Something's dragging so we must redraw
        }
    }, true);     //end of 'mousemove'

    // mouse up
    canvas.addEventListener('mouseup', function(e) {
        canvas.deselectPiece();
    }, true); //end of 'mouseup'

    // **** Options! ****
    this.interval = 30;
    setInterval(function() { myState.draw(); }, myState.interval);
}


//  $scope.initGame = function () {
//    $scope.canvas = new $scope.CanvasState(document.getElementById('game'), $scope.myPlayer);
//    $scope.canvas.valid = false;
//    $scope.myPlayer.rearrangePieces();
//  }

//  $scope.startGame = function() {
//    $scope.gameStarted = true;
//    $scope.boardReady = false;
//    $scope.activePlayerId = 0;
//    $scope.activeBagId = 0;
//    $scope.myPlayer.bag[$scope.activeBagId].setAvailability(true);
//    $scope.myPlayer.bag[$scope.activeBagId].setStandBy(false);
//    $scope.canvas.valid = false;
//
//    // set gameStarted
//    var query = 'INSERT DATA { <'+$scope.gameURI+'> <'+SHAM("gameStarted").value+'> "'+ Date.now() +'" . }';
//    $scope.sendSPARQLPatch($scope.gameURI, query);
//  }
  
    $scope.countDown = function(){
		$scope.time--; 
		$scope.canvasState.valid = false;

		if($scope.time == 0){
			clearInterval($scope.countDownPtr);
			$scope.playing = false;
			setTimeout(function(){$scope.endRound()}, 1000);		//wait 5 seconds before going to results mode
			var tmp = 2;
			$scope.playSound('button-16'); 
			var ptr = setInterval(function(){
				$scope.playSound('button-16'); 
				tmp --; 
				if(tmp == 0)
					clearInterval(ptr);
			}, 250);
		}
		else if($scope.time < 4){
			$scope.playSound('button-16');
			//setTimeout(function(){$scope.playSound('button-23')}, 250);
		}
	}
  
	$scope.startCountdouwn = function(){
		$scope.time = 5   ;
		$scope.countDown();
		$scope.countDownPtr = setInterval(function(){ $scope.countDown()}, 1000);
	}
    
    $scope.endGame = function(){
        var winnerId = 0;
        var winnerScore = $scope.players[0].score;
        for(var i = 1; i < $scope.players.length; i++){
            if($scope.players[i].score > winnerScore){
                winnerScore = $scope.players[i].score;
                winnerId = i;
            }
        }
        //message for the winner
        var message = "<h3>";
        message += $scope.players[winnerId].name + " wins!";
        message += "<img src=\"images/winnerCup.png\" style=\"height:70px; vertical-align: middle;\">";
        message += "</h3>";
        
        //message for losers
        for(i = 0; i < $scope.players.length; i++){
            if(i != winnerId){
                if($scope.players[i].score == winnerScore )
                    message += "<h3>" + $scope.players[i].name + " wins too!<img src=\"images/winnerCup.png\" style=\"height:70px; vertical-align: middle;\"></h3>";
                else if($scope.players[i].score > winnerScore - 5)
                    message += "<h5>" + $scope.players[i].name + ", that was really close!</h5>";
                else if($scope.players[i].score > winnerScore - 15)
                    message += "<h5>" + $scope.players[i].name + ", not bad!</h5>";
                else
                    message += "<h5>" + $scope.players[i].name + ", you need more practice!</h5>";
            }
        }
        message += "<br>";   
        document.getElementById("endGameDiv").innerHTML = message;
        $scope.gameEnded = true;
    }
     
    $scope.playSound = function(filename){   
		if($scope.soundOn)
			document.getElementById("sound").innerHTML='<audio autoplay="autoplay"><source src="audio/' + filename + '.mp3" type="audio/mpeg" /><embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3" /></audio>';
    }
    
    $scope.turnOnSound = function(){
        $scope.soundOn = true;
    }
    
	$scope.turnOffSound = function(){
        $scope.soundOn = false;
    }
	
	$scope.arrangePieces = function(){
		for(var cp = 0; cp < $scope.pieces.length; cp++){
			$scope.pieces[cp].x = $scope.canvasState.width/2 + ($scope.pieces[cp].colorId - ($scope.colors.length-1)/2)*3*$scope.radius;
			$scope.pieces[cp].y = 1.5 * $scope.radius;
			$scope.pieces[cp].placeId = -1;
			$scope.pieces[cp].ok = false;
		}
	}
    
    $scope.emptyPlaces = function(){
        for(var cp = 0; cp < $scope.places.length; cp++){
            $scope.places[cp].free = true;
        }
    }
	
	$scope.shuffle = function(array){
		for(var i = 0; i < 10 * array.length; i++){
			pos = Math.floor(Math.random()*array.length);
			var tmp = array[pos];		//take pos-th card
			array.splice(pos, 1);
			pos = Math.floor(Math.random()*array.length);
			array.splice(pos, 0, tmp);		//inserd the card in the new place
		}
	}
	
	$scope.createConstraintsTable = function(){
		var text = "";
		text += "<table align=\"center\">";
		text += "<tr>";
        
        
        //text += "<td colspan=\""+$scope.colors.length+"\"><img src=\"images/animaleFeatherEdges.png\" width = \"" +window.innerWidth+"\"></td>";
		for(var i = 0; i < $scope.colors.length; i++){
			var rgb = "rgb(" + $scope.colors[i].R +", " + $scope.colors[i].G + ", " + $scope.colors[i].B + ")";
			text += "<td>";
			text += "<img src=\"images/"+$scope.colors[i].name+".png\" width = \"" +window.innerWidth / 10+"\">";
			//text += $scope.colors[i].name + "(IMG!!! to come)";		//TODO: images instead of text
			text += "</td>";
		}
		text += "<tr>";
		for(var i = 0; i < $scope.colors.length; i++){
			text += "<td id = \""+i+"\"><img id=\"cardImg\" src=\"images/board.png\" width = \"" +$scope.cardImg.width+"\">";
			text += "</td>";
		}
		text += "</tr>";
		text += "</table>";
		document.getElementById("constraintsDiv").innerHTML = text;
	}
	
	$scope.distributeCards = function(){
		$scope.canvasState.valid = false;
		if($scope.deck.length >= $scope.pieces.length){
			for(var i = 0; i < $scope.pieces.length; i++){
				var cCard = $scope.deck[0];
				for(var j = 0; j < $scope.pieces.length; j++){
					if( $scope.pieces[j].colorId == i){
						$scope.pieces[j].card = cCard;
						break;
					}
				}
				$scope.deck.splice(0, 1);
				var text = "";
                 if(cCard.constraintId < 5)
                    text += "<img id=\"cardImg\" src=\"images/CardsResize/"+cCard.constraintId+".png\" width = \"" +$scope.cardImg.width+"\">";
                else
                    text += "<img id=\"cardImg\" src=\"images/CardsResize/"+cCard.constraintId+"_"+cCard.colorId+".png\" width = \"" +$scope.cardImg.width+"\">";
				text += "<br><font = 10px>"+$scope.constraints[cCard.constraintId].name + " " + $scope.colors[cCard.colorId].name+"</font>";		////TODO: images instead of text
				document.getElementById(i).innerHTML = text;
			}
		}
		else
			$scope.gameEndState = true;
	}
	
    $scope.startGame = function(){
        $scope.startGameState = false;
        $scope.startRound();
    }
    
	$scope.startRound = function(){
		if($scope.round < $scope.noOfRounds){
				$scope.round++;
			$scope.resultsState = false;
			$scope.playState = true;
			$scope.distributeCards();
			$scope.startCountdouwn();
			$scope.playing = true;
			$scope.arrangePieces();
            $scope.emptyPlaces();
            //$scope.$apply();
		}
	}
	
	$scope.endRound = function(){
		$scope.resultsState = true;
		$scope.playState = false;
		$scope.checkPiecesPlacement();
		$scope.computeScore();
		$scope.canvasState.valid = false;
		$scope.players[$scope.myId].pieces = $scope.pieces;
		if($scope.round == $scope.noOfRounds){
            $scope.gameEndState = true;
			$scope.endGame();
            $scope.$apply();
		}
		$scope.$apply();
		//draw result boards
	}
	
	$scope.checkConstraint = function(piece){
		//happy
		if(piece.card.constraintId == 0){
			return true;
		}
		
		//Small corner
		else if(piece.card.constraintId == 1){
			return $scope.places[piece.placeId].smallCorner;
		}
		
		//Big corner
		else if(piece.card.constraintId == 2){
			return $scope.places[piece.placeId].bigCorner;
		}
		
		//Short sides
		else if(piece.card.constraintId == 3){
			return $scope.places[piece.placeId].shortSide;
		}
	
		//Long sides
		else if(piece.card.constraintId == 4){
			return $scope.places[piece.placeId].longSide;
		}
		
		//Next to
		else if(piece.card.constraintId == 5){
			if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
				var test = false;
				for(i = 0; i < $scope.places[piece.placeId].nextTo.length; i++){
					for(j = 0; j < $scope.pieces.length; j++){
						if($scope.pieces[j].colorId == piece.card.colorId && $scope.pieces[j].placeId == $scope.places[piece.placeId].nextTo[i]){
							test = true;
							i = $scope.places[piece.placeId].nextTo.length;
							j = $scope.pieces.length;
						}
					}
				}
				return test;
			}
		}
		
		//In front of
		else if(piece.card.constraintId == 6){
			if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
				var test = false;
				for(i = 0; i < $scope.places[piece.placeId].inFrontOf.length; i++){
					for(j = 0; j < $scope.pieces.length; j++){
						if($scope.pieces[j].colorId == piece.card.colorId && $scope.pieces[j].placeId == $scope.places[piece.placeId].inFrontOf[i]){
							test = true;
							i = $scope.places[piece.placeId].inFrontOf.length;
							j = $scope.pieces.length;
						}
					}
				}
				return test;
			}
		}
		
		//On corner with
		else if(piece.card.constraintId == 7){
			if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
				var test = false;
				for(i = 0; i < $scope.places[piece.placeId].cornerWith.length; i++){
					for(j = 0; j < $scope.pieces.length; j++){
						if($scope.pieces[j].colorId == piece.card.colorId && $scope.pieces[j].placeId == $scope.places[piece.placeId].cornerWith[i]){
							test = true;
							i = $scope.places[piece.placeId].cornerWith.length;
							j = $scope.pieces.length;
						}
					}
				}
				return test;
			}
		}
		
		//Not in front of
		else if(piece.card.constraintId == 8){
			if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
				var test = true;
				for(i = 0; i < $scope.places[piece.placeId].inFrontOf.length; i++){
					for(j = 0; j < $scope.pieces.length; j++){
						if($scope.pieces[j].colorId == piece.card.colorId && $scope.pieces[j].placeId == $scope.places[piece.placeId].inFrontOf[i]){
							test = false;
							i = $scope.places[piece.placeId].inFrontOf.length;
							j = $scope.pieces.length;
						}
					}
				}
				return test;
			}
		}
		
		//Far from
		else if(piece.card.constraintId == 9){
			if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
                //search for the placeId of the other piece
				var placeId;
                for(var cp = 0; cp < $scope.pieces.length; cp++){
                    if($scope.pieces[cp].colorId == piece.card.colorId)
                        placeId = $scope.pieces[cp].placeId;
				}
                if(placeId == -1)       //the other piece wasn't place ==> can not be far from
                    return false;
                else{
                    dist = Math.abs(piece.placeId - placeId);
                    if(dist < 3 || dist > 5)
                        return false;
                    else
                        return true;
                }
            }
		}
		
		//Same as
		else if(piece.card.constraintId == 10){
			if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
                //search for the card of the other piece
				var card;
                for(var cp = 0; cp < $scope.pieces.length; cp++){
                    if($scope.pieces[cp].colorId == piece.card.colorId)
                        card = $scope.pieces[cp].card;
				}
                piece.card = card;      //change card with the card of the other piece
                return $scope.checkConstraint(piece);
                
            }
		}
		
		//Different from
		else if(piece.card.constraintId == 11){
            if(piece.colorId == piece.card.colorId)		//constraint doesn't apply to itself
				return true;
			else{
                //search for the card of the other piece
				var card;
                for(var cp = 0; cp < $scope.pieces.length; cp++){
                    if($scope.pieces[cp].colorId == piece.card.colorId)
                        card = $scope.pieces[cp].card;
				}
				var originalCard = piece.card;
                piece.card = card;      //change card with the card of the other piece
                var test = !$scope.checkConstraint(piece);
				piece.card = originalCard;
				return test;
            }
		}
	}
	
	$scope.checkPiecesPlacement = function(){
		for(var cp = 0; cp < $scope.pieces.length; cp++){
			if($scope.pieces[cp].placeId != -1){	
				$scope.pieces[cp].ok = $scope.checkConstraint($scope.pieces[cp]);
			}
		}
	}
	
	$scope.computeScore = function(){
		var score = 0;
		for(var cp = 0; cp < $scope.pieces.length; cp++){
			if($scope.pieces[cp].ok)
				score++;
			console.log($scope.colors[$scope.pieces[cp].colorId].name, "wants", $scope.constraints[$scope.pieces[cp].card.constraintId].name, $scope.colors[$scope.pieces[cp].card.colorId].name, $scope.pieces[cp].ok);
		}
        $scope.players[$scope.myId].newPoints = score;
		$scope.players[$scope.myId].score += score;
	}


	//////// FOR ALL USERS: PREPARE GAME //////
	{
    $scope.boardImg = document.getElementById("boardImg");
	$scope.cardImg = document.getElementById("cardImg");
	$scope.canvas = document.getElementById('game');
	tmp = $scope.cardImg.height / $scope.cardImg.width;
	$scope.cardImg.width = window.innerWidth * 4/41;
	$scope.cardImg.height = $scope.cardImg.width * tmp;

	var canvasVisibleHeight = window.innerHeight - $scope.canvas.offsetTop;
	tmp = $scope.boardImg.width / $scope.boardImg.height;
	$scope.boardImg.height = Math.min(canvasVisibleHeight * 0.6, window.innerHeight/3);
	$scope.boardImg.width = $scope.boardImg.height * tmp;
	$scope.boardImgX = window.innerWidth/2-$scope.boardImg.width/2;
	$scope.boardImgY = canvasVisibleHeight/2 + 1.25*tmp*$scope.boardImg.height/17.5 - $scope.boardImg.height/2;
	
	// tmp = $scope.boardImg.height / $scope.boardImg.width;
	// $scope.boardImg.width = window.innerWidth / 4;
    // $scope.boardImg.height = $scope.boardImg.width * tmp;
	// $scope.boardImgX = window.innerWidth/2-$scope.boardImg.width/2;
	// $scope.boardImgY = ((window.innerHeight - $scope.canvas.offsetTop)*0.5-$scope.boardImg.height/2;

	$scope.colors = [];
	$scope.colors.push(new Color(0, "white", 200, 200, 200));
	$scope.colors.push(new Color(1, "pink", 255, 80, 220));
	$scope.colors.push(new Color(2, "yellow", 255, 255, 0));
	$scope.colors.push(new Color(3, "orange", 255, 130, 0));
	$scope.colors.push(new Color(4, "green", 0, 150, 0));
	$scope.colors.push(new Color(5, "blue", 60, 80, 230));
	$scope.colors.push(new Color(6, "black", 50, 50, 50));
	$scope.colors.push(new Color(7, "red", 255, 0, 0));
	
	$scope.places = [];																												
	$scope.places.push(new Place(0, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.313, 0.1389, [1], [5], [7], true, true));
	$scope.places.push(new Place(1, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.493, 0.1410, [0, 2], [4, 5], [], true, true));
	$scope.places.push(new Place(2, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.678, 0.1400, [1], [4], [3], true, true));
	$scope.places.push(new Place(3, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.898, 0.5085, [], [6, 7], [2, 4], false, false));
	$scope.places.push(new Place(4, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.604, 0.8695, [5], [1, 2], [3], true, false));
	$scope.places.push(new Place(5, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.423, 0.8700, [4], [0, 1], [6], true, false));
	$scope.places.push(new Place(6, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.107, 0.6200, [7], [3], [5], false, true));
	$scope.places.push(new Place(7, $scope.boardImgX, $scope.boardImgY, $scope.boardImg.width, $scope.boardImg.height, 0.112, 0.3955, [6], [3], [0], false, true));
	
	$scope.constraints = [];
	$scope.constraints.push(new Constraint($scope.constraints.length, 0, "Happy"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 1, "Small corner"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 1, "Big corner"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 1, "Short sides"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 1, "Long sides"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 2, "Next to"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 2, "In front of"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 2, "On corner with"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 3, "Not in front of"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 3, "Far from"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 3, "Same as"));
	$scope.constraints.push(new Constraint($scope.constraints.length, 4, "Different from"));
	}
	$scope.createConstraintsTable();
	
	var text = "";
	for(var cc = 0; cc < $scope.constraints.length; cc++){
//		text += "<input type=\"checkbox\" class=\"with-gap\" id=\"C"+cc+"\"/><label for=\"C"+cc+"\">"+$scope.constraints[cc].name+"</label><br>";
		text += "<input type=\"checkbox\" class=\"with-gap\" id=\"C"+cc+"\" checked = \"checked\"/><label for=\"C"+cc+"\">"+$scope.constraints[cc].name+"</label><br>";
	}
	document.getElementById("selectConstraints").innerHTML = text;
	
	$scope.canvasState = new $scope.CanvasState(document.getElementById('game'));
    $scope.radius = $scope.boardImg.width/17.5;  
   
    //create pieces
    $scope.pieces = [];
    for(var cc = 0; cc < $scope.colors.length; cc++){
        $scope.pieces.push(new Piece(cc, cc, $scope.radius, $scope.canvasState.width/2 + (cc - ($scope.colors.length-1)/2)*3*$scope.radius, 2*$scope.radius));
    }
	


	///// FOR FIRST USER: PREPARE GAME /////
	
	$scope.createGame = function(){
		//search for selected constraints
		for(var cc = 0; cc < $scope.constraints.length; cc++){
			if(document.getElementById("C"+cc).checked)
				$scope.constraints[cc].inUse = true;
		}
		$scope.createGameState = false;
	
		//deck of cards
		$scope.deck =[];
		for(var cc = 0; cc < $scope.constraints.length; cc++){
			if($scope.constraints[cc].inUse){
				if($scope.constraints[cc].level == 1){
					for(var cClr = 0; cClr < $scope.colors.length/2; cClr++){		//only half
						$scope.deck.push(new Card(cc, cClr));
					}
				}
				else{
					for(var cClr = 0; cClr < $scope.colors.length; cClr++){
						$scope.deck.push(new Card(cc, cClr));
					}
				}
			}
		}
		$scope.shuffle($scope.deck);
        $scope.prepareGame(document.getElementById("selectplayers").value);
        
        $scope.myId = 0;
		$scope.players[$scope.myId].name = document.getElementById("name").value;
        
        $scope.newGame();
    };
        
    //TODO: Andrei: send data to server (send: document.getElementById("selectplayers").value, $scope.deck[i].colorId, $scope.deck[i].constraintId)
    $scope.configNewGame = function(gameURI) {
        // Send to server
        var query = '';
        for (var i=0; i<document.getElementById("selectplayers").value; i++) {
          query += 'INSERT DATA { <#player'+i+'> <'+RDF("type").value+'> <'+KANG("Player").value+'> . } ;\n';
          query += 'INSERT DATA { <#player'+i+'> <'+KANG('playerId').value+'> "'+i+'" . } ;\n';
          if (i == 0) {
            query += 'INSERT DATA { <#player'+i+'> <'+KANG('playerName').value+'> "'+document.getElementById("name").value+'" . } ;\n';
            query += 'INSERT DATA { <#player'+i+'> <'+KANG('playerJoined').value+'> "true"^^<http://www.w3.org/2001/XMLSchema#boolean> . }';
          }
          if (i <= document.getElementById("selectplayers").value - 1) {
            query += " ;\n";
          }
        }
        console.log(query);

        $scope.sendSPARQLPatch(gameURI, query).then(function(status) {
          if (status == 'success') {
            $scope.gameURI = gameURI;
            $scope.waitForPlayersState = true;
            $scope.$apply();
            $scope.connectToSocket();
          }
        });
        
        
	}
	
	$scope.prepareGame = function(nrPlayers){
		$scope.noOfRounds = $scope.deck.length/$scope.colors.length;
		$scope.round = 0;

        for(var cp = 0; cp < nrPlayers; cp++)
            $scope.players.push(new Player(cp));
	    //TODO: de pus si numele
	}
  
	$scope.resultBoardImg = document.getElementById("resultBoardImg");
  	tmp = $scope.resultBoardImg.height / $scope.resultBoardImg.width;
	$scope.resultBoardImg.width = Math.min(0.8 * window.innerWidth / $scope.players.length, $scope.boardImg.width);
    $scope.resultBoardImg.height = $scope.resultBoardImg.width * tmp;
    
  
    //for debugging
    _scope = $scope;
});



