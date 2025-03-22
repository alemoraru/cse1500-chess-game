var http = require("http");
var express = require('express');
var cookieParser = require('cookie-parser');
var ws = require('ws');

var port = process.argv[2];
var app = express();

app.use(cookieParser());

app.use(express.static(__dirname + "/public"));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
http.createServer(app).
    listen(port);

app.get("/", function (req, res) {
    res.render('splash', {
        cookieCount: req.cookies.count,
        playedMatches: gamesTotalNumber,
        onGoingMatches: gamesOnGoingNumber
    });
})

var players = [];
var games = [];
var gamesTotalNumber = 0;
var gamesOnGoingNumber = 0;
// var cookieGamesPlayed = 0;

module.exports = app;

var WebSocketServer = ws.Server;
var wss = new WebSocketServer({port: 40510});

function initGame(p1, p2) {
    var game = {
        index: games.length,
        player1: p1,
        player2: p2,
        moves: [],
        status: "started"
    };

    games.push(game);
    gamesOnGoingNumber++;
    gamesTotalNumber++;

    p1.status = "playing";
    p1.game = game;
    p1.color = "white";
    p2.status = "playing";
    p2.game = game;
    p2.color = "black";

    console.log("game " + game.index + " started -> " +
        game.player1.name + " " +
        game.player2.name);

    var res = {
        player: 1,
        moves: game.moves,
        status: "started"
    };
    p1.ws.send(JSON.stringify(res));
    res = {
        player: 2,
        moves: game.moves,
        status: "started"
    };
    p2.ws.send(JSON.stringify(res));
}

function move2(player, move) {
    player.game.moves.push(move);
    var res = {
        move: move,
        status: "move"
    };

    player.game.player1.ws.send(JSON.stringify(res));
    player.game.player2.ws.send(JSON.stringify(res));
}

var ind = 0;

wss.on('connection', function (ws) {

    var player = {};
    player.name = "Player" + ind;
    ind++;
    player.ws = ws;
    player.status = 'finding';
    players.push(player);

    console.log(player.name + " connected");

    var res = JSON.stringify({
        status: "finding",
        message: "Finding an opponent..."
    });
    ws.send(res);


    players.forEach(function (p) {
        if (p.status === 'finding' && p.name !== player.name) {
            initGame(p, player);
        }
    });


    ws.on('message', function (message) {

        var res;
        try {
            res = JSON.parse(message);
            // if (res.status == "started") {
            //     cookieGamesPlayed = res.userGames;
            // }
            if (res.status === "move") {
                move2(player, res.move);
            } else if (res.status === "end") {
                var currGame = player.game;

                console.log("game " + currGame.index + " finished -> " +
                    currGame.player1.name + " " +
                    currGame.player2.name);
                var p1 = player;
                if (p1.color === res.win) {
                    gamesOnGoingNumber--;
                    var resWin = {
                        status: "finished",
                        winner: true
                    };
                    p1.ws.send(JSON.stringify(resWin));
                    p1.status = "finished";
                    p1.ws.close();
                } else {
                    var resLose = {
                        status: "finished",
                        winner: false
                    };
                    p1.ws.send(JSON.stringify(resLose));
                    p1.status = "finished";
                    p1.ws.close();
                }
            }
        } catch (e) {
            return false;
        }
    });


    ws.on('close', function (connection) {
        console.log(player.name + ' disconnected');
        if (player.status === "finished") {
            var i = 0;
            players.forEach(function (p) {
                if (p.name === player.name) {
                    players.splice(i, 1);
                    return;
                }
                i++;
            });

            return;
        }
        var currPlayer = player;
        var currGame = currPlayer.game;

        if (currGame == null) {

            var i = 0;
            players.forEach(function (p) {
                if (p.name === player.name) {
                    players.splice(i, 1);
                }
                i++;
            });

            return;
        }

        console.log("game " + currGame.index + " finished -> " +
            currGame.player1.name + " " +
            currGame.player2.name);

        currPlayer = currGame.player1;
        var otherPlayer = currGame.player2;

        if (player === currPlayer) {
            otherPlayer.status = "finished";
            var res = {
                status: "aborted",
                winner: true
            };
            otherPlayer.ws.send(JSON.stringify(res));
        } else {
            currPlayer.status = "finished";
            var res = {
                status: "aborted",
                winner: true
            };
            currPlayer.ws.send(JSON.stringify(res));
        }

        gamesOnGoingNumber--;
        var i = 0;
        players.forEach(function (p) {
            if (p.name === currPlayer.name) {
                players.splice(i, 1);
                return;
            }
            i++;
        });

        i = 0;
        players.forEach(function (p) {
            if (p.name === otherPlayer.name) {
                players.splice(i, 1);
                return;
            }
            i++;
        });

        return;
    });
})
