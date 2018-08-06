/*
This is a rabbit game that plays out on a 10x10 map (preset). There are different kinds of rabbits
that can all interact with each other.

Male rabbit - if it stumbles upon a female rabbit it will mate
Female rabbit - if it stumbles upon a male rabbit it will become pregnant
Child rabbit - walks around slowly, until it becomes adult (and turns into female or male)

Evil rabbit - kills rabbits it ends up on the same tile with

Stretch goal: Plagues, vampire rabbits, human invasion
*/

canv=document.getElementById("game-canvas"); // stores the game canvas to use by javascript
ctx=canv.getContext("2d");                   // stores a 2d canvas to draw on


var NUM_GOOD_MALE_RABBITS = 8;
var NUM_GOOD_FEMALE_RABBITS = 8;
var AGE_DEATH = 70;
var PREGNANCY_AGE = 8;
var DAYS_UNTIL_BIRTH = 2;
var SPERM_AGE = 8;
var CHILD_UNTIL_AGE = 8;

var PLAGUE_KILL_CHANCE = 0.1;
var PLAGUE_STRENGTH_LOWER_LIMIT = 8;
var PLAGUE_STRENGTH_UPPER_LIMIT = 40;

var NUM_EVIL_RABBITS = 0;
var EVIL_CHANCE_SPAWN = 0.10;
var STARVE_TIMER = 15;
var STARVE_INCREMENT_PER_KILL = 2;

var MAP_WIDTH = 10;
var MAP_HEIGHT = 10;
var TILE_GRAPHIC_SIZE = 30;
var TILE_SIZE = 30;


  /** constructor for tile object
  *  Has both a real x position (on the canvas)
  *  and also a conceptualized x position, in terms of how a
  *  matrix would have worked ((1,3) is the position row 1, col 3)
  *  (Same applies to y)
  *
  */

//---------------------------------------------------------------
/**
 * INITIATE PROTOTYPAL INHERITENCE SETUP
 */
var tile = {
  realx: "Real x not given yet",
  realy: "Real y not given yet",
  row: "Conceptual row not given yet",
  col: "Conceptual column not given yet"
}

/**
* An inherited method which can issue a tile to draw its color
* (lighter green or normal green) depending on its own position
* on the grid
*/
tile.drawBackground = function() {
  ctx.fillStyle = "#7FFFD4"
  if (!isEven(this.row) && !isEven(this.col)) {
    ctx.fillRect(this.realx,this.realy,TILE_SIZE,TILE_SIZE);
  }
  if (isEven(this.row) && isEven(this.col)) {
    ctx.fillRect(this.realx,this.realy,TILE_SIZE,TILE_SIZE);
  }
  ctx.fillStyle = "#01FF70"
  if (!isEven(this.row) && isEven(this.col)) {
    ctx.fillRect(this.realx,this.realy,TILE_SIZE,TILE_SIZE);
  }
  if (isEven(this.row) && !isEven(this.col)) {
    ctx.fillRect(this.realx,this.realy,TILE_SIZE,TILE_SIZE);
  }
}

/**
 * The most basic of rabbit attributes
 */
var basicRabbit = {
  gender: "Male",
  age: 0,
  row: MAP_HEIGHT/2,
  col: MAP_WIDTH/2
}

basicRabbit.draw = function Draw() {
  var tile = tiles[this.row-1][this.col-1];
  var x = tile.realx;
  var y = tile.realy;
  var RADIUS = 5;

  var X_TRANSLATE = TILE_GRAPHIC_SIZE/2;
  var Y_TRANSLATE = TILE_GRAPHIC_SIZE/2;

  if (this.gender === "Male") {
    ctx.fillStyle = "blue";
    X_TRANSLATE = TILE_GRAPHIC_SIZE*0.25;
    Y_TRANSLATE = TILE_GRAPHIC_SIZE*0.33;
  }
  if (this.gender === "Female") {
    ctx.fillStyle = "pink";
    X_TRANSLATE = TILE_GRAPHIC_SIZE*0.75;
    Y_TRANSLATE = TILE_GRAPHIC_SIZE*0.33;
  }
  if (this.faction === "Evil") {
    ctx.fillStyle = "black";
    X_TRANSLATE = TILE_GRAPHIC_SIZE*0.50;
    Y_TRANSLATE = TILE_GRAPHIC_SIZE*0.50;
    RADIUS = 7.5;
  }
  if (this.age < CHILD_UNTIL_AGE) {
    ctx.fillStyle = "yellow";
    if (this.faction === "Evil") {
      ctx.fillStyle = "brown";
    }
    X_TRANSLATE = TILE_GRAPHIC_SIZE*0.50;
    Y_TRANSLATE = TILE_GRAPHIC_SIZE*0.66;
  }
  if (this.plagued === true) {
    ctx.fillStyle = "darkgreen"; //#006400
  }

  ctx.beginPath();
  ctx.arc(x+X_TRANSLATE, y+Y_TRANSLATE, RADIUS, 0, 2 * Math.PI, false);
  ctx.fill();
}
basicRabbit.plagueHit = (function () {
  var age = this.age;
  var vulnerability = 80;
  if (age < PLAGUE_STRENGTH_LOWER_LIMIT || age > PLAGUE_STRENGTH_UPPER_LIMIT) {
    vulnerability = 30;
  }
  var rand = Math.random() * 100
  console.log(vulnerability);
  if (vulnerability < rand) {
    this.plagued = true;
    return true;
  }
  else {
    return false;
  }
});
basicRabbit.plagued = false;

/**
 * Extension from basic to being able to calculate moves
 */
var moveChance = {
  up: 100,
  down: 100,
  left: 100,
  right: 100,
  noMove: 100,
  set: (function(up, down, left, right, noMove) {
    this.up = up;
    this.down = down;
    this.left = left;
    this.right = right;
    this.noMove = noMove;
  })
}
var movingRabbit = Object.create(basicRabbit);
movingRabbit.projectedMove = "right";
movingRabbit.speed = 2;
var chance = Object.create(moveChance);
movingRabbit.move = function() {
  var move = this.projectedMove;
  if (move === "up")
    --this.row;
  if (move === "down")
    ++this.row;
  if (move === "left")
    --this.col;
  if (move === "right")
    ++this.col;
  if (move === "noMove") {//Do no movement

  }
  //MAKES ALL CHANCES EQUALLY LIKELY AGAIN
  this.moveChance.set(100,100,100,100,100);
}
movingRabbit.checkCollision = function() {
  if (this.row === 1)
    this.moveChance.up = 0;
  if (this.row === MAP_HEIGHT)
    this.moveChance.down = 0;
  if (this.col === 1)
    this.moveChance.left = 0;
  if (this.col === MAP_WIDTH)
    this.moveChance.right = 0;
}
/**
 * All five modes of movement (no movement included)
 * will have their value multiplied with a random value
 * between 0 and 1.
 *
 * The highest value of all those randoms will be the chosen
 * direction of the rabbit.
 */
movingRabbit.calculateMove = function() {
  var move = this.moveChance;
  var Up = Math.random() * move.up;
  var Down = Math.random() * move.down;
  var Left = Math.random() * move.left;
  var Right = Math.random() * move.right;
  var noMove = Math.random() * move.noMove;
  var winner = Math.max(Up, Down, Left, Right, noMove);


  if (winner === Up)
    this.projectedMove = "up";
  else if (winner === Down)
    this.projectedMove = "down";
  else if (winner === Left)
    this.projectedMove = "left";
  else if (winner === Right)
    this.projectedMove = "right";
  else if (winner === noMove)
    this.projectedMove = "noMove";
}
/**
 * Draw a projection of (an image with an arrow of) how the respective
 * rabbit will move the next round.
 */
movingRabbit.drawProjection = function() {
  var tile = tiles[this.row-1][this.col-1];
  var x = tile.realx;
  var y = tile.realy;

  var X_TRANSLATE;
  var Y_TRANSLATE;
  var image;

  if (this.gender === "Male") {
    if (this.projectedMove === "left") {
      image = document.getElementById("lsbluearrow");
      X_TRANSLATE = -22;
      Y_TRANSLATE = 0;
    }
    if (this.projectedMove === "right") {
      image = document.getElementById("rsbluearrow");
      X_TRANSLATE = 22;
      Y_TRANSLATE = 0;
    }
    if (this.projectedMove === "up") {
      image = document.getElementById("usbluearrow");
      X_TRANSLATE = 0;
      Y_TRANSLATE = -22;
    }
    if (this.projectedMove === "down") {
      image = document.getElementById("dsbluearrow");
      X_TRANSLATE = 0;
      Y_TRANSLATE = 22;
    }
  }
  if (this.gender === "Female") {
    if (this.projectedMove === "left") {
      image = document.getElementById("lspinkarrow");
      X_TRANSLATE = -19;
      Y_TRANSLATE = 10;
    }
    if (this.projectedMove === "right") {
      image = document.getElementById("rspinkarrow");
      X_TRANSLATE = 22;
      Y_TRANSLATE = 10;
    }
    if (this.projectedMove === "up") {
      image = document.getElementById("uspinkarrow");
      X_TRANSLATE = 10;
      Y_TRANSLATE = -19;
    }
    if (this.projectedMove === "down") {
      image = document.getElementById("dspinkarrow");
      X_TRANSLATE = 10;
      Y_TRANSLATE = 22;
    }
  }
  if (this.age < CHILD_UNTIL_AGE) {
    if (this.projectedMove === "left") {
      image = document.getElementById("lsyellowarrow");
      X_TRANSLATE = -16;
      Y_TRANSLATE = 20;
    }
    if (this.projectedMove === "right") {
      image = document.getElementById("rsyellowarrow");
      X_TRANSLATE = 22;
      Y_TRANSLATE = 20;
    }
    if (this.projectedMove === "up") {
      image = document.getElementById("usyellowarrow");
      X_TRANSLATE = 20;
      Y_TRANSLATE = -16;
    }
    if (this.projectedMove === "down") {
      image = document.getElementById("dsyellowarrow");
      X_TRANSLATE = 20;
      Y_TRANSLATE = 22;
    }
  }
  if (this.faction === "Evil") {
    if (this.projectedMove === "left") {
      image = document.getElementById("lsblackarrow");
      X_TRANSLATE = -20;
      Y_TRANSLATE = 8;
    }
    if (this.projectedMove === "right") {
      image = document.getElementById("rsblackarrow");
      X_TRANSLATE = 20;
      Y_TRANSLATE = 8;
    }
    if (this.projectedMove === "up") {
      image = document.getElementById("usblackarrow");
      X_TRANSLATE = 8;
      Y_TRANSLATE = -20;
    }
    if (this.projectedMove === "down") {
      image = document.getElementById("dsblackarrow");
      X_TRANSLATE = 8;
      Y_TRANSLATE = 20;
    }
  }
  if (!image) return;
  //x+X_TRANSLATE, y+Y_TRANSLATE
  ctx.drawImage(image, x+X_TRANSLATE, y+Y_TRANSLATE);
}

/**
 * Extension and specification of male attributes
 */
var maleRabbit = Object.create(movingRabbit);
maleRabbit.gender = "Male";
maleRabbit.canProcreate = (function() {
  return (this.age >= SPERM_AGE);
})()

/**
 * Extension and specification of female attributes
 */
var femaleRabbit = Object.create(movingRabbit);
femaleRabbit.gender = "Female";
femaleRabbit.isPregnant = false;
femaleRabbit.pregnancyRounds = 0;

/**
 * The anthithesis of all other rabbits - the evil rabbit. Harbors horrible
 * animosity, enough to make itself self-sustainable on good rabbits
 */
var evilRabbit = Object.create(movingRabbit);
evilRabbit.faction = "Evil";
evilRabbit.starveTimer = STARVE_TIMER;
evilRabbit.speed = 3;

/**
 * COMPLETED PROTOTYPAL INHERITENCE SETUP
 */
//---------------------------------------------------------------

var tiles = [];

//Pushes NUM_ROW arrays into the tiles array
function setupTileList() {
  for (var i = 0; i < MAP_HEIGHT; i++) {
    tiles.push([]);
  }
}

  /**
  * Pushes into each individual array in the tiles array, a Tile object
  * Important: It gives each Tile its row and col number
  *
  * Index starts at 1
  */
function insertTiles() {
  for (var row = 1; row < MAP_HEIGHT+1; row++) {
    for (var col = 1; col < MAP_WIDTH+1; col++) {
      var newTile = Object.create(tile);
      newTile.realx = (col-1)*TILE_GRAPHIC_SIZE;
      newTile.realy = (row-1)*TILE_GRAPHIC_SIZE;
      newTile.row = row;
      newTile.col = col;
      tiles[row-1].push(newTile);
    }
  }
}

var rabbits = []; // Array with all the rabbits

  /**
  * TO BE UPDATED (With randomized stats, etc.)
  */
function initiateRabbits() {
  for (var i = 0; i < NUM_GOOD_MALE_RABBITS; i++) {
    var row = 1 + Math.floor(MAP_HEIGHT*Math.random());
    var col = 1 + Math.floor(MAP_WIDTH*Math.random());
    createRabbit("Male",CHILD_UNTIL_AGE+i,row,col);
  }
  for (var i = 0; i < NUM_GOOD_FEMALE_RABBITS; i++) {
    var row = 1 + Math.floor(MAP_HEIGHT*Math.random());
    var col = 1 + Math.floor(MAP_WIDTH*Math.random());
    createRabbit("Female",CHILD_UNTIL_AGE+i,row,col);
  }
  for (var i = 0; i < NUM_EVIL_RABBITS; i++) {
    var row = 1 + Math.floor(MAP_HEIGHT*Math.random());
    var col = 1 + Math.floor(MAP_WIDTH*Math.random());
    createEvil(row,col);
  }
}

function createRabbit(gender,age,row,col) {
  var moveChanceObj = Object.create(moveChance);
  var rabbit;
  if (gender === "Male") {
    rabbit = Object.create(maleRabbit);
  }
  else if (gender === "Female") {
    rabbit = Object.create(femaleRabbit);
  }
  rabbit.moveChance = moveChanceObj;
  rabbit.age = age;
  rabbit.row = row;
  rabbit.col = col;
  rabbits.push(rabbit);
}

function createEvil(row,col) {
  var moveChanceObj = Object.create(moveChance);
  var rabbit = Object.create(evilRabbit);
  rabbit.row = row;
  rabbit.col = col;
  rabbit.moveChance = moveChanceObj;
  rabbits.push(rabbit);
}

function isEven(num) {
  return !(num % 2);
}

  /**
  * Writes out the checker-board tile system.
  * Each even tile is a little lighter a color.
  * This is done through conditionals on checking "if it is even"
  */
function drawBackground() {
  for (row = 0; row < tiles.length; row++) {
    for (col = 0; col < tiles[row].length; col++) {
      tiles[row][col].drawBackground();
    }
  }
}

function retrieveListOfObjectsOnTile(row,col) {
  var arr = [];
  for (var i = 0; i < rabbits.length; i ++) {
    if (rabbits[i].row === row && rabbits[i].col === col)
      arr.push(rabbits[i]);
  }
  return arr;
}

function childbirth(row,col) {

  if(Math.random() < EVIL_CHANCE_SPAWN) {
    createEvil(row,col);
  }
  else if (Math.round(Math.random())) { //50% chance male, else female
    createRabbit("Male",0,row,col);
  }
  else {
    createRabbit("Female",0,row,col);
  }
}

function playOutEvents() {
  for (var i = 0; i < rabbits.length; i ++) {
    var rabbit = rabbits[i];
    if (rabbit.plagued === true) {//FIRST IF STATEMENT, PLAGUE EVENTS!
      rabbit.speed = 1;
      //Roll dice to see if they die or not (10% chance)
      (function () {
        if (Math.random() < PLAGUE_KILL_CHANCE) {

          rabbits.splice(i,1);
          i = i - 1;
        }
      })();
      continue;
    }
    if (rabbit.gender === "Female") { //SECOND IF, PREGNANCY EVENTS
      if (!rabbit.isPregnant) {
        var objectsOnTile = retrieveListOfObjectsOnTile(rabbit.row,rabbit.col);
        for (j = 0; j < objectsOnTile.length; j ++) {
          if (objectsOnTile[j].gender === "Male" && objectsOnTile[j].age >= 3)
            rabbit.isPregnant = true;
        }
      }

      else if (rabbit.pregnancyRounds === DAYS_UNTIL_BIRTH) {
        rabbit.pregnancyRounds = 0;
        rabbit.isPregnant = false;
        childbirth(rabbit.row,rabbit.col);
      }
      else {
        rabbit.pregnancyRounds = rabbit.pregnancyRounds + 1;
      }
    }
    if (rabbit.faction === "Evil") { // THIRD IF, EVIL KILLS RABBITS
      var killCounter = killAllOnTile(rabbit.row,rabbit.col);
      rabbit.starveTimer = rabbit.starveTimer + STARVE_INCREMENT_PER_KILL*killCounter;
      --rabbit.starveTimer;
      if (rabbit.starveTimer === 0) {
        rabbits.splice(i,1);
        i = i - 1;
        continue;
      }
    }                              // FOURTH IF, AGE KILLS GOOD RABBITS
    if (rabbit.age > AGE_DEATH && rabbit.faction !== "Evil") {
      rabbits.splice(i,1);
      i = i - 1;
    }
    rabbit.age += 1;
  }
}

function killAllOnTile(row,col) {
  var killCounter = 0;
  for (var i = 0; i < rabbits.length; i++) {
    var rabbit = rabbits[i];
    if (rabbit.row === row && rabbit.col === col && rabbit.faction !== "Evil") {
      rabbits.splice(i,1);
      i = i - 1;
      ++killCounter;
    }
  }
  return killCounter;
}

function firePlagueLeft() {
  plagueAnimation("Left");
}

function firePlagueRight() {
  plagueAnimation("Right");
}

function givePlagueLeft(direction) {
  for (var col = 1; col <= 6; col++) {
    for (var row = 1; row <= 10; row++) {
      rabbitsOnTile = retrieveListOfObjectsOnTile(row,col)
      for (let value of rabbitsOnTile) {
        value.plagueHit();
      }
    }
  }
}

function givePlagueRight(direction) {
  for (var col = 5; col <= 10; col++) {
    for (var row = 1; row <= 10; row++) {
      rabbitsOnTile = retrieveListOfObjectsOnTile(row,col)
      for (let value of rabbitsOnTile) {
        value.plagueHit();
      }
    }
  }
}

function plagueAnimation(direction) {
  var image;
  var x;
  if (direction === "Left") {
    givePlagueLeft();
    image = document.getElementById("plagueleft");
    x = 0;
  }
  if (direction === "Right") {
    givePlagueRight();
    image = document.getElementById("plagueright");
    x = 120;
  }
  for (var i = 0; i < 15; i ++) {
    setTimeout(function() {
      ctx.globalAlpha = 0.1;
      ctx.drawImage(image, x, 0);
      ctx.fillStyle = "darkgreen";
      ctx.fillRect(x, 0, 180, 300);
    }, i*60);
  }
  for (var i = 15; i < 35; i ++) {
    setTimeout(function() {
      ctx.globalAlpha = 0.15;
      drawBackground();
      drawProjectedMoves();
      drawRabbits();
    }, i*60);
  }
  for (var i = 25, j = 0.2; i < 39; i ++, j += 0.055) {
    (function(j) {
      setTimeout(function() {

        ctx.globalAlpha = j;
        drawBackground();
        drawProjectedMoves();
        drawRabbits();

      }, i*60);
    })(j)
  }
  setTimeout(function() {
    ctx.globalAlpha = 1;
    drawRabbits();
  },42*60);
}

function calculateMoves() {
  for (var i = 0; i < rabbits.length; i++) {
    rabbits[i].calculateMove();
  }
}

function drawProjectedMoves() {
  for (var i = 0; i < rabbits.length; i++) {
    rabbits[i].drawProjection();
  }
}

function drawRabbits() {
  for (var i = 0; i < rabbits.length; i++) {
    rabbits[i].draw();
  }
}

function checkForCollisions() {
  for (var i = 0; i < rabbits.length; i++) {
    rabbits[i].checkCollision();
  }
}

function moveRabbits() {
  for (var i = 0; i < rabbits.length; i++) {
    rabbits[i].move();
  }
}

(function setupGame() {
  setupTileList();
  insertTiles();
  initiateRabbits();
})();

var round = 0;

drawBackground();
checkForCollisions();
calculateMoves();
drawProjectedMoves();
drawRabbits();

function update() {
  drawBackground();
  moveRabbits();
  playOutEvents();
  checkForCollisions();
  calculateMoves();
  drawProjectedMoves();
  //playOutEvents();
  drawRabbits();
  ++round;
}
