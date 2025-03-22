const http = require("http");
const express = require('express');
const cookieParser = require('cookie-parser');
const ws = require('ws');

const port = process.argv[2];
const app = express();

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

let players = [];
let games = [];
let gamesTotalNumber = 0;
let gamesOnGoingNumber = 0;
// let cookieGamesPlayed = 0;

module.exports = app;

const WebSocketServer = ws.Server;
const wss = new WebSocketServer({port: 40510});

function initGame(p1, p2) {
    let game = {
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

    let res = {
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
    let res = {
        move: move,
        status: "move"
    };

    player.game.player1.ws.send(JSON.stringify(res));
    player.game.player2.ws.send(JSON.stringify(res));
}

let playerIndex = 0;

wss.on('connection', function (ws) {

    let player = {};
    player.name = "Player" + playerIndex;
    playerIndex++;
    player.ws = ws;
    player.status = 'finding';
    players.push(player);

    console.log(player.name + " connected");

    let res = JSON.stringify({
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

        let res;
        try {
            res = JSON.parse(message);
            // if (res.status == "started") {
            //     cookieGamesPlayed = res.userGames;
            // }
            if (res.status === "move") {
                move2(player, res.move);
            } else if (res.status === "end") {
                let currGame = player.game;

                console.log("game " + currGame.index + " finished -> " +
                    currGame.player1.name + " " +
                    currGame.player2.name);
                let p1 = player;
                if (p1.color === res.win) {
                    gamesOnGoingNumber--;
                    let resWin = {
                        status: "finished",
                        winner: true
                    };
                    p1.ws.send(JSON.stringify(resWin));
                    p1.status = "finished";
                    p1.ws.close();
                } else {
                    let resLose = {
                        status: "finished",
                        winner: false
                    };
                    p1.ws.send(JSON.stringify(resLose));
                    p1.status = "finished";
                    p1.ws.close();
                }
            }
        } catch (e) {
            console.log("An error occurred: " + e);
            return false;
        }
    });


    ws.on('close', function (connection) {
        console.log(player.name + ' disconnected');
        if (player.status === "finished") {
            let i = 0;
            players.forEach(function (p) {
                if (p.name === player.name) {
                    players.splice(i, 1);
                    return;
                }
                i++;
            });

            return;
        }
        let currPlayer = player;
        let currGame = currPlayer.game;

        if (currGame == null) {

            let i = 0;
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
        let otherPlayer = currGame.player2;

        if (player === currPlayer) {
            otherPlayer.status = "finished";
            let res = {
                status: "aborted",
                winner: true
            };
            otherPlayer.ws.send(JSON.stringify(res));
        } else {
            currPlayer.status = "finished";
            let res = {
                status: "aborted",
                winner: true
            };
            currPlayer.ws.send(JSON.stringify(res));
        }

        gamesOnGoingNumber--;
        let i = 0;
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
