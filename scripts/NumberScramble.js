$(document).ready(function () {
    //set up DataTransfer object in jQuery
    jQuery.event.props.push('dataTransfer');
    //initialize game
    numberScramble.initialize()();
    //update score record
    numberScramble.updateGameRecord();
    //Add event listener to mode select buttons
     $('#easyMode').on('click', numberScramble.easyMode);
     $('#mediumMode').on('click', numberScramble.mediumMode);
     $('#hardMode').on('click',numberScramble.hardMode);
    //Add audio control and animation
     var audio = $('#audio')[0];
     var toadAnimate = function(){
        $('body').append("<img src='img/toad.png' id='animateImg'/>");
        $('#animateImg').animate({'left':0},3000);
        return $('#animateImg').animate({'left':'-450px'},3000).promise();
     };
     var goombaAnimate = function(promise){
        var goombaPromise = promise.pipe(function(){
            $('#animateImg').attr({'src':'img/goomba.png','top':'50px'});
            $('#animateImg').animate({'left':0},3000);
            return $('#animateImg').animate({'left':'-450px'},3000).promise();
        });
        goombaPromise.done(function(){
            $('#animateImg').remove();
        })
     }
     $('#playMusic').click(function(){
         audio.play();
         var promise = toadAnimate();
         goombaAnimate(promise);
     });
     $('#pauseMusic').click(function(){
        audio.pause();
     });
     $('#restartMusic').click(function(){
        audio.load();
        audio.play();
        var promise = toadAnimate();
         goombaAnimate(promise);
    });
});

//Number scramble scripts encapsulate in IIFE
(function(){
this.numberScramble = this.numberScramble || {};
//Declare namespace for quick reference

var ns = this.numberScramble;

//Declare necessary variable
var squareCount = 16,
    emptySquare,
    moveCount,
    modeSelected,
    allModeRecord = {},
    easyModeRecord = [],
    mediumModeRecord = [],
    hardModeRecord = [];

//use closure to initialize game in different mode
ns.initialize = function(mode) {
    return function(){
            addLogoAnimation();
            var scrambleStep;
            clearBoard();
            moveCount = 0;
            modeSelected = mode || 'easy';
            createBoard();
            addTiles();
            $('#currentMode').text(modeSelected);
            $('#gameBoard').on('dragstart', dragStarted);
            //prevent default bahavior to allow drop
            $('#gameBoard').on('dragenter', preventDefault);
            $('#gameBoard').on('dragover', preventDefault);
            $('#gameBoard').on('drop', drop);
            $('#gameBoard').children().removeClass("animated zoomIn").addClass('animated zoomIn');
            switch (mode){
                case 'easy':
                    scrambleStep = 20;
                    break;
                case 'medium':
                    scrambleStep = 60;
                    break;
                case 'hard':
                    scrambleStep = 100;
                    break;
                default:
                    scrambleStep = 20;
            }
            scramble(scrambleStep);
            if(typeof localStorage !== 'undefined'){
                var start = {
                    easy:[],
                    medium:[],
                    hard:[]
                };
                if(localStorage.scrambleGameRecord == undefined){
                    localStorage.setItem('scrambleGameRecord',JSON.stringify(start));
                }
            }
        }
}
//Create functions for different mode
    ns.easyMode = ns.initialize('easy'),
    ns.mediumMode = ns.initialize('medium'),
    ns.hardMode = ns.initialize('hard');
//Add animation to logo
function addLogoAnimation(){
    $('#message h1').removeClass("animatedLogo");
    setTimeout(function(){$('#message h1').addClass("animatedLogo");},500);
}
//Clear gameboard DOM
function clearBoard(){
    $('#gameBoard').children().remove();
    $('#gameBoard').off();
}
//Create gameboard DOM
function createBoard() {
    for (var i = 0; i < squareCount; i++) {
        var $square = $('<div id="square' + i + '" data-square="' + i + '" class="square"></div>');
        $square.appendTo($('#gameBoard'));
    }
}
//Add tiles to squares in gameboard
function addTiles() {
    emptySquare = squareCount - 1;
    for (var i = 0; i < emptySquare; i++) {
        var $square = $('#square' + i);
        var $tile = $('<div draggable="true" id="tile' + i + '" class="tile">' + (i + 1) + '</div>');
        $tile.appendTo($square);
    }
}
//callback function for dragstart event
function dragStarted(e) {
    var $tile = $(e.target);
    var sourceLocation = $tile.parent().data('square');
    e.dataTransfer.setData('text', sourceLocation.toString());
    e.dataTransfer.effectAllowed = 'move';
}
//callback function for dragenter and dragover event to allow drop 
function preventDefault(e) {
    e.preventDefault();
}
//callback function for drop event
function drop(e) {
    var $square = $(e.target);
    if ($square.hasClass('square')) {
        var destinationLocation = $square.data('square');
        if (emptySquare != destinationLocation) return;
        var sourceLocation = Number(e.dataTransfer.getData('text'));
        moveTile(sourceLocation);
        checkForWinner();
    }
}
//callback function for moving tiles
function moveTile(sourceLocation) {
    var distance = (sourceLocation - emptySquare)>0?(sourceLocation - emptySquare):(emptySquare -sourceLocation);
    //Calculate distance. Only adjacent tiles can be swapped.
    if (distance == 1 || distance == 4) {
        swapTileAndEmptySquare(sourceLocation);
    }
}
//swap empty tile and target tile
function swapTileAndEmptySquare(sourceLocation) {
    var $draggedItem = $('#square' + sourceLocation).children();
    $draggedItem.detach();
    var $target = $('#square' + emptySquare);
    $draggedItem.appendTo($target);
    emptySquare = sourceLocation;
    moveCount++;
}
//Scramble the tiles. adjust move to provide scramble function for different mode
function scramble(move) {
    for (var i = 0; i < move; i++) {
        var random = Math.random();
        var sourceLocation;
        if (random < 0.5) {
            var column = emptySquare % 4;
            if (column == 0 || (random < 0.25 && column != 3)) {
                sourceLocation = emptySquare + 1;
            }
            else {
                sourceLocation = emptySquare - 1;
            }
        }
        else {
            var row = Math.floor(emptySquare / 4);
            if (row == 0 || (random < 0.75 && row != 3)) {
                sourceLocation = emptySquare + 4;
            }
            else {
                sourceLocation = emptySquare - 4;
            }
        }
        swapTileAndEmptySquare(sourceLocation);
    }
    moveCount = 0;
}
//check whether player win the game. If win, clear the board, append win message and also update game record.
function checkForWinner() {
    if (emptySquare != squareCount - 1) return;
    for (var i = 0; i < emptySquare; i++) {
        if ($('#tile' + i).parent().attr('id') != 'square' + i) return;
    }
    //Clear board, add win message to the board.
    clearBoard();
    var $winMessage = $('<p class="text-center" id="winMessage"></p><img alt="win" class="animated rubberBand" src="img/thumbup.png" style="margin-top:10px;width:70%;height:50%"/>');
    $winMessage.appendTo($('#gameBoard'));

    $('#winMessage').html('Winner! Total move: '+moveCount).addClass('animated zoomIn');
    addGameRecord();
    ns.updateGameRecord();
}

//Add game record to localStorage 
 
function addGameRecord(){   
    if(typeof localStorage !== "undefined"){
         var gameRecord = JSON.parse(localStorage.getItem('scrambleGameRecord')),
            easyRecord = gameRecord.easy,
            mediumRecord = gameRecord.medium,
            hardRecord = gameRecord.hard;
        switch(modeSelected){
            case "easy":
               easyRecord.push([moveCount,getDate()]);
               break;
            case "medium":
               mediumRecord.push([moveCount,getDate()]);
               break;
            case "hard":
               hardRecord.push([moveCount,getDate()]);
               break;
        }
        allModeRecord.easy = easyRecord;
        allModeRecord.medium = mediumRecord;
        allModeRecord.hard = hardRecord;
        localStorage.setItem("scrambleGameRecord", JSON.stringify(allModeRecord));
}
    else{
        $("<li class='list-group-item'>Your browser does not support localStorage</li>").appendTo($('#scoreRecord'));
    }
}
//Retrive game record in localStoarge and update the record
ns.updateGameRecord = function(){
    if(localStorage.scrambleGameRecord !== "undefined"){
        var gameRecord = JSON.parse(localStorage.getItem('scrambleGameRecord')),
            easyRecord = editForRank(gameRecord.easy),
            mediumRecord = editForRank(gameRecord.medium),
            hardRecord = editForRank(gameRecord.hard);
        $('#easyRecord ul').children().remove();
        $('#mediumRecord ul').children().remove();
        $('#hardRecord ul').children().remove();
        for(var i=0;i<easyRecord.length;i++){
            $('#easyRecord ul').append($("<li class='list-group-item'>Move: "+easyRecord[i][0]+"<span class='pull-right'>"+easyRecord[i][1] +"</span></li>"));
        }
        for(var i=0;i<mediumRecord.length;i++){
        $('#mediumRecord ul').append($("<li class='list-group-item'>Move: "+mediumRecord[i][0]+"<span class='pull-right'>"+mediumRecord[i][1] +"</span></li>"));
        }
        for(var i=0;i<hardRecord.length;i++){
        $('#hardRecord ul').append($("<li class='list-group-item'>Move: "+hardRecord[i][0]+"<span class='pull-right'>"+hardRecord[i][1] +"</span></li>"));
        }
    }
    
}
//Edit score, sort with move step, limit to 5 scores
function editForRank(scores){
    scores.sort(function(a,b){
        return a[0]-b[0];
    })
    return scores.slice(0,5);
}
    // Return current date MM/dd/YY
function getDate(){
    return (new Date()).toLocaleString().split(",")[0];
}

}());
