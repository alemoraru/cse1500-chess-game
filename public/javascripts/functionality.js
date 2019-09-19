//global declarations

var selectedPiece = null;
var kingWhite = 'e1';
var kingBlack = 'e8';
var keep = null;

var checkCount = 0;
var historyCountMove = 0;

var audioMovePiece = new Audio("sounds/movePiece.wav");
var audioCheckAlert = new Audio("sounds/checkAlert.wav");
var audioVictory = new Audio("sounds/victory.wav");
var audioQuit = new Audio("sounds/rageQuit.wav");
var audioCapturePiece = new Audio("sounds/capture.wav");

var turnDiv = document.getElementById("turn");

var turn = "white";
var changeValue = "0";
//event listeners and in-functions

document.addEventListener('mouseover', function(e) {
    e = e || window.event;
    
    if (e.srcElement.className.indexOf("gamecell") != -1)
        if (window.getComputedStyle(document.getElementById(e.srcElement.id)).backgroundColor == "rgba(0, 156, 0, 0.8)" ||
        window.getComputedStyle(document.getElementById(e.srcElement.id)).backgroundColor == "rgba(156, 0, 0, 0.8)")
            document.getElementById(e.srcElement.id).style.border = "3px solid red";
        else if (!selectedPiece &&
                window.getComputedStyle(document.getElementById(e.srcElement.id)).backgroundImage != "none" &&
                currentColor(e.srcElement.id) === turn)
            document.getElementById(e.srcElement.id).style.border = "3px solid red";
}, false);

document.addEventListener('mouseout', function(e) {
    e = e || window.event;

    if (e.srcElement.className.indexOf("gamecell") != -1)
        if (document.getElementById(e.srcElement.id).style.border == "3px solid red")
            document.getElementById(e.srcElement.id).style.border = "1px solid black";

}, false);


document.addEventListener('click', function(e) {
    e = e || window.event;

    if(e.srcElement.className.indexOf("gamecell") != -1 && turn){
        
        if(!selectedPiece){
            if (turnT) {
                if (currentColor(e.srcElement.id) === turn) {
                    selectedPiece = e.srcElement;
                    if(turn === currentColor(selectedPiece.id))
                        paintGreen(selectedPiece.id);
                }
            }
        }
        else{
            removeGreen(selectedPiece.id);
            
            if (isLegal(selectedPiece.id, e.srcElement.id, 1)) {
                if(turn === currentColor(selectedPiece.id))
                {
                    var res = {};

                    var from = selectedPiece.id;
                    var to = e.srcElement.id;

                    // if(currentColor(selectedPiece.id) === 'black')
                    //     rotateBoard();
                    // else
                    //     undoRotate();

                    var change = changePawn(from, to);
                    changeValue = "0";

                    if(change !== "noPromote"){
                        var changePawnMenu = document.getElementById("change-pawn-wrapper");
                        changePawnMenu.style.display = "block";

                        if(change === "blackPromote"){
                            queenchange.style.backgroundImage = "url(../images/qb.png)";
                            rootchange.style.backgroundImage = "url(../images/rb.png)";
                            knightchange.style.backgroundImage = "url(../images/knb.png)";
                            bishopchange.style.backgroundImage = "url(../images/bb.png)";
                        }

                        queenchange.onclick = function() {
                            changeValue = "1";
                            console.log("am ales regina!");
                            document.getElementById(to).style.backgroundImage = queenchange.style.backgroundImage;
                            wrapperPawn.style.display = "none";
                        }
                        
                        rootchange.onclick = function() {
                            changeValue = "2";
                            console.log("am ales tura!");
                            document.getElementById(to).style.backgroundImage = rootchange.style.backgroundImage;
                            wrapperPawn.style.display = "none";
                        }
                        
                        knightchange.onclick = function() {
                            changeValue = "3";
                            console.log("am ales calul!");
                            document.getElementById(to).style.backgroundImage = knightchange.style.backgroundImage;
                            wrapperPawn.style.display = "none";
                        }
                        
                        bishopchange.onclick = function() {
                            changeValue = "4";
                            console.log("am ales nebunul!");
                            document.getElementById(to).style.backgroundImage = bishopchange.style.backgroundImage;
                            wrapperPawn.style.display = "none";
                        }
                    }

                    res.move = {from: from, to: to};
                    res.status = "move";
                    moved = true;
                    ws.send(JSON.stringify(res));
                    selectedPiece = null;
                    
                    

                    move(res.move.from, res.move.to, function() {
                        generateAttackedBlocks();
                    });                       
                }
                else
                {
                    selectedPiece = null;
                }
            } else {
                selectedPiece = null;
            }
        }
    }

    if (!selectedPiece && turn) {
        var kingB = document.getElementById(kingBlack);
        var kingW = document.getElementById(kingWhite);

        if (isKingAttacked() == "black") {
            if (isCheckMate("black"))
            {
                writeInHistory("Checkmate! Game over!");
                res = {status:"end", win:"white", lose:"black"};
                
                ws.send (JSON.stringify(res));
                playSound(audioVictory);
                changeTurnCheckMateWhite();
            }
            else
            { 
                kingB.style.backgroundColor = "red";
                keep = kingB;
                if(checkCount == 0){
                    writeInHistory("Check!");
                    playSound(audioCheckAlert);
                    changeTurnCheck();
                }
                checkCount++; 
            }
        }
        else if (isKingAttacked() == "white") {
            if (isCheckMate("white"))
            {   
                writeInHistory("Checkmate! Game over!");
                res = {status:"end", win:"black", lose:"white"};
                ws.send (JSON.stringify(res));
                playSound(audioVictory);
                changeTurnCheckMateBlack();
                
            }
            else
            {
                kingW.style.backgroundColor = "red";
                keep = kingW;
                if(checkCount == 0){
                    writeInHistory("Check!");
                    playSound(audioCheckAlert);
                    changeTurnCheck();
                }
                checkCount++;
            }
        }
        else {
            if (keep != null) {
                if (keep.className.includes("grey"))
                    keep.style.backgroundColor = "grey";
                else
                    keep.style.backgroundColor = "#bcc0c6";
                keep = null;
            }
            checkCount = 0;
        }
    }

    

}, false);

function isCheckMate(color) {
    generateAttackedBlocks();
    for (var i = 1; i <= 8; i++) {
        for (var j = 1; j <= 8; j++) {
            var j2 = String.fromCharCode(j + 96);
            var currCell = j2 + i;
            var colorType_t = "none";

            var t = document.getElementById(currCell).style.backgroundImage;
            if (t.includes("pb") || t.includes("rb") || t.includes("knb") || t.includes("bb") || t.includes("qb") || t.includes("kb"))
                colorType_t = "black";
            else if (t.includes("pw") || t.includes("rw") || t.includes("knw") || t.includes("bw") || t.includes("qw") || t.includes("kw"))     
                colorType_t = "white";
            if (colorType_t === color) {
                if (tryToEscape(currCell) == true) {
                    return false;
                }
            }
        }
    }
    return true;
}

function tryToEscape(from) {
    var elem = document.getElementById(from);
    var isPiece = false;
    if (elem.style.backgroundImage !== "none")
        isPiece = true;
    

    if (isPiece) {
        for (var i = 1; i <= 8; i++) {
            for (var j = 1; j <= 8; j++) {
                var j2 = String.fromCharCode(j + 96);
                var currCell = j2 + i;
                if (isLegal(from, currCell, 3)) {
                    return true;
                }
            }
        }
        return false;
    }
}


function generateAttackedBlocks() {
    
    erase();

    for (var i = 1; i <= 8; i++)
        for (var j = 1; j <= 8; j++) {
            var j2 = String.fromCharCode(j + 96);
            var currCell = j2 + i;
            attack(currCell);
        }
}

function erase() {
    for (var i = 1; i <= 8; i++)
        for (var j = 1; j <= 8; j++) {
            var j2 = String.fromCharCode(j + 96);
            var currCell = j2 + i;
            document.getElementById(currCell).classList.remove("attackedwhite");
            document.getElementById(currCell).classList.remove("attackedblack");
        }
}

function attack(from) {
    
    
    var elem = document.getElementById(from);
    var isPiece = false;
    if (elem.style.backgroundImage !== "none")
        isPiece = true;
    

    if (isPiece) {
        for (var i = 1; i <= 8; i++)
            for (var j = 1; j <= 8; j++) {
                var j2 = String.fromCharCode(j + 96);
                var currCell = j2 + i;
                var colorType_f;
                var f = document.getElementById(from).style.backgroundImage;    
                
                if (f.includes("pb") || f.includes("rb") || f.includes("knb") || f.includes("bb") || f.includes("qb") || f.includes("kb"))
                    colorType_f = "black";
                else if (f.includes("pw") || f.includes("rw") || f.includes("knw") || f.includes("bw") || f.includes("qw") || f.includes("kw"))     
                    colorType_f = "white";

                
                
                if (f.includes("pb") || f.includes("pw")) {
                    if (pawnAttacking(from[1], from[0], currCell[1], currCell[0], colorType_f))
                        if (colorType_f === "black")
                            document.getElementById(currCell).classList.add("attackedblack");
                        else
                            document.getElementById(currCell).classList.add("attackedwhite");
                }
                else if (isLegal(from, currCell, 2)) {
                    
                    
                    
                    if (colorType_f === "black")
                        document.getElementById(currCell).classList.add("attackedblack");
                    else
                        document.getElementById(currCell).classList.add("attackedwhite");
                }
                
                
                
            }
    }
}

function isKingAttacked() {
    var kw = getWhiteKing();
    var kb = getBlackKing();

    if (document.getElementById(kw).classList.contains("attackedblack"))
        return ("white");
    if (document.getElementById(kb).classList.contains("attackedwhite"))
        return ("black");
    return ("none");
}

function isKingAttacked2() {
    var kw = getWhiteKing();
    var kb = getBlackKing();
    var ret = "nsone";

    if (document.getElementById(kw).classList.contains("attackedblack"))
        ret = "white";
    if (document.getElementById(kb).classList.contains("attackedwhite")) {
        if (ret == "nsone")
            ret = "black";
        else
            ret += "black";
    }
    return ret;
}

function getWhiteKing() {
    return kingWhite;
}

function getBlackKing() {
    return kingBlack;
}

function isAttackedByWhite(toi, toj){
    if(document.getElementById(toj + toi).classList.contains("attackedwhite"))
        return true;
    return false;
}

function isAttackedByBlack(toi, toj){
    if(document.getElementById(toj + toi).classList.contains("attackedblack"))
        return true;
    return false;
}

function testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k) {
    var x = document.getElementById(from).style.backgroundImage;
    var y = document.getElementById(to).style.backgroundImage;
    var y2 = document.getElementById(to);
    var x2 = document.getElementById(from);

    y2.style.backgroundImage = x;
    x2.style.backgroundImage = "none";
    generateAttackedBlocks();

    var color = turnDiv.style.backgroundColor;
    if (color == "rgb(255, 255, 255)")
        color = "white";
    else
        color = "black";
    var now = isKingAttacked2();
    if (now.includes(k) || (now.includes(color))) {
        x2.style.backgroundImage = x;
        y2.style.backgroundImage = y;
        generateAttackedBlocks();
        return false;
    }
    else {
        x2.style.backgroundImage = x;
        y2.style.backgroundImage = y;
        generateAttackedBlocks();
        return true;
    }
}

function checkCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k) {
    var fromi = from[1];
    var fromj = from[0];
    var toi = to[1];
    var toj = to[0];

    if (pieceType_f === "pawn") {
        if (testPawn(fromi, fromj, toi, toj, colorType_f, colorType_t) == true)
            return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k);
        else
            return false;
    }
    else if (pieceType_f === "root") {
        if (testRoot(fromi, fromj, toi, toj, colorType_f, colorType_t) == true)
            return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k);
        else
            return false;
    }
    else if (pieceType_f === "knight") {
        if(testKnight(fromi, fromj, toi, toj) == true)
            return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k);
        else
            return false;
    }
    else if (pieceType_f === "bishop") {
        if(testBishop(fromi, fromj, toi, toj, colorType_f, colorType_t) == true)
            return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k);
        else
            return false;
    }
    else if (pieceType_f === "queen") {
        if(testQueen(fromi, fromj, toi, toj, colorType_f) == true)
            return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k);
        else
            return false;
    }
    else if (pieceType_f === "king") {
        if(testKing(fromi, fromj, toi, toj, colorType_f, colorType_t, caz) == true) {
            if (colorType_f === "white" && (caz === 1 || caz === 3))
                kingWhite = toj + "" + toi;
            else if (caz === 1 || caz === 3)
                kingBlack = toj + "" + toi;
            if (testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k) == true) {
                if (colorType_f === "white" &&  caz === 3)
                    kingWhite = fromj + "" + fromi;
                else if (caz === 3)
                    kingBlack = fromj + "" + fromi;
                return true;
            }
            else {
                if (colorType_f === "white" &&  caz === 3)
                    kingWhite = fromj + "" + fromi;
                else if (caz === 3)
                    kingBlack = fromj + "" + fromi;
                return false;
            }
        }
        else
            return false;
    }
    else
        return false;   
        
}

//check for legality of move

function isLegal(from, to, caz) {

    var f = document.getElementById(from).style.backgroundImage;
    var t = document.getElementById(to).style.backgroundImage;
    var pieceType_f;
    var colorType_f;
    var pieceType_t;
    var colorType_t;
    if (f.includes("pb") || f.includes("pw"))
        pieceType_f = "pawn";
    if (f.includes("rb") || f.includes("rw"))
        pieceType_f = "root";
    if (f.includes("knb") || f.includes("knw"))
        pieceType_f = "knight";
    if (f.includes("bb") || f.includes("bw"))
        pieceType_f = "bishop";
    if (f.includes("qb") || f.includes("qw"))
        pieceType_f = "queen";
    if (f.includes("kb") || f.includes("kw"))
        pieceType_f = "king";
    
    if (f.includes("pb") || f.includes("rb") || f.includes("knb") || f.includes("bb") || f.includes("qb") || f.includes("kb"))
        colorType_f = "black";
    else if (f.includes("pw") || f.includes("rw") || f.includes("knw") || f.includes("bw") || f.includes("qw") || f.includes("kw"))     
        colorType_f = "white";
        
    if (t.includes("pb") || t.includes("pw"))
        pieceType_t = "pawn";
    if (t.includes("rb") || t.includes("rw"))
        pieceType_t = "root";
    if (t.includes("knb") || t.includes("knw"))
        pieceType_t = "knight";
    if (t.includes("bb") || t.includes("bw"))
        pieceType_t = "bishop";
    if (t.includes("qb") || t.includes("qw"))
        pieceType_t = "queen";
    if (t.includes("kb") || t.includes("kw"))
        pieceType_t = "king";
    
    if (t.includes("pb") || t.includes("rb") || t.includes("knb") || t.includes("bb") || t.includes("qb") || t.includes("kb"))
        colorType_t = "black";
    else if (t.includes("pw") || t.includes("rw") || t.includes("knw") || t.includes("bw") || t.includes("qw") || t.includes("kw"))     
        colorType_t = "white";


    var fromi = from[1];
    var fromj = from[0];
    var toi = to[1];
    var toj = to[0];
    if (fromi === toi && fromj === toj)
        return false;
    if (colorType_f === colorType_t && (caz === 1 || caz === 3) )
        return false;

    var k = isKingAttacked();
    if (k != "none" && (caz === 1 || caz === 3))
        return checkCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz, k);

    
    
    if (pieceType_f === "pawn") {
        if (testPawn(fromi, fromj, toi, toj, colorType_f, colorType_t) === true) {
            return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz);
        }
        else
            return false;
    }
    else if (pieceType_f === "root") {
        if (testRoot(fromi, fromj, toi, toj, colorType_f, colorType_t) === true) {
            if (caz == 2)
                return true;
            else
                return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz);
        }
        else
            return false;
    }
    else if (pieceType_f === "knight") {
        if (testKnight(fromi, fromj, toi, toj) === true) {
            if (caz == 2)
                return true;
            else
                return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz);
        }
        else
            return false;
    }
    else if (pieceType_f === "bishop") {
        if (testBishop(fromi, fromj, toi, toj, colorType_f, colorType_t) === true) {
            if (caz == 2)
                return true;
            else
                return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz);
        }
        else
            return false;
    }
    else if (pieceType_f === "queen") {
        if (testQueen(fromi, fromj, toi, toj, colorType_f) === true) {
            if (caz == 2)
                return true;
            else
                return testCheckCase(from, to, pieceType_f, pieceType_t, colorType_f, colorType_t, caz);
        }
        else
            return false;
    }
    else if (pieceType_f === "king") {
        if(testKing(fromi, fromj, toi, toj, colorType_f, colorType_t, caz) == true) {
            if (colorType_f === "white" && caz === 1)
                kingWhite = toj + "" + toi;
            else if (caz === 1)
                kingBlack = toj + "" + toi;
            return true;
        }
        else
            return false;
    }
    else
        return false;       
    
}

//actual move function

function move(from, to, callback){
    moveHistory(from, to);
    changeTurnText();

    turnT = !turnT;

    var toi = to[1];
    var toj = to[0];

    var f = document.getElementById(from).style.backgroundImage;

    if (f.includes("kb")) {
        kingBlack = toj + "" + toi;
    }
    else if (f.includes("kw")) {
        kingWhite = toj + "" + toi;
    }

    if (document.getElementById(to).style.backgroundImage != "none") {
        playSound(audioCapturePiece);
        var t = window.getComputedStyle(document.getElementById(to)).backgroundImage;
        var colorType_t = null;
        
        if (t.includes("pb") || t.includes("rb") || t.includes("knb") || t.includes("bb") || t.includes("qb") || t.includes("kb"))
            colorType_t = "black";
        else if (t.includes("pw") || t.includes("rw") || t.includes("knw") || t.includes("bw") || t.includes("qw") || t.includes("kw"))     
            colorType_t = "white";

        $newImage = $('<img>');
        if (t.includes("knb") || t.includes("knw"))
            $newImage.attr('src', document.getElementById(to).style.backgroundImage.substring(5, 22));
        else
            $newImage.attr('src', document.getElementById(to).style.backgroundImage.substring(5, 21));
        $newImage.attr('height', '45%');
        if (colorType_t == "black")
            $("#takenPiecesBlack").append($newImage);
        else
            $("#takenPiecesWhite").append($newImage);
    }
    else
        playSound(audioMovePiece);
    document.getElementById(to).style.backgroundImage = document.getElementById(from).style.backgroundImage; 
    document.getElementById(from).style.backgroundImage = "none";
    // if(changeValue === "1")
    // {
    //     console.log("a mers!");
    // }
    callback();
}



function pawnAttacking(fromi, fromj, toi, toj, colorF) {
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    if(startChar !== stopChar) 
    {
        if (colorF === "black") {
            if(Math.abs(stopChar -  startChar) !== 1 || (toi - fromi) !== -1)
                return false;
            return true;
        } else {
            if(Math.abs(stopChar -  startChar) !== 1 || (toi - fromi) !== 1)
                return false;
            return true;
        }
    }
}

//function for legal moves for a pawn

function testPawn(fromi, fromj, toi, toj, colorF, colorT){
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    if(startChar !== stopChar) 
    {
        if(isOccupied(toi, toj) === true){
            if (colorF === "black") {
                if(Math.abs(stopChar -  startChar) !== 1 || (toi - fromi) !== -1)
                    return false;
                return true;
            } else {
                if(Math.abs(stopChar -  startChar) !== 1 || (toi - fromi) !== 1)
                    return false;
                return true;
            }
        }
        else
            return false;
    }
    if(colorT !== colorF && startChar === stopChar && isOccupied(toi, toj))
        return false; 
    if(colorF === "black" && parseInt(fromi) === 7 && isOccupied(6, toj))
        return false;
    if(colorF === "white" && parseInt(fromi) === 2 && isOccupied(3, toj))
        return false;
    if(colorF === "black" && parseInt(fromi - toi) > 2)
        return false;
    if(colorF === "white" && parseInt(toi - fromi) > 2)
        return false;
    if(colorF === "black" && parseInt(fromi - toi) < 0) 
        return false;
    if(colorF === "white" && parseInt(fromi - toi) > 0) 
        return false;
    if(colorF === "black" && parseInt(fromi - toi) === 2 && parseInt(fromi) !== 7) 
        return false;
    if(colorF === "white" && parseInt(fromi - toi) === -2 && parseInt(fromi) !== 2) 
        return false;
    return true; 
}

//function for legal moves for a knight

function testKnight(fromi, fromj, toi, toj){
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);
    
    if(Math.abs(fromi - toi) === 2 && Math.abs(startChar - stopChar) === 1)
        return true;
    else if(Math.abs(fromi - toi) === 1 && Math.abs(startChar - stopChar) === 2)
        return true;
    return false;
}

//function for legal moves for a root

function testRoot(fromi, fromj, toi, toj, colorF, colorT){
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    if (fromi === toi || fromj === toj) {
        
        if (isOccupied(toi, toj)) {
            if (fromi === toi)
                if (stopChar - startChar > 0)
                    return recTestRoot(fromi, fromj, toi, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) - 1), colorT);
                else
                    return recTestRoot(fromi, fromj, toi, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) + 1), colorT);
            else
                if (toi - fromi > 0)
                    return recTestRoot(fromi, fromj, parseInt(toi) - 1, toj, colorT);
                else
                    return recTestRoot(fromi, fromj, parseInt(toi) + 1, toj, colorT);
        }
        else
            return recTestRoot(fromi, fromj, toi, toj, colorT);
    }
    return false;
}

function recTestRoot(fromi, fromj, toi, toj, colorType) {
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    
    if (parseInt(fromi) === parseInt(toi) && startChar === stopChar)
        return true;
    if (isOccupied(toi, toj) === true)
        return false;
    if (fromi === toi)
        if (stopChar - startChar > 0)
            return recTestRoot(fromi, fromj, toi, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) - 1), colorType);
        else
            return recTestRoot(fromi, fromj, toi, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) + 1), colorType);
    else
        if (toi - fromi > 0)
            return recTestRoot(fromi, fromj, parseInt(toi) - 1, toj, colorType);
        else
            return recTestRoot(fromi, fromj, parseInt(toi) + 1, toj, colorType);
}

//function for legal moves for a bishop

function testBishop(fromi, fromj, toi, toj, colorF, colorT){
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    if (Math.abs(startChar - stopChar) === Math.abs(toi - fromi)) {
        if (isOccupied(toi, toj)) {
            if(parseInt(fromi) < parseInt(toi)){
                if (stopChar - startChar > 0)
                    return recTestBishop(fromi, fromj, parseInt(toi) - 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) - 1), colorT);
                else
                    return recTestBishop(fromi, fromj, parseInt(toi) - 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) + 1), colorT);
            }
            else{
                if (stopChar - startChar > 0)
                    return recTestBishop(fromi, fromj, parseInt(toi) + 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) - 1), colorT);
                else
                    return recTestBishop(fromi, fromj, parseInt(toi) + 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) + 1), colorT);
            }
        }
        else
            return recTestBishop(fromi, fromj, toi, toj, colorT);
    }
    return false;
}

function recTestBishop(fromi, fromj, toi, toj, colorType) {
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    
    if (parseInt(fromi) === parseInt(toi) && startChar === stopChar)
        return true;
    if (isOccupied(toi, toj) === true)
        return false;
    if(parseInt(fromi) < parseInt(toi)){
        if (stopChar - startChar > 0)
            return recTestBishop(fromi, fromj, parseInt(toi) - 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) - 1), colorType);
        else
            return recTestBishop(fromi, fromj, parseInt(toi) - 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) + 1), colorType);
    }
    else{
        if (stopChar - startChar > 0)
            return recTestBishop(fromi, fromj, parseInt(toi) + 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) - 1), colorType);
        else
            return recTestBishop(fromi, fromj, parseInt(toi) + 1, String.fromCharCode(JSON.stringify(toj).charCodeAt(1) + 1), colorType);
    }
}

//function for legal moves for a king

function testKing(fromi, fromj, toi, toj, colorF, colorT, caz){
    var startChar = JSON.stringify(fromj).charCodeAt(1);
    var stopChar = JSON.stringify(toj).charCodeAt(1);

    if(Math.abs(fromi - toi) >= 2 || Math.abs(startChar - stopChar) >= 2)
        return false;
    if(isAttackedByWhite(toi, toj) && colorF === "black" && (caz === 1 || caz === 3))
        return false;
    if(isAttackedByBlack(toi, toj) && colorF === "white" && (caz === 1 || caz === 3))
        return false;
    return true;  
}

//function for legal moves for a queen

function testQueen(fromi, fromj, toi, toj, colorType) {
    if (testRoot(fromi, fromj, toi, toj, colorType) === false &&
        testBishop(fromi, fromj, toi, toj, colorType) === false)
        return false;
    return true;
}

//color all legal moves with green on chess table

function paintGreen(from) {
    var el = document.getElementsByClassName("gamecell");
    document.getElementById(from).style.border = "3px solid orange";
    for(var i = 0; i < el.length; i++){
        
        var currCell = el[i]["id"];
        if (isLegal(from, currCell, 3)) {
            var f = window.getComputedStyle(document.getElementById(from)).backgroundImage;
            var t = window.getComputedStyle(document.getElementById(currCell)).backgroundImage;
            var colorType_f = null;
            var colorType_t = null;

            if (f.includes("pb") || f.includes("rb") || f.includes("knb") || f.includes("bb") || f.includes("qb") || f.includes("kb"))
                colorType_f = "black";
            else if (f.includes("pw") || f.includes("rw") || f.includes("knw") || f.includes("bw") || f.includes("qw") || f.includes("kw"))     
                colorType_f = "white";
            
            if (t.includes("pb") || t.includes("rb") || t.includes("knb") || t.includes("bb") || t.includes("qb") || t.includes("kb"))
                colorType_t = "black";
            else if (t.includes("pw") || t.includes("rw") || t.includes("knw") || t.includes("bw") || t.includes("qw") || t.includes("kw"))     
                colorType_t = "white";
            
            if (colorType_f === colorType_t || colorType_f === null || colorType_t === null)
                document.getElementById(currCell).style.backgroundColor = "rgba(0, 156, 0, 0.8)";
            else
                document.getElementById(currCell).style.backgroundColor = "rgba(156, 0, 0, 0.8)";
        }
    }
}

function removeGreen(from) {
    document.getElementById(from).style.border = "1px solid black";
    var el = document.getElementsByClassName("gamecell");
    for(var i = 0; i < el.length; i++){
        
        var currCell = el[i]["id"];
        var elem = document.getElementById(currCell);
        if (elem.style.backgroundColor == "rgba(0, 156, 0, 0.8)" || elem.style.backgroundColor == "rgba(156, 0, 0, 0.8)") {
            if (elem.className.includes("grey"))
                elem.style.backgroundColor = "grey";
            else
                elem.style.backgroundColor = "#bcc0c6";
        }
    }
}

function isOccupied (i, j) {
    var x = document.getElementById(j + i);
    if (window.getComputedStyle(x).backgroundImage.includes("none"))
        return false;
    return true;
}

function currentColor(from){
    if(isOccupied(from[1], from[0])){
        var id = window.getComputedStyle(document.getElementById(from)).backgroundImage;
        if(id.includes("pw") || id.includes("rw") || id.includes("knw") || id.includes("bw") || id.includes("qw") || id.includes("kw"))
            return ("white");
        else
            return ("black");
    }

    return ("none");
}

function changeTurnText(){
    if(turnDiv.style.backgroundColor == "rgb(255, 255, 255)")
    {
        changeTurnBlack();
    }
    else
    {
        changeTurnWhite();
    }
}

function changeTurnWhite(){
    turnDiv.style.backgroundColor = "rgb(255, 255, 255)";
    turnDiv.style.color = "rgb(0, 0, 0)";
    turnDiv.style.borderColor = "rgb(0, 0, 0)";
    turnDiv.innerHTML = "It's White's turn!"; 
}

function changeTurnBlack(){
    turnDiv.style.backgroundColor = "rgb(0, 0, 0)";
    turnDiv.style.color = "rgb(255, 255, 255)";
    turnDiv.style.borderColor = "rgb(255, 255, 255)";
    turnDiv.innerHTML = "It's Black's turn!";
}

function changeTurnCheck(){
    turnDiv.innerHTML = "CHECK!";
    turnDiv.style.color = "rgb(255, 0, 0)";
}

function changeTurnCheckMateWhite(){
    turnDiv.innerHTML = "CHECKMATE! WHITE WINS!";
    turnDiv.style.color = "rgb(255, 0, 0)";
}

function changeTurnCheckMateBlack(){
    turnDiv.innerHTML = "CHECKMATE! BLACK WINS!";
    turnDiv.style.color = "rgb(255, 0, 0)";
}


function playSound(thisSong){
    thisSong.play();
}

function moveHistory(from, to){
    historyCountMove++;
    var x = document.getElementById("takenPieces");
    var line = "white: "; 
    if(historyCountMove % 2 == 0)
        line = "black: "; 
    line += JSON.stringify(from).substring(1,3) + "-->" + JSON.stringify(to).substring(1,3);
    x.innerHTML += line;
    var linebreak = document.createElement("br");
    x.appendChild(linebreak);
    x.scrollTop = x.scrollHeight + 10000;
}

function writeInHistory(message) {
    var x = document.getElementById("takenPieces");
    x.innerHTML += message;
    var linebreak = document.createElement("br");
    x.appendChild(linebreak);
    x.scrollTop = x.scrollHeight + 10000;
}

var ws;
var moved = false;
var turnT;


function findGame(){

    ws = new WebSocket('ws://localhost:40510');
    
    ws.onopen = function () {
        ws.send('connected');
    }
    
    ws.onmessage = function (ev) {
        
        var res = JSON.parse(ev.data);
        if (res.status == "finding") {
            writeInHistory("Hello! Please wait until the game starts!")
            writeInHistory("Finding an opponent...");
        }
        if (res.status == "started") {

            // setting cookie
            var nr = 0;
            if (document.cookie.length == 0) {
                nr = 0;
                document.cookie = "count=0";
            }
            else {
                var nr = parseInt(document.cookie.substring(6));
                document.cookie = "count=" + (nr + 1);
            }

            // 

            writeInHistory("-------------------");
            writeInHistory("The game started! Good luck!");
            if(res.player == 1) {
                writeInHistory("You are WHITE!");
                writeInHistory("-------------------");
                writeInHistory("MOVES:")
                writeInHistory("");
                turn = "white";
                turnT = true;
            }
            else {
                writeInHistory("You are BLACK!");
                writeInHistory("-------------------");
                writeInHistory("MOVES:")
                writeInHistory("");
                turn = "black";
                turnT = false;
            }
        }
        if(res.status == "move"){
            if(moved) {
                moved = false;
            }
            else{
                move(res.move.from, res.move.to, function() {
                    generateAttackedBlocks();
                });
                var kingB = document.getElementById(kingBlack);
                var kingW = document.getElementById(kingWhite);
        
                if (isKingAttacked() == "black") {
                    if (isCheckMate("black"))
                    {
                        writeInHistory("Checkmate! Game over!");
                        res = {status:"end", win:"white", lose:"black"};
                        ws.send (JSON.stringify(res));
                        playSound(audioVictory);
                        changeTurnCheckMateWhite();
                    }
                    else
                    { 
                        kingB.style.backgroundColor = "red";
                        keep = kingB;
                        if(checkCount == 0){
                            writeInHistory("Check!");
                            playSound(audioCheckAlert);
                            changeTurnCheck();
                        }
                        checkCount++; 
                    }
                }
                else if (isKingAttacked() == "white") {
                    if (isCheckMate("white"))
                    {   
                        writeInHistory("Checkmate! Game over!");
                        res = {status:"end", win:"black", lose:"white"};
                        ws.send (JSON.stringify(res));
                        playSound(audioVictory);
                        changeTurnCheckMateBlack();
                        
                    }
                    else
                    {
                        kingW.style.backgroundColor = "red";
                        keep = kingW;
                        if(checkCount == 0){
                            writeInHistory("Check!");
                            playSound(audioCheckAlert);
                            changeTurnCheck();
                        }
                        checkCount++;
                    }
                }
                else {
                    if (keep != null) {
                        if (keep.className.includes("grey"))
                            keep.style.backgroundColor = "grey";
                        else
                            keep.style.backgroundColor = "#bcc0c6";
                        keep = null;
                    }
                    checkCount = 0;
                }
            }
        }
        if (res.status == "finished") {
            turn = false;
            if (res.winner == true) {
                writeInHistory("-------------------");
                writeInHistory("Congratulations! You won!");
            }
            else {
                writeInHistory("-------------------");
                writeInHistory("Unfortunately, you lost! Good luck next time!");
            }
        }
        if (res.status == "aborted") {
            playSound(audioQuit);
            turn = false;
            writeInHistory("-------------------");
            writeInHistory("We are sorry to inform you that your opponent quit the game!");
            writeInHistory("So congratulations! You won!");
        }
    }
}

function colorCurrent(fromBrut, to){
    
    var from = window.getComputedStyle(document.getElementById(fromBrut)).backgroundImage;
    
    if (from.includes("pb") || from.includes("rb") || from.includes("knb") || from.includes("bb") || from.includes("qb") || from.includes("kb"))
    {
        return "black";
    }
    else if (from.includes("pw") || from.includes("rw") || from.includes("knw") || from.includes("bw") || from.includes("qw") || from.includes("kw"))   
    {
        return "white";
    }
    else
    {
        return "none";
    }
}

function changePawn(from, to){
    var fromSecond = window.getComputedStyle(document.getElementById(from)).backgroundImage;

    if(colorCurrent(from, to) === "white" && JSON.stringify(to).charAt(2) === '8' && fromSecond.includes("pw")){
        // window.alert("promotion white pawn");
        return "whitePromote";
    }
    if(colorCurrent(from, to) === "black" && JSON.stringify(to).charAt(2) === '1' && fromSecond.includes("pb")){
        // window.alert("promotion black pawn");
        return "blackPromote";
    }
    return "noPromote";
}

function getBackground(selected){
    return document.getElementById(selected).style.backgroundImage;
}

function rotateBoard(){
    var prefix = document.getElementsByClassName("cellprefix");
    for(var i = 0; i < 8; i++){
       prefix[i].innerHTML = i + 1; 
    }

    // var whiteBoard = document.getElementsByClassName("gamecell");
    // var blackBoard = whiteBoard;

}

function undoRotate(){
    var prefix = document.getElementsByClassName("cellprefix");
    var numchange = 8;
    for(var i = 0; i < 8; i++){
       prefix[i].innerHTML = numchange--; 
    }
}